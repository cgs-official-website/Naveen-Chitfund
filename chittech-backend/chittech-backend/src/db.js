const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error', err);
});

/**
 * Run a query. Optionally pass a client (for transactions).
 */
async function query(text, params, client) {
  const runner = client || pool;
  return runner.query(text, params);
}

/**
 * Run `fn` inside a transaction. `fn` receives a client and must use it
 * for all queries so they participate in the same transaction.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
