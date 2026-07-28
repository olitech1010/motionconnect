'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Wifi, Receipt, HardDrive, Activity, ShieldCheck, LogOut, ExternalLink, Users } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Subscribers & Users', href: '/admin/users', icon: Users },
  { label: 'Packages', href: '/admin/packages', icon: Wifi },
  { label: 'Transactions', href: '/admin/transactions', icon: Receipt },
  { label: 'Router & Hotspot', href: '/admin/routers', icon: HardDrive },
  { label: 'Activity Logs', href: '/admin/logs', icon: Activity },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <aside className="w-64 bg-canvas text-ink flex flex-col justify-between shrink-0 border-r border-hairline font-sans">
      {/* Top Brand & Nav */}
      <div>
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[4px] bg-kumo-brand flex items-center justify-center font-bold text-cream text-base shadow-sm">
              MC
            </div>
            <div>
              <div className="font-medium text-sm tracking-tight leading-none text-ink">Motion Connect</div>
              <div className="text-[10px] text-kumo-brand font-mono tracking-wider uppercase mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Console</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted">
            Management
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-kumo-brand text-cream shadow-sm'
                    : 'text-ink-soft hover:text-ink hover:bg-hairline/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cream' : 'text-muted'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pt-4 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted">
            Portal Access
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-full font-medium text-sm text-ink-soft hover:text-ink hover:bg-hairline/50 transition-all"
          >
            <span className="flex items-center gap-3">
              <Wifi className="w-4 h-4 text-ai" />
              <span>Captive Portal</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </nav>
      </div>

    </aside>
  )
}
