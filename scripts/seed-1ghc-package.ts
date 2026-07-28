import dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('Error: DATABASE_URL must be set in .env.local')
  process.exit(1)
}

async function add1GhcPackage() {
  console.log('Connecting to Live Supabase Postgres database via Pooler...')
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('Connected!')

  try {
    const query = `
      INSERT INTO packages (id, name, amount, data_limit, duration_label, mikrotik_profile, signal_bars)
      VALUES (
        gen_random_uuid(),
        'Test Package (1 GHC)',
        1.00,
        '1 GB',
        '1 Hour',
        '1hr_profile',
        3
      )
      ON CONFLICT (name) DO UPDATE 
      SET amount = EXCLUDED.amount, 
          data_limit = EXCLUDED.data_limit, 
          duration_label = EXCLUDED.duration_label;
    `
    await client.query(query)
    console.log('1 GHC Package added successfully!')
  } catch (err) {
    console.error('Error adding 1 GHC package:', err)
  } finally {
    await client.end()
  }
}

add1GhcPackage()
