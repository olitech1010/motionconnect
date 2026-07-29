'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid login credentials')
      }

      router.push('/admin')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 font-sans antialiased selection:bg-kumo-brand/20">
      <div className="w-full max-w-md bg-canvas rounded-lg overflow-hidden border border-hairline shadow-sm">
        {/* Header */}
        <div className="bg-ink p-8 text-cream text-center relative border-b border-hairline">
          <div className="w-14 h-14 rounded-md bg-kumo-brand text-cream flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-sm">
            MC
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cream/10 border border-cream/20 font-mono text-[11px] font-bold uppercase tracking-widest mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-ai" />
            <span>Authorized Personnel Only</span>
          </div>
          <h1 className="text-2xl font-medium tracking-tight">Admin Console Login</h1>
          <p className="font-mono text-[12px] text-cream/70 mt-1">Manage Wi-Fi plans, MikroTik RB5009, & transactions</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-md bg-emergency-red/10 border border-emergency-red/20 text-emergency-red font-mono text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@motionconnect.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-canvas border border-hairline rounded-md font-mono text-sm text-ink focus:outline-none focus:border-kumo-brand transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-pass" className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-canvas border border-hairline rounded-md font-mono text-sm text-ink focus:outline-none focus:border-kumo-brand transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-md bg-kumo-brand text-cream font-bold text-sm hover:bg-kumo-brand-dark active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
