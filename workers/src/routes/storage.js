import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { ensureWebPExtension } from '../utils/webp.js';

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
        'Cache-Control': 'public, max-age=31536000',
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

    // For client-logo category, also include images from client_logos table
    if (category === 'client-logo') {
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
            category: 'client-logo'
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

    // Extract filename - in Workers, File objects may not have .name directly
    let filename = file.name || `upload-${Date.now()}.webp`;
    console.log('Original filename:', filename);
    filename = ensureWebPExtension(filename);
    console.log('Filename:', filename);

    const r2Key = generateUniqueKey(category, filename);
    console.log('R2 key:', r2Key);

    console.log('Uploading to R2...');
    const cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
    console.log('Upload successful, CDN URL:', cdnUrl);

    // Store in database
    console.log('Storing in database...');
    const db = c.env.DB;
    const fileSize = file.size || null;
    console.log('File size:', fileSize);
    const result = await db.prepare(
      'INSERT INTO image_storage (filename, r2_key, cdn_url, category, file_size) VALUES (?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, category, fileSize).run();
    console.log('Database insert successful');

    // Get the inserted ID
    const insertedId = result.meta.last_row_id;

    return c.json({
      success: true,
      id: insertedId,
      filename,
      cdn_url: cdnUrl,
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

    // Check client_logos
    const { results: logoResults } = await db.prepare(
      'SELECT id FROM client_logos WHERE r2_key = ?'
    ).bind(image.r2_key).all();
    if (logoResults.length > 0) usedIn.push('Logos');

    // If image is in use, prevent deletion
    if (usedIn.length > 0) {
      return c.json({
        error: `Cannot delete: This image is currently being used in ${usedIn.join(', ')}. Please remove it from there first, or delete it from that section which will also remove it from storage.`
      }, 409);
    }

    // Delete from R2
    await deleteFromR2(c.env.BUCKET, image.r2_key);

    // Delete from database
    await db.prepare('DELETE FROM image_storage WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

export default storage;
