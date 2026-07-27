import React from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'Admin Console | Motion Connect',
  description: 'Manage Campus Wi-Fi packages, transactions, and MikroTik router provisioning.',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F4F7FB] font-sans antialiased overflow-hidden selection:bg-[#1466B8]/15">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
