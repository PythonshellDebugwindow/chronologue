import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

export default pool.query.bind(pool);

export async function transact<T>(callback: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect();
  let value: T | undefined = undefined;
  try {
    await client.query('BEGIN');
    value = await callback(client);
    await client.query('COMMIT');
  } catch(err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return value;
};
