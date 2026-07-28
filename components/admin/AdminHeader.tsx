'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'

export function AdminHeader() {
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
    <header className="h-16 border-b border-hairline bg-canvas px-8 flex items-center justify-end shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium text-ink">admin@motionconnect.com</div>
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider">Super Admin</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-hairline flex items-center justify-center text-ink-soft">
          <User className="w-4 h-4" />
        </div>
        <div className="w-px h-6 bg-hairline mx-2"></div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-ink-soft hover:text-emergency-red hover:bg-emergency-red/10 transition-colors font-mono text-[11px] font-bold uppercase tracking-wider"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
