/**
 * Database Transaction Utilities for D1
 * D1 doesn't support traditional BEGIN/COMMIT/ROLLBACK transactions
 * but we can use batch operations for atomic multi-query execution
 */

/**
 * Execute multiple queries as a batch (atomic)
 * All queries succeed or all fail
 * @param {D1Database} db - D1 database instance
 * @param {Array} queries - Array of {sql, bindings} objects
 * @returns {Promise<Array>} - Results from all queries
 */
export async function executeBatch(db, queries) {
  try {
    // Prepare all statements
    const statements = queries.map(q =>
      db.prepare(q.sql).bind(...(q.bindings || []))
    );

    // Execute as batch (atomic)
    const results = await db.batch(statements);

    return results;
  } catch (error) {
    console.error('Batch execution failed:', error);
    throw new Error(`Transaction failed: ${error.message}`);
  }
}

/**
 * Helper to create a query object for batch execution
 */
export function createQuery(sql, bindings = []) {
  return { sql, bindings };
}

/**
 * Execute a transaction-like operation with rollback capability
 * This is a helper for complex operations that need consistency
 */
export async function executeTransaction(db, callback) {
  try {
    // D1 batch operations are atomic
    // If any query fails, none are committed
    const queries = [];

    // Callback should populate queries array
    await callback(queries);

    // Execute all queries as batch
    return await executeBatch(db, queries);
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
