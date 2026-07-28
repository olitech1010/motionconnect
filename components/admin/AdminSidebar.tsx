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
    <aside className="w-64 bg-[#0D1B2A] text-white flex flex-col justify-between shrink-0 border-r border-[#1B2D42]">
      {/* Top Brand & Nav */}
      <div>
        <div className="p-5 border-b border-[#1B2D42] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1466B8] to-[#05C46B] flex items-center justify-center font-black text-white text-base shadow-md shadow-[#05C46B]/20">
              MC
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight leading-none">Motion Connect</div>
              <div className="text-[10px] text-[#05C46B] font-bold tracking-wider uppercase mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Console</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            Management
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-[#1466B8] text-white shadow-md shadow-[#1466B8]/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pt-4 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            Portal Access
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span className="flex items-center gap-3">
              <Wifi className="w-4 h-4 text-[#05C46B]" />
              <span>Captive Portal</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-[#1B2D42] bg-[#0A1520]">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">admin@motionconect.com</div>
            <div className="text-[11px] text-zinc-400 truncate">Super Admin Role</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
