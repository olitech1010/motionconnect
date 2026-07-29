import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { Client } from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('Error: DATABASE_URL must be set in .env.local')
  process.exit(1)
}

async function runMigrationsAndSeed() {
  console.log('Connecting to Live Supabase Postgres database via Pooler...')
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('Connected!')

  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql')
    if (fs.existsSync(schemaPath)) {
      console.log('Running 001_initial_schema.sql...')
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
      await client.query(schemaSql)
      console.log('Schema migration applied successfully!')
    } else {
      console.warn('Warning: Schema migration file not found at', schemaPath)
    }

    const migration002Path = path.resolve(process.cwd(), 'supabase/migrations/002_user_device_tracking.sql')
    if (fs.existsSync(migration002Path)) {
      console.log('Running 002_user_device_tracking.sql...')
      const sql002 = fs.readFileSync(migration002Path, 'utf-8')
      await client.query(sql002)
      console.log('Migration 002 applied successfully!')
    } else {
      console.warn('Warning: Migration 002 file not found at', migration002Path)
    }

    const seedPath = path.resolve(process.cwd(), 'supabase/seed.sql')
    if (fs.existsSync(seedPath)) {
      console.log('Running seed.sql...')
      const seedSql = fs.readFileSync(seedPath, 'utf-8')
      await client.query(seedSql)
      console.log('Seed data inserted successfully!')
    } else {
      console.warn('Warning: Seed file not found at', seedPath)
    }

    console.log('--- Database migration & seeding complete! ---')
  } catch (err) {
    console.error('Error during database migration/seeding:', err)
  } finally {
    await client.end()
  }
}

runMigrationsAndSeed()
