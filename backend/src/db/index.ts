import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

const query = pool.query.bind(pool);
export default query;

export async function transact(callback: (client: pg.PoolClient) => Promise<void | (() => void)>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const onCommit = await callback(client);
    await client.query('COMMIT');
    if(onCommit) {
      onCommit();
    }
  } catch(err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function transactWithResult<T>(callback: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch(err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
