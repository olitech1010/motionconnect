'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown } from 'lucide-react'

export function AdminHeader() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 border-b border-hairline bg-canvas px-8 flex items-center justify-end shrink-0 shadow-sm relative z-10">
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium text-ink">admin@motionconnect.com</div>
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider">Super Admin</div>
        </div>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 hover:bg-hairline/50 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-hairline flex items-center justify-center text-ink-soft">
              <User className="w-4 h-4" />
            </div>
            <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-canvas border border-hairline rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-hairline sm:hidden">
                <div className="text-xs font-medium text-ink truncate">admin@motionconnect.com</div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mt-0.5">Super Admin</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-ink-soft hover:text-emergency-red hover:bg-emergency-red/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
