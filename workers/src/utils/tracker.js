/**
 * Usage Tracker - Manually track R2 operations and Workers requests
 * Stores monthly counters in D1 database
 */

/**
 * Get or create the current month's tracker
 */
async function getCurrentTracker(db) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  try {
    // Try to get existing tracker for this month
    const { results } = await db.prepare(
      'SELECT * FROM usage_tracker WHERE month = ? LIMIT 1'
    ).bind(currentMonth).all();

    if (results && results.length > 0) {
      return results[0];
    }

    // Create new tracker for this month
    await db.prepare(
      `INSERT INTO usage_tracker (
        month, r2_class_a, r2_class_b, workers_requests,
        r2_egress_gb, d1_reads, d1_writes, last_updated
      ) VALUES (?, 0, 0, 0, 0, 0, 0, CURRENT_TIMESTAMP)`
    ).bind(currentMonth).run();

    // Return the newly created tracker
    const { results: newResults } = await db.prepare(
      'SELECT * FROM usage_tracker WHERE month = ? LIMIT 1'
    ).bind(currentMonth).all();

    return newResults[0];
  } catch (error) {
    console.error('Error getting/creating tracker:', error);
    return null;
  }
}

/**
 * Track R2 Class A operation (write, list, delete)
 */
export async function trackR2ClassA(db, count = 1) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    await db.prepare(
      `UPDATE usage_tracker
       SET r2_class_a = r2_class_a + ?,
           last_updated = CURRENT_TIMESTAMP
       WHERE month = ?`
    ).bind(count, currentMonth).run();

    // If update affected 0 rows, create the tracker
    const tracker = await getCurrentTracker(db);
    if (tracker) {
      await db.prepare(
        `UPDATE usage_tracker
         SET r2_class_a = r2_class_a + ?,
             last_updated = CURRENT_TIMESTAMP
         WHERE month = ?`
      ).bind(count, currentMonth).run();
    }
  } catch (error) {
    console.error('Error tracking R2 Class A:', error);
  }
}

/**
 * Track R2 Class B operation (read, head)
 */
export async function trackR2ClassB(db, count = 1) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    await db.prepare(
      `UPDATE usage_tracker
       SET r2_class_b = r2_class_b + ?,
           last_updated = CURRENT_TIMESTAMP
       WHERE month = ?`
    ).bind(count, currentMonth).run();

    // If update affected 0 rows, create the tracker
    const tracker = await getCurrentTracker(db);
    if (tracker) {
      await db.prepare(
        `UPDATE usage_tracker
         SET r2_class_b = r2_class_b + ?,
             last_updated = CURRENT_TIMESTAMP
         WHERE month = ?`
      ).bind(count, currentMonth).run();
    }
  } catch (error) {
    console.error('Error tracking R2 Class B:', error);
  }
}

/**
 * Track Workers request
 */
export async function trackWorkersRequest(db) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    await db.prepare(
      `UPDATE usage_tracker
       SET workers_requests = workers_requests + 1,
           last_updated = CURRENT_TIMESTAMP
       WHERE month = ?`
    ).bind(currentMonth).run();

    // If update affected 0 rows, create the tracker
    const tracker = await getCurrentTracker(db);
    if (tracker) {
      await db.prepare(
        `UPDATE usage_tracker
         SET workers_requests = workers_requests + 1,
             last_updated = CURRENT_TIMESTAMP
         WHERE month = ?`
      ).bind(currentMonth).run();
    }
  } catch (error) {
    console.error('Error tracking Workers request:', error);
  }
}

/**
 * Initialize usage_tracker table
 */
export async function initializeTrackerTable(db) {
  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS usage_tracker (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT UNIQUE NOT NULL,
        r2_class_a INTEGER DEFAULT 0,
        r2_class_b INTEGER DEFAULT 0,
        workers_requests INTEGER DEFAULT 0,
        r2_egress_gb REAL DEFAULT 0,
        d1_reads INTEGER DEFAULT 0,
        d1_writes INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();

    console.log('Usage tracker table initialized');
    return true;
  } catch (error) {
    console.error('Error initializing tracker table:', error);
    return false;
  }
}
