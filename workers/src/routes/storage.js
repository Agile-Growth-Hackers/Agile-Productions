import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { validateFileSize } from '../utils/file-validation.js';
import { ensureWebPExtension } from '../utils/webp.js';
import { compressImage, getMobileDimensions, shouldOptimizeForMobile } from '../utils/tinypng.js';

const storage = new Hono();

// Download image with proper headers (must come before /:category route)
storage.get('/download/:r2Key', async (c) => {
  try {
    const r2Key = decodeURIComponent(c.req.param('r2Key'));
    const db = c.env.DB;

    // Get image info from database to get filename
    const { results } = await db.prepare(
      'SELECT filename FROM image_storage WHERE r2_key = ?'
    ).bind(r2Key).all();

    const filename = results[0]?.filename || 'download.webp';

    // Fetch from R2
    const object = await c.env.BUCKET.get(r2Key);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Return with download headers
    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=600, s-maxage=31536000',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return c.json({ error: 'Download failed' }, 500);
  }
});

// Get all images by category
storage.get('/:category', async (c) => {
  try {
    const category = c.req.param('category');
    const db = c.env.DB;

    // For logos/client category, also include images from client_logos table
    if (category === 'logos/client') {
      // Get from image_storage
      const { results: storageResults } = await db.prepare(
        'SELECT * FROM image_storage WHERE category = ? ORDER BY created_at DESC'
      ).bind(category).all();

      // Get from client_logos table (these might not be in image_storage yet)
      const { results: logoResults } = await db.prepare(
        'SELECT id, filename, r2_key, cdn_url, created_at FROM client_logos ORDER BY created_at DESC'
      ).all();

      // Merge and deduplicate by r2_key
      const merged = [...storageResults];
      const existingKeys = new Set(storageResults.map(img => img.r2_key));

      for (const logo of logoResults) {
        if (!existingKeys.has(logo.r2_key)) {
          merged.push({
            ...logo,
            category: 'logos/client'
          });
        }
      }

      return c.json(merged);
    }

    // For other categories, just fetch from image_storage
    const { results } = await db.prepare(
      'SELECT * FROM image_storage WHERE category = ? ORDER BY created_at DESC'
    ).bind(category).all();

    return c.json(results);
  } catch (error) {
    console.error('Storage fetch error:', error);
    return c.json({ error: 'Failed to fetch images' }, 500);
  }
});

// Upload new image to storage
storage.post('/', async (c) => {
  try {
    console.log('Starting upload...');

    const formData = await c.req.formData();
    console.log('FormData parsed');

    const file = formData.get('image');
    const category = formData.get('category');
    console.log('File:', file ? 'received' : 'missing', 'Category:', category);

    if (!file || !category) {
      return c.json({ error: 'Image and category required' }, 400);
    }

    // Validate file size (30MB max for content images)
    try {
      validateFileSize(file, 'CONTENT_IMAGE');
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    // Extract filename - in Workers, File objects may not have .name directly
    let filename = file.name || `upload-${Date.now()}.webp`;
    console.log('Original filename:', filename);
    filename = ensureWebPExtension(filename);
    console.log('Filename:', filename);

    const r2Key = generateUniqueKey(category, filename);
    console.log('R2 key:', r2Key);

    // Optimize images with TinyPNG if available
    let cdnUrl;
    let cdnUrlMobile = null;

    if (shouldOptimizeForMobile(category) && c.env.TINYPNG_API_KEY) {
      try {
        // Convert file to ArrayBuffer once
        const imageBuffer = await file.arrayBuffer();

        // 1. Compress desktop version with TinyPNG (no resize, just compress)
        console.log('Compressing desktop version with TinyPNG...');
        const desktopBuffer = await compressImage(
          imageBuffer,
          c.env.TINYPNG_API_KEY,
          {} // No dimensions = compression only
        );

        const desktopFile = new File([desktopBuffer], filename, {
          type: 'image/webp'
        });

        console.log('Uploading compressed desktop version to R2...');
        cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, desktopFile, 'image/webp');
        console.log('Desktop upload successful, CDN URL:', cdnUrl);

        // 2. Create mobile version (resize + compress)
        console.log('Creating mobile version with TinyPNG...');
        const mobileDims = getMobileDimensions(category);
        console.log(`Mobile dimensions for ${category}:`, mobileDims);

        const mobileBuffer = await compressImage(
          imageBuffer,
          c.env.TINYPNG_API_KEY,
          mobileDims
        );

        const mobileR2Key = r2Key.replace(/\.webp$/, '-mobile.webp');
        const mobileFile = new File([mobileBuffer], filename.replace(/\.webp$/, '-mobile.webp'), {
          type: 'image/webp'
        });

        console.log('Uploading mobile version to R2...');
        cdnUrlMobile = await uploadToR2(c.env.BUCKET, mobileR2Key, mobileFile, 'image/webp');
        console.log('Mobile upload successful, CDN URL:', cdnUrlMobile);
      } catch (error) {
        console.error('TinyPNG optimization failed, uploading original:', error);
        // Fallback: upload original file if TinyPNG fails
        cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
      }
    } else {
      // No TinyPNG available, upload original
      console.log('Uploading original to R2 (no TinyPNG)...');
      cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
    }

    // Store in database
    console.log('Storing in database...');
    const db = c.env.DB;
    const fileSize = file.size || null;
    console.log('File size:', fileSize);
    const result = await db.prepare(
      'INSERT INTO image_storage (filename, r2_key, cdn_url, cdn_url_mobile, category, file_size) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, category, fileSize).run();
    console.log('Database insert successful');

    // Get the inserted ID
    const insertedId = result.meta.last_row_id;

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'image_upload',
        entityType: 'image_storage',
        entityId: insertedId,
        description: `Uploaded image to storage: ${filename}`,
        newValues: { filename, category, r2Key, fileSize }
      });
    }

    return c.json({
      success: true,
      id: insertedId,
      filename,
      cdn_url: cdnUrl,
      cdn_url_mobile: cdnUrlMobile,
      r2_key: r2Key,
      category,
      file_size: fileSize
    });
  } catch (error) {
    console.error('Upload error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return c.json({ error: `Upload failed: ${error.message}` }, 500);
  }
});

// Update/rename image in storage
storage.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { filename } = await c.req.json();
    const db = c.env.DB;

    if (!filename) {
      return c.json({ error: 'Filename required' }, 400);
    }

    // Update filename in database
    await db.prepare(
      'UPDATE image_storage SET filename = ? WHERE id = ?'
    ).bind(filename, id).run();

    return c.json({ success: true, filename });
  } catch (error) {
    console.error('Rename error:', error);
    return c.json({ error: 'Rename failed' }, 500);
  }
});

// Delete image from storage
storage.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    // Get image info
    const { results } = await db.prepare(
      'SELECT * FROM image_storage WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const image = results[0];

    // Check if image is being used in any table
    const usedIn = [];

    // Check slider_images
    const { results: sliderResults } = await db.prepare(
      'SELECT id FROM slider_images WHERE r2_key = ?'
    ).bind(image.r2_key).all();
    if (sliderResults.length > 0) usedIn.push('Slider');

    // Check gallery_images
    const { results: galleryResults } = await db.prepare(
      'SELECT id FROM gallery_images WHERE r2_key = ?'
    ).bind(image.r2_key).all();
    if (galleryResults.length > 0) usedIn.push('Gallery');

    // Check client_logos (only active logos)
    const { results: logoResults } = await db.prepare(
      'SELECT id FROM client_logos WHERE r2_key = ? AND is_active = 1'
    ).bind(image.r2_key).all();
    if (logoResults.length > 0) usedIn.push('Logos');

    // If image is in use, prevent deletion
    if (usedIn.length > 0) {
      return c.json({
        error: `Cannot delete: This image is currently being used in ${usedIn.join(', ')}. Please remove it from there first, or delete it from that section which will also remove it from storage.`
      }, 409);
    }

    // Delete from R2 (both desktop and mobile versions)
    await deleteFromR2(c.env.BUCKET, image.r2_key);

    // Delete mobile version if it exists
    if (image.cdn_url_mobile) {
      const mobileKey = image.r2_key.replace(/\.webp$/, '-mobile.webp');
      await deleteFromR2(c.env.BUCKET, mobileKey);
    }

    // Delete from database
    await db.prepare('DELETE FROM image_storage WHERE id = ?').bind(id).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'image_delete',
        entityType: 'image_storage',
        entityId: id,
        description: `Deleted image from storage: ${image.filename}`,
        oldValues: image
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

export default storage;
