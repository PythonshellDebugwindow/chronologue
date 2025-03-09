import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

export default pool.query.bind(pool);

export async function transact(callback: (client: pg.PoolClient) => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch(err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
