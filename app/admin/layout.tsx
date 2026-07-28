import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'Admin Console | Motion Connect',
  description: 'Manage Campus Wi-Fi packages, transactions, and MikroTik router provisioning.',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('mc_admin_session')

  let isAuthenticated = sessionCookie?.value === 'authenticated'

  if (!isAuthenticated) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        isAuthenticated = true
      }
    } catch {
      // Ignore if supabase not reachable or no user
    }
  }

  if (!isAuthenticated) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-[#F4F7FB] font-sans antialiased overflow-hidden selection:bg-[#1466B8]/15">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
