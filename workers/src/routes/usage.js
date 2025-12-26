import { Hono } from 'hono';
import { getWorkersAnalytics, getTodayRange, getCurrentMonthRange } from '../utils/analytics.js';
import { initializeTrackerTable } from '../utils/tracker.js';

const usage = new Hono();

usage.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const bucket = c.env.BUCKET;

    console.log('Fetching usage stats...');

    // Fetch R2 storage usage
    const r2Stats = await getR2Stats(bucket, db);
    console.log('R2 Stats:', r2Stats);

    // Fetch D1 database usage (actual database query)
    const d1Stats = await getD1Stats(db);
    console.log('D1 Stats:', d1Stats);

    // Fetch Workers Analytics from Cloudflare API (if token available)
    let workersRequests = 0;
    let workersErrors = 0;
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
          workersErrors = analytics.errors;
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

    const response = {
      r2: {
        storage_gb: r2Stats.storage_gb,
      },
      workers: {
        requests: workersRequests, // From Cloudflare Analytics API
        errors: workersErrors, // From Cloudflare Analytics API
        analytics_available: c.env.CF_API_TOKEN ? true : false,
      },
      d1: {
        total_rows: d1Stats.total_rows,
        size_mb: d1Stats.size_mb,
      },
    };

    console.log('Usage response:', JSON.stringify(response));
    return c.json(response);
  } catch (error) {
    console.error('Usage stats error:', error);
    return c.json({ error: 'Failed to fetch usage stats: ' + error.message }, 500);
  }
});

async function getR2Stats(bucket, db) {
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

export default usage;
