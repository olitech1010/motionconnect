'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ShieldCheck, Smartphone, CheckCircle2, Lock, ArrowRight, XCircle, Loader2 } from 'lucide-react'

function DemoCheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const ref = searchParams.get('ref') || 'DEMO-REF-001'
  const amount = searchParams.get('amount') || '11.00'
  const phone = searchParams.get('phone') || '0240000000'

  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [voucherCode, setVoucherCode] = useState<string | null>(null)

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) {
      setError('Please enter a 4-digit Mobile Money PIN (use 0000 for demo).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/demo-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to authorize demo payment')
      }

      setSuccess(true)
      setVoucherCode(data.voucher)

      // Automatically redirect back to portal with success params after 2 seconds
      setTimeout(() => {
        router.push(`/?ref=${ref}&status=success`)
      }, 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing payment'
      setError(msg)
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/?ref=${ref}&status=failed`)
  }

  return (
    <div className="min-h-screen bg-[#0A1520] flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200">
        {/* Hubtel Branding Header */}
        <div className="bg-gradient-to-r from-[#1466B8] to-[#0C3358] p-6 text-white text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-extrabold uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#05C46B]" />
            <span>Hubtel PayProxy Sandbox</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">Mobile Money Checkout</h1>
          <p className="text-xs text-white/80 mt-1">Secure payment gateway simulation</p>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0D1B2A]">Payment Approved!</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Your Mobile Money payment of <strong className="text-emerald-600">GHS {amount}</strong> was successful.
              </p>
            </div>
            {voucherCode && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-left">
                <span className="text-[11px] font-extrabold uppercase text-blue-800 tracking-wider">
                  Generated Voucher Code:
                </span>
                <div className="text-xl font-mono font-black text-[#1466B8] mt-0.5">{voucherCode}</div>
                <p className="text-[11px] text-blue-600 mt-1">
                  Redirecting to campus portal to automatically connect...
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#1466B8]" />
              <span>Returning to Motion Connect...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleApprove} className="p-6 space-y-6">
            {/* Transaction Summary Card */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
              <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold border-b border-zinc-200/60 pb-2">
                <span>Merchant:</span>
                <span className="font-extrabold text-[#0D1B2A]">Motion Connect Wi-Fi</span>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold border-b border-zinc-200/60 pb-2">
                <span>Phone Number:</span>
                <span className="font-mono font-bold text-[#0D1B2A] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#1466B8]" />
                  <span>{phone}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold border-b border-zinc-200/60 pb-2">
                <span>Reference:</span>
                <span className="font-mono text-zinc-600">{ref}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-extrabold text-zinc-400 uppercase">Amount to Pay</span>
                <span className="text-2xl font-black text-[#1466B8]">GHS {amount}</span>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* PIN Input */}
            <div className="space-y-2">
              <label htmlFor="momo-pin" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600">
                Enter Mobile Money PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="momo-pin"
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="0000"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl font-mono text-lg font-bold text-center tracking-[0.5em] focus:outline-none focus:border-[#1466B8] focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-zinc-400 text-center font-medium">
                💡 Sandbox Demo: Use PIN <strong className="text-zinc-600 font-mono">0000</strong> to approve instantly.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#05C46B] to-[#049d55] text-white font-extrabold text-sm shadow-lg shadow-[#05C46B]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize & Approve Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-zinc-500 font-bold text-xs hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Cancel / Decline Payment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function DemoCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A1520] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <DemoCheckoutContent />
    </Suspense>
  )
}
