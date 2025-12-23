import { Hono } from 'hono';

const usage = new Hono();

usage.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const bucket = c.env.BUCKET;

    // Fetch R2 storage usage
    const r2Stats = await getR2Stats(bucket);

    // Fetch D1 database usage
    const d1Stats = await getD1Stats(db);

    // Fetch file counts by category
    const fileCounts = await getFileCounts(db);

    // Fetch operations tracker (if exists)
    const operations = await getOperationsTracker(db);

    return c.json({
      r2: {
        storage_gb: r2Stats.storage_gb,
        class_a_operations: operations.r2_class_a || 0,
        class_b_operations: operations.r2_class_b || 0,
        egress_gb: operations.r2_egress_gb || 0,
      },
      workers: {
        requests: operations.workers_requests || 0,
      },
      d1: {
        total_rows: d1Stats.total_rows,
        size_mb: d1Stats.size_mb,
        reads: operations.d1_reads || 0,
        writes: operations.d1_writes || 0,
      },
      bandwidth: {
        egress_gb: operations.r2_egress_gb || 0,
      },
      files: fileCounts,
      last_reset: operations.last_reset || null,
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    return c.json({ error: 'Failed to fetch usage stats' }, 500);
  }
});

async function getR2Stats(bucket) {
  try {
    const listed = await bucket.list();
    const objects = listed.objects;

    // Calculate total storage in bytes, then convert to GB
    let totalBytes = 0;
    for (const obj of objects) {
      totalBytes += obj.size || 0;
    }

    const storage_gb = (totalBytes / (1024 * 1024 * 1024)).toFixed(3);

    return {
      storage_gb: parseFloat(storage_gb),
      total_files: objects.length,
    };
  } catch (error) {
    console.error('R2 stats error:', error);
    return {
      storage_gb: 0,
      total_files: 0,
    };
  }
}

async function getD1Stats(db) {
  try {
    // Count total rows across all tables
    const tables = ['slider_images', 'gallery_images', 'client_logos', 'admin_users'];
    let total_rows = 0;

    for (const table of tables) {
      const { results } = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).all();
      total_rows += results[0]?.count || 0;
    }

    // Get database size (approximate - D1 doesn't provide exact size)
    // Rough estimate: assume average row size of 1KB
    const size_mb = ((total_rows * 1024) / (1024 * 1024)).toFixed(2);

    return {
      total_rows,
      size_mb: parseFloat(size_mb),
    };
  } catch (error) {
    console.error('D1 stats error:', error);
    return {
      total_rows: 0,
      size_mb: 0,
    };
  }
}

async function getFileCounts(db) {
  try {
    // Count slider images
    const { results: sliderResults } = await db.prepare(
      'SELECT COUNT(*) as count FROM slider_images WHERE r2_key IS NOT NULL'
    ).all();
    const slider = sliderResults[0]?.count || 0;

    // Count gallery images
    const { results: galleryResults } = await db.prepare(
      'SELECT COUNT(*) as count FROM gallery_images WHERE r2_key IS NOT NULL'
    ).all();
    const gallery = galleryResults[0]?.count || 0;

    // Count logos
    const { results: logosResults } = await db.prepare(
      'SELECT COUNT(*) as count FROM client_logos WHERE r2_key IS NOT NULL'
    ).all();
    const logos = logosResults[0]?.count || 0;

    return {
      slider,
      gallery,
      logos,
      total: slider + gallery + logos,
    };
  } catch (error) {
    console.error('File counts error:', error);
    return {
      slider: 0,
      gallery: 0,
      logos: 0,
      total: 0,
    };
  }
}

async function getOperationsTracker(db) {
  try {
    // Try to get the current month's operations tracker
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const { results } = await db.prepare(
      'SELECT * FROM usage_tracker WHERE month = ? LIMIT 1'
    ).bind(currentMonth).all();

    if (results && results.length > 0) {
      return results[0];
    }

    // Return empty tracker if table doesn't exist or no data
    return {
      r2_class_a: 0,
      r2_class_b: 0,
      r2_egress_gb: 0,
      workers_requests: 0,
      d1_reads: 0,
      d1_writes: 0,
      last_reset: null,
    };
  } catch (error) {
    // Table might not exist yet - return zeros
    console.log('Usage tracker not available:', error.message);
    return {
      r2_class_a: 0,
      r2_class_b: 0,
      r2_egress_gb: 0,
      workers_requests: 0,
      d1_reads: 0,
      d1_writes: 0,
      last_reset: null,
    };
  }
}

export default usage;
