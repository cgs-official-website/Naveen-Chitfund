import pg from 'pg';
const { Pool } = pg;

const isInternalOrLocal =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1') ||
  process.env.DATABASE_URL.includes('.railway.internal') ||
  process.env.DATABASE_URL.includes('sslmode=disable');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isInternalOrLocal
    ? false
    : process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
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

/**
 * Append an immutable record to the audit_events table.
 * Accepts either pool or client (for in-transaction audit logging).
 */
async function logAuditEvent(runner, {
  eventType,
  actorId = null,
  entityType,
  entityId = null,
  beforeState = null,
  afterState = null,
  metadata = {},
  ipAddress = null,
}) {
  const q = runner || pool;
  return q.query(
    `INSERT INTO audit_events
       (event_type, actor_id, entity_type, entity_id, before_state, after_state, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      eventType,
      actorId,
      entityType,
      entityId ? String(entityId) : null,
      beforeState ? JSON.stringify(beforeState) : null,
      afterState ? JSON.stringify(afterState) : null,
      JSON.stringify(metadata || {}),
      ipAddress,
    ]
  );
}

export { pool, query, withTransaction, logAuditEvent };

