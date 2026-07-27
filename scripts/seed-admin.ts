import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@motionconect.com'
  const password = process.env.ADMIN_SEED_PASSWORD || '00000000'

  console.log(`Checking if admin user exists (${email})...`)

  // Check if user already exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error listing auth users:', listError.message)
    process.exit(1)
  }

  const existingUser = usersData.users.find((u) => u.email === email)
  if (existingUser) {
    console.log(`Admin user already exists with ID: ${existingUser.id}`)
    console.log('Updating password to ensure it matches seed...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      user_metadata: { role: 'admin' },
    })
    if (updateError) {
      console.error('Error updating admin password:', updateError.message)
    } else {
      console.log('--- Admin user verified and ready! ---')
    }
    return
  }

  console.log('Creating new admin user in Supabase Auth...')
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  })

  if (createError) {
    console.error('Error creating admin user:', createError.message)
    process.exit(1)
  }

  console.log(`--- Success! Admin user created with ID: ${newUser.user.id} ---`)
}

seedAdmin().catch((err) => {
  console.error('Unhandled seed error:', err)
  process.exit(1)
})
