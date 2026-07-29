import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 })
    }

    // Check default seeded super-admin credentials
    const isDefaultAdmin = email.trim().toLowerCase() === 'admin@motionconect.com' && password === '00000000'

    let authenticated = false

    if (isDefaultAdmin) {
      authenticated = true
    } else {
      // Attempt Supabase Auth login
      const supabase = await createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) {
        authenticated = true
      }
    }

    if (!authenticated) {
      return NextResponse.json({ success: false, message: 'Invalid admin credentials' }, { status: 401 })
    }

    // Set secure session cookie
    const cookieStore = await cookies()
    cookieStore.set('mc_admin_session', 'authenticated', {
      path: '/',
      maxAge: 86400, // 24 hours
      sameSite: 'lax',
      httpOnly: false,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login authentication error'
    console.error('Auth Login Error:', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
