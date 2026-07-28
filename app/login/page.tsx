'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@motionconect.com')
  const [password, setPassword] = useState('00000000')
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
    <div className="min-h-screen bg-[#0A1520] flex items-center justify-center p-4 font-sans antialiased selection:bg-[#05C46B]/20">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0D1B2A] via-[#1466B8] to-[#0C3358] p-8 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1466B8] to-[#05C46B] text-white flex items-center justify-center font-black text-2xl mx-auto mb-4 shadow-lg shadow-[#05C46B]/25">
            MC
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-extrabold uppercase tracking-widest mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#05C46B]" />
            <span>Authorized Personnel Only</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Admin Console Login</h1>
          <p className="text-xs text-white/70 mt-1">Manage Wi-Fi plans, MikroTik RB5009, & transactions</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@motionconect.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl font-semibold text-sm text-[#0D1B2A] focus:outline-none focus:border-[#1466B8] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-pass" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl font-semibold text-sm text-[#0D1B2A] focus:outline-none focus:border-[#1466B8] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-800 space-y-1">
            <div className="font-extrabold flex items-center gap-1.5">
              <span>📌 Seeding / Default Credentials:</span>
            </div>
            <div className="font-mono text-[11px] text-blue-700">
              Email: <strong>admin@motionconect.com</strong><br />
              Password: <strong>00000000</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#1466B8] to-[#0D1B2A] text-white font-extrabold text-sm shadow-lg shadow-[#1466B8]/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
