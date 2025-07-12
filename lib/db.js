// lib/db.js
import { Pool } from 'pg';

// Database connection pool
let _pool;

function createPool() {
  // Use connection string if available, otherwise use individual config
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    return new Pool({
      connectionString: connectionString,
      ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased timeout for cloud databases
    });
  } else {
    return new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'rewear',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
}

export function getPool() {
  if (!_pool) {
    _pool = createPool();
  }
  return _pool;
}

// Export the pool for direct access
export const pool = getPool();

export async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getClient() {
  return await getPool().connect();
}

// Close the pool when the process terminates
process.on('SIGTERM', () => {
  _pool?.end();
});

process.on('SIGINT', () => {
  _pool?.end();
});
