import { Hono } from 'hono';
import { getWorkersAnalytics, getTodayRange, getCurrentMonthRange } from '../utils/analytics.js';

const usage = new Hono();

usage.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const bucket = c.env.BUCKET;

    console.log('Fetching usage stats...');

    // Fetch R2 storage usage
    const r2Stats = await getR2Stats(bucket);
    console.log('R2 Stats:', r2Stats);

    // Fetch D1 database usage (actual database query)
    const d1Stats = await getD1Stats(db);
    console.log('D1 Stats:', d1Stats);

    // Fetch file counts by category
    const fileCounts = await getFileCounts(db);
    console.log('File Counts:', fileCounts);

    // Fetch Workers Analytics from Cloudflare API (if token available)
    let workersRequests = 0;
    if (c.env.CF_API_TOKEN) {
      try {
        const todayRange = getTodayRange();
        const analytics = await getWorkersAnalytics(
          c.env.ACCOUNT_ID || 'a80eabbb536a884ecd8ba3dc123bee10',
          c.env.CF_API_TOKEN,
          'agile-productions-api',
          todayRange.start,
          todayRange.end
        );

        if (analytics.success) {
          workersRequests = analytics.requests;
          console.log('Workers Analytics:', analytics);
        } else {
          console.warn('Analytics API not available:', analytics.error);
        }
      } catch (analyticsError) {
        console.error('Analytics fetch error:', analyticsError);
      }
    } else {
      console.log('CF_API_TOKEN not configured - using fallback for Workers requests');
    }

    // Fetch operations tracker (if exists) - fallback
    const operations = await getOperationsTracker(db);
    console.log('Operations tracker:', operations);

    const response = {
      r2: {
        storage_gb: r2Stats.storage_gb,
        total_files: r2Stats.total_files, // Actual R2 bucket count
        class_a_operations: operations.r2_class_a || 0, // TODO: Track manually
        class_b_operations: operations.r2_class_b || 0, // TODO: Track manually
        egress_gb: operations.r2_egress_gb || 0,
      },
      workers: {
        requests: workersRequests, // From Cloudflare Analytics API
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
      files: {
        total: r2Stats.total_files, // Use R2 actual count, not database count
        ...fileCounts, // Still include category breakdown
      },
      last_reset: operations.last_reset || null,
    };

    console.log('Usage response:', JSON.stringify(response));
    return c.json(response);
  } catch (error) {
    console.error('Usage stats error:', error);
    return c.json({ error: 'Failed to fetch usage stats: ' + error.message }, 500);
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
    // First, get all actual tables from sqlite_master
    const { results: tableList } = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
    ).all();

    const actualTables = tableList.map(t => t.name);
    console.log('Actual D1 tables:', actualTables);

    // Count total rows across all actual tables
    let total_rows = 0;
    const tableCounts = {};

    for (const table of actualTables) {
      try {
        const { results } = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).all();
        const count = results[0]?.count || 0;
        tableCounts[table] = count;
        total_rows += count;
        console.log(`Table ${table}: ${count} rows`);
      } catch (tableError) {
        console.error(`Error counting ${table}:`, tableError);
        tableCounts[table] = 0;
      }
    }

    // Get database size estimate
    // D1 doesn't provide exact size via API, so we estimate
    // Assume average row size of 2KB (more realistic for tables with images/text)
    const size_mb = parseFloat(((total_rows * 2048) / (1024 * 1024)).toFixed(2));

    console.log('D1 Stats:', { total_rows, size_mb, tableCounts, actualTables });

    return {
      total_rows,
      size_mb,
      table_count: actualTables.length,
    };
  } catch (error) {
    console.error('D1 stats error:', error);
    return {
      total_rows: 0,
      size_mb: 0,
      table_count: 0,
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
