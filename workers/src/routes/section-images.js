import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { compressImage, getMobileDimensions } from '../utils/tinypng.js';
import { validateImageMimeType, getInvalidFileTypeError } from '../utils/mime-validation.js';
import { sanitizeFilename, sanitize } from '../utils/sanitize.js';

const sectionImages = new Hono();

// Get all section images for a region
sectionImages.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    const { results } = await db.prepare(
      'SELECT * FROM section_images WHERE region_code = ? AND is_active = 1'
    ).bind(region).all();

    return c.json(results);
  } catch (error) {
    console.error('Failed to fetch section images:', error);
    return c.json({ error: 'Failed to fetch section images' }, 500);
  }
});

// Upload/update section image
sectionImages.post('/:sectionKey', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');
    const sectionKey = c.req.param('sectionKey');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    if (!contentType.includes('multipart/form-data')) {
      return c.json({ error: 'Invalid content type' }, 400);
    }

    const formData = await c.req.formData();
    const imageFile = formData.get('image');
    const altText = sanitize(formData.get('alt_text')) || '';

    if (!imageFile) {
      return c.json({ error: 'Image file required' }, 400);
    }

    const isValidImage = await validateImageMimeType(imageFile);
    if (!isValidImage) {
      return c.json({ error: getInvalidFileTypeError() }, 400);
    }

    const filename = sanitizeFilename(imageFile.name);
    const r2Key = generateUniqueKey(`sections/${region.toLowerCase()}`, filename);

    let cdnUrl = null, cdnUrlMobile = null;

    // Compress with TinyPNG if available
    if (c.env.TINYPNG_API_KEY) {
      try {
        const imageBuffer = await imageFile.arrayBuffer();

        // Compress desktop version
        const desktopBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, {});
        const desktopFile = new File([desktopBuffer], filename, { type: 'image/webp' });
        cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, desktopFile, 'image/webp');

        // Create mobile version
        const mobileDims = getMobileDimensions('section');
        const mobileBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, mobileDims);
        const mobileR2Key = r2Key.replace(/\.webp$/, '-mobile.webp');
        const mobileFile = new File([mobileBuffer], filename.replace(/\.webp$/, '-mobile.webp'), { type: 'image/webp' });
        cdnUrlMobile = await uploadToR2(c.env.BUCKET, mobileR2Key, mobileFile, 'image/webp');
      } catch (error) {
        console.error('TinyPNG failed, uploading original:', error);
        cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, imageFile, 'image/webp');
      }
    } else {
      cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, imageFile, 'image/webp');
    }

    // Check if section image already exists for this key/region
    const { results: existing } = await db.prepare(
      'SELECT * FROM section_images WHERE region_code = ? AND section_key = ?'
    ).bind(region, sectionKey).all();

    if (existing && existing.length > 0) {
      // Delete old R2 files
      if (existing[0].r2_key) {
        await deleteFromR2(c.env.BUCKET, existing[0].r2_key);
        const oldMobileKey = existing[0].r2_key.replace(/\.webp$/, '-mobile.webp');
        await deleteFromR2(c.env.BUCKET, oldMobileKey);
      }

      // Update existing record
      await db.prepare(
        'UPDATE section_images SET filename = ?, r2_key = ?, cdn_url = ?, cdn_url_mobile = ?, alt_text = ?, updated_at = CURRENT_TIMESTAMP ' +
        'WHERE region_code = ? AND section_key = ?'
      ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, altText, region, sectionKey).run();
    } else {
      // Insert new record
      await db.prepare(
        'INSERT INTO section_images (region_code, section_key, filename, r2_key, cdn_url, cdn_url_mobile, alt_text) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(region, sectionKey, filename, r2Key, cdnUrl, cdnUrlMobile, altText).run();
    }

    return c.json({
      section_key: sectionKey,
      region_code: region,
      filename,
      r2_key: r2Key,
      cdn_url: cdnUrl,
      cdn_url_mobile: cdnUrlMobile,
      alt_text: altText,
      is_active: 1
    });
  } catch (error) {
    console.error('Failed to upload section image:', error);
    return c.json({ error: 'Failed to upload section image' }, 500);
  }
});

// Delete section image
sectionImages.delete('/:sectionKey', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');
    const sectionKey = c.req.param('sectionKey');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get section image to delete R2 files
    const { results } = await db.prepare(
      'SELECT * FROM section_images WHERE region_code = ? AND section_key = ?'
    ).bind(region, sectionKey).all();

    if (!results || results.length === 0) {
      return c.json({ error: 'Section image not found' }, 404);
    }

    const sectionImage = results[0];

    // Delete from R2
    if (sectionImage.r2_key) {
      await deleteFromR2(c.env.BUCKET, sectionImage.r2_key);
      // Delete mobile version
      const mobileKey = sectionImage.r2_key.replace(/\.webp$/, '-mobile.webp');
      await deleteFromR2(c.env.BUCKET, mobileKey);
    }

    // Delete from database
    await db.prepare(
      'DELETE FROM section_images WHERE region_code = ? AND section_key = ?'
    ).bind(region, sectionKey).run();

    return c.json({ success: true, message: 'Section image deleted' });
  } catch (error) {
    console.error('Failed to delete section image:', error);
    return c.json({ error: 'Failed to delete section image' }, 500);
  }
});

// Update alt text only
sectionImages.put('/:sectionKey/alt-text', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');
    const sectionKey = c.req.param('sectionKey');
    const { alt_text } = await c.req.json();

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Update alt text
    const result = await db.prepare(
      'UPDATE section_images SET alt_text = ?, updated_at = CURRENT_TIMESTAMP WHERE region_code = ? AND section_key = ?'
    ).bind(sanitize(alt_text), region, sectionKey).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Section image not found' }, 404);
    }

    return c.json({ success: true, message: 'Alt text updated', alt_text });
  } catch (error) {
    console.error('Failed to update alt text:', error);
    return c.json({ error: 'Failed to update alt text' }, 500);
  }
});

export default sectionImages;
