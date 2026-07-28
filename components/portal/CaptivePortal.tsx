'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Package } from '@/types/package'
import { ShieldAlert, CheckCircle2, Lock, Zap, Award, Smartphone, MessageCircle, ArrowRight, Copy, Check } from 'lucide-react'

interface CaptivePortalProps {
  initialPackages: Package[]
  mikrotikParams?: {
    loginUrl?: string
    dst?: string
    error?: string
    username?: string
    mac?: string
    ip?: string
  }
}

const PROMOS = [
  { icon: <Zap className="w-4 h-4 text-amber-400" />, head: 'Powered by Starlink', sub: 'Fast, low-latency internet across campus.' },
  { icon: <Award className="w-4 h-4 text-emerald-400" />, head: 'Student Favourite: Weekly Access', sub: '5GB for just GHS 11 — 7 full days.' },
  { icon: <Zap className="w-4 h-4 text-blue-400" />, head: 'Best Value: Monthly Premium', sub: '30GB for GHS 61 — 30 days.' },
  { icon: <Smartphone className="w-4 h-4 text-purple-400" />, head: 'Pay with Mobile Money', sub: 'Instant & secure approval on your phone.' },
  { icon: <MessageCircle className="w-4 h-4 text-emerald-300" />, head: 'Need Help?', sub: 'Chat our support team on WhatsApp anytime.' },
]

export function CaptivePortal({ initialPackages, mikrotikParams }: CaptivePortalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'login' | 'creds'>('buy')
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(
    initialPackages.length > 0 ? initialPackages[0].id : null
  )
  const [phone, setPhone] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Overlay & Polling State
  const [isProcessing, setIsProcessing] = useState(false)
  const [ovTitle, setOvTitle] = useState('Processing payment request…')
  const [ovMsg, setOvMsg] = useState('Approve the prompt on your phone to continue.')
  
  // Credentials Result State
  const [creds, setCreds] = useState<{
    voucher: string
    username: string
    password: string
    profile: string
    expiry: string
    sms: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  // Promo Slider State
  const [promoIdx, setPromoIdx] = useState(0)

  // CNA (Captive Network Assistant) Detection via lazy initializer
  const [isCna] = useState(() => {
    if (typeof window === 'undefined') return false
    const ua = window.navigator.userAgent
    return /CaptiveNetwork|AppleWebKit.*Mobile.*|Dalvik.*|CaptivePortal/i.test(ua) && !/Safari/i.test(ua)
  })

  // Existing MikroTik login form state
  const [loginUser, setLoginUser] = useState(mikrotikParams?.username || '')
  const [loginPass, setLoginPass] = useState('')
  const loginUrl = mikrotikParams?.loginUrl || 'http://10.0.0.1/login'
  const dstUrl = mikrotikParams?.dst || 'http://www.google.com'

  // Rotate promo banner every 4.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIdx((prev) => (prev + 1) % PROMOS.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  // Auto-switch to login tab countdown when on creds screen
  useEffect(() => {
    if (activeTab !== 'creds') return
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          setActiveTab('login')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [activeTab])

  // Poll payment status from /api/payments/status
  const startPolling = useCallback((reference: string, startTime: number) => {
    const checkStatus = async () => {
      if (Date.now() - startTime > 120000) {
        setIsProcessing(false)
        setErrorMsg('Payment request timed out. If you were charged, please contact support.')
        return
      }

      try {
        const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`)
        const data = await res.json()

        if (data.status === 'success' && data.credentials) {
          setIsProcessing(false)
          setCreds(data.credentials)
          setLoginUser(data.credentials.username)
          setLoginPass(data.credentials.password)
          setCountdown(60)
          setActiveTab('creds')
        } else if (data.status === 'failed') {
          setIsProcessing(false)
          setErrorMsg(data.message || 'Payment failed or was declined.')
        } else {
          // Still pending, poll again in 3s
          setTimeout(() => checkStatus(), 3000)
        }
      } catch {
        setTimeout(() => checkStatus(), 3000)
      }
    }

    setTimeout(() => checkStatus(), 3000)
  }, [])

  // Check URL params for returning from checkout
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    const status = params.get('status')
    if (ref && status === 'success') {
      setTimeout(() => {
        setIsProcessing(true)
        setOvTitle('Connecting to Wi-Fi…')
        setOvMsg('Verifying your payment credentials...')
        startPolling(ref, Date.now())
      }, 0)
    }
  }, [startPolling])

  const handleStartPayment = async () => {
    setErrorMsg(null)
    const cleanPhone = phone.replace(/\D/g, '')

    if (!selectedPkgId) {
      setErrorMsg('Please select a Wi-Fi package.')
      return
    }
    if (cleanPhone.length < 9) {
      setErrorMsg('Please enter a valid 9 or 10-digit Mobile Money number.')
      return
    }

    const selectedPkg = initialPackages.find((p) => p.id === selectedPkgId)
    if (!selectedPkg) return

    setIsProcessing(true)
    setOvTitle('Sending payment prompt…')
    setOvMsg(`Approve GHS ${selectedPkg.amount.toFixed(2)} on ${cleanPhone} to continue.`)

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPkg.id,
          amount: selectedPkg.amount,
          phone: cleanPhone,
          macAddress: mikrotikParams?.mac,
          ipAddress: mikrotikParams?.ip,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setIsProcessing(false)
        setErrorMsg(data.message || 'Could not initiate payment. Try again.')
        return
      }

      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl)
      }
      setOvTitle('Waiting for MoMo approval…')
      setOvMsg(`Prompt sent to ${cleanPhone}. Please enter your PIN to authorize payment.`)
      startPolling(data.reference, Date.now())
    } catch (err: unknown) {
      setIsProcessing(false)
      const msg = err instanceof Error ? err.message : 'Network error initiating payment.'
      setErrorMsg(msg)
    }
  }

  const handleCopyCreds = () => {
    if (!creds) return
    const text = `Motion Connect Wi-Fi\nUsername: ${creds.username}\nPassword: ${creds.password}\nVoucher: ${creds.voucher}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const selectedPackage = initialPackages.find((p) => p.id === selectedPkgId)

  return (
    <div className="min-h-screen bg-[#EDF1F6] text-[#0D1B2A] py-6 px-4 font-sans antialiased selection:bg-[#1466B8]/10">
      <div className="max-w-[460px] mx-auto">
        
        {/* ============ CNA DETECTED WARNING ============ */}
        {isCna && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Captive Portal Browser Detected:</span> Please copy or screenshot your login credentials when generated before closing this screen.
            </div>
          </div>
        )}

        {/* ============ TOP BAR ============ */}
        <header className="flex items-center justify-between mb-4 px-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1466B8] to-[#0C3358] flex items-center justify-center shadow-md shadow-[#0C3358]/25 shrink-0">
              <svg viewBox="0 0 28 28" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="16" width="3.4" height="8" rx="1.4" fill="#fff" opacity=".55" />
                <rect x="9.3" y="12" width="3.4" height="12" rx="1.4" fill="#fff" opacity=".8" />
                <rect x="14.6" y="7" width="3.4" height="17" rx="1.4" fill="#fff" />
                <circle cx="21.6" cy="8.6" r="2.2" fill="#05C46B" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-[15px] tracking-tight leading-tight">Motion Connect</h1>
              <p className="font-medium text-[11px] text-[#667891] tracking-wide">Campus Student Wi-Fi</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#04482A] bg-[#05C46B]/15 border border-[#05C46B]/30 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#05C46B] animate-pulse shadow-[0_0_8px_#05C46B]" />
            LIVE
          </div>
        </header>

        {/* ============ ROTATING PROMO BANNER ============ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0C3358] to-[#1466B8] rounded-2xl p-3.5 mb-3.5 shadow-sm text-white min-h-[64px] flex flex-col justify-between">
          <span className="absolute top-2.5 right-3 text-[9px] font-extrabold tracking-widest text-white/50 uppercase">
            OFFERS
          </span>
          <div className="transition-all duration-300 pr-12">
            <div className="flex items-center gap-2 font-extrabold text-[13.5px] tracking-tight text-white mb-0.5">
              {PROMOS[promoIdx].icon}
              <span>{PROMOS[promoIdx].head}</span>
            </div>
            <p className="text-[12px] text-white/80 leading-snug">{PROMOS[promoIdx].sub}</p>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            {PROMOS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPromoIdx(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === promoIdx ? 'w-4 bg-white' : 'w-1 bg-white/35 hover:bg-white/60'
                }`}
                aria-label={`Promo slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ============ TABS ============ */}
        <div className="grid grid-cols-2 gap-1 bg-white border border-[#E1E8F0] rounded-xl p-1 mb-3.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'buy' || activeTab === 'creds'
                ? 'bg-[#1466B8] text-white shadow-sm'
                : 'text-[#667891] hover:text-[#0D1B2A] hover:bg-zinc-50'
            }`}
          >
            Buy internet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'login'
                ? 'bg-[#1466B8] text-white shadow-sm'
                : 'text-[#667891] hover:text-[#0D1B2A] hover:bg-zinc-50'
            }`}
          >
            I have an account
          </button>
        </div>

        {/* ============ PANEL: BUY INTERNET ============ */}
        {(activeTab === 'buy' || (activeTab === 'creds' && !creds)) && (
          <div className="bg-white border border-[#E1E8F0] rounded-2xl shadow-sm p-4.5 transition-all">
            <p className="text-[11px] font-extrabold tracking-widest text-[#667891] uppercase mb-3">
              Choose your plan
            </p>
            
            <div className="space-y-2.5">
              {initialPackages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id
                const barsCount = pkg.signal_bars || 3

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`w-full text-left grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#05C46B] bg-[#05C46B]/[0.04] shadow-[0_0_0_3px_rgba(5,196,107,0.12)]'
                        : 'border-[#E1E8F0] bg-white hover:border-[#CBD6E2]'
                    }`}
                  >
                    {/* Signal Bars Visual */}
                    <div className="flex items-end gap-0.5 h-6 shrink-0">
                      {[1, 2, 3, 4, 5].map((bar) => {
                        const heights = ['h-2', 'h-3', 'h-4', 'h-5', 'h-6']
                        const isOn = bar <= barsCount
                        return (
                          <span
                            key={bar}
                            className={`w-1 rounded-sm transition-colors ${heights[bar - 1]} ${
                              isOn ? (isSelected ? 'bg-[#05C46B]' : 'bg-[#1466B8]') : 'bg-[#CBD6E2]'
                            }`}
                          />
                        )
                      })}
                    </div>

                    {/* Package Name & Meta */}
                    <div className="min-w-0">
                      <div className="font-bold text-[15px] text-[#0D1B2A] truncate">{pkg.name}</div>
                      <div className="text-[12px] text-[#667891] mt-0.5 truncate">
                        {pkg.data_limit} · {pkg.duration_label}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-[#667891] mr-0.5">GHS</span>
                      <span className="text-[18px] font-extrabold tracking-tight text-[#0D1B2A]">
                        {pkg.amount.toFixed(2)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* MoMo Number Field */}
            <div className="mt-4">
              <label htmlFor="phone" className="block text-xs font-bold text-[#3A4A5E] mb-1.5 tracking-wide">
                Mobile Money number
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="e.g. 024 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={15}
                className="w-full font-medium text-base text-[#0D1B2A] bg-[#F7F9FC] border-2 border-[#CBD6E2] rounded-xl py-3 px-3.5 focus:outline-none focus:border-[#1466B8] focus:bg-white focus:shadow-[0_0_0_3px_rgba(20,102,184,0.15)] transition-all placeholder:text-[#667891]/60"
              />
              <p className="text-[11.5px] text-[#667891] mt-1.5">
                You&apos;ll receive a prompt on this number to approve payment.
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="mt-3.5 bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-[13px] font-semibold py-2.5 px-3.5 rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Proceed Button */}
            <button
              type="button"
              onClick={handleStartPayment}
              disabled={!selectedPkgId || phone.replace(/\D/g, '').length < 9 || isProcessing}
              className="w-full mt-4 font-extrabold text-[15px] bg-[#05C46B] text-[#04331E] rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:brightness-105 active:translate-y-0.5 transition-all disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              <Lock className="w-4 h-4" />
              <span>
                {selectedPackage
                  ? `Pay GHS ${selectedPackage.amount.toFixed(2)} & Connect`
                  : 'Proceed to secure payment'}
              </span>
            </button>
          </div>
        )}

        {/* ============ PANEL: EXISTING CLIENT LOGIN (MikroTik) ============ */}
        {activeTab === 'login' && (
          <div className="bg-white border border-[#E1E8F0] rounded-2xl shadow-sm p-4.5 transition-all">
            <p className="text-[11px] font-extrabold tracking-widest text-[#667891] uppercase mb-3">
              Existing client login
            </p>

            {/* RouterOS Login Form */}
            <form action={loginUrl} method="post" onSubmit={() => true}>
              <input type="hidden" name="dst" value={dstUrl} />
              <input type="hidden" name="popup" value="true" />

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="username" className="block text-xs font-bold text-[#3A4A5E] mb-1.5 tracking-wide">
                    Username / Voucher Code
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter voucher or username"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    required
                    className="w-full font-medium text-base text-[#0D1B2A] bg-[#F7F9FC] border-2 border-[#CBD6E2] rounded-xl py-3 px-3.5 focus:outline-none focus:border-[#1466B8] focus:bg-white focus:shadow-[0_0_0_3px_rgba(20,102,184,0.15)] transition-all placeholder:text-[#667891]/60"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-[#3A4A5E] mb-1.5 tracking-wide">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password (if applicable)"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full font-medium text-base text-[#0D1B2A] bg-[#F7F9FC] border-2 border-[#CBD6E2] rounded-xl py-3 px-3.5 focus:outline-none focus:border-[#1466B8] focus:bg-white focus:shadow-[0_0_0_3px_rgba(20,102,184,0.15)] transition-all placeholder:text-[#667891]/60"
                  />
                </div>
              </div>

              {mikrotikParams?.error && (
                <div className="mt-3.5 bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-[13px] font-semibold py-2.5 px-3.5 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{mikrotikParams.error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 font-extrabold text-[15px] bg-[#1466B8] text-white rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:brightness-110 active:translate-y-0.5 transition-all"
              >
                <span>Connect to Wi-Fi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ============ PANEL: CREDENTIALS RESULT ============ */}
        {activeTab === 'creds' && creds && (
          <div className="bg-white border border-[#E1E8F0] rounded-2xl shadow-sm p-5 transition-all">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#05C46B] text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-lg text-[#0D1B2A]">Payment Successful!</h2>
            </div>
            <p className="text-[13px] text-[#667891] mb-4">
              Your Wi-Fi credentials have been activated. Please save them safely.
            </p>

            {/* Credentials Card Table */}
            <div className="divide-y divide-[#E1E8F0] border-t border-b border-[#E1E8F0] my-3">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold text-[#667891]">Voucher Code</span>
                <span className="text-[16px] font-black tracking-wide text-[#0C3358] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {creds.voucher}
                </span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="text-xs font-semibold text-[#667891]">Username</span>
                <span className="font-bold text-[#0D1B2A]">{creds.username}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="text-xs font-semibold text-[#667891]">Password</span>
                <span className="font-bold text-[#0D1B2A]">{creds.password}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="text-xs font-semibold text-[#667891]">Profile</span>
                <span className="font-bold text-[#0D1B2A] capitalize">{creds.profile}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="text-xs font-semibold text-[#667891]">Expiry Date</span>
                <span className="font-bold text-[#0D1B2A]">{creds.expiry}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="text-xs font-semibold text-[#667891]">SMS Notification</span>
                <span className="font-bold text-[#05C46B]">{creds.sms}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={handleCopyCreds}
                className="w-full font-bold text-sm bg-zinc-100 text-[#0D1B2A] border border-[#CBD6E2] rounded-xl py-3 px-3 flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-[#05C46B]" /> : <Copy className="w-4 h-4 text-[#667891]" />}
                <span>{copied ? 'Copied!' : 'Copy Info'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login')
                }}
                className="w-full font-extrabold text-sm bg-[#1466B8] text-white rounded-xl py-3 px-3 flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110 transition-all"
              >
                <span>Login Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center text-xs text-[#667891] mt-3.5">
              Auto switching to login form in <strong className="text-[#0D1B2A]">{countdown}s</strong>…
            </p>
          </div>
        )}

        {/* ============ FOOTER ============ */}
        <footer className="text-center text-xs text-[#667891] mt-5 mb-2 leading-relaxed space-y-1">
          <div>
            Need help?{' '}
            <a href="tel:+233508135559" className="text-[#1466B8] font-semibold hover:underline">
              Call Support
            </a>{' '}
            ·{' '}
            <a href="https://wa.me/233508135559" target="_blank" rel="noopener noreferrer" className="text-[#1466B8] font-semibold hover:underline">
              WhatsApp
            </a>{' '}
            ·{' '}
            <button
              type="button"
              onClick={() => setActiveTab('buy')}
              className="text-[#1466B8] font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0 font-sans"
            >
              How to buy data
            </button>
          </div>
          <div className="text-[11px] text-[#667891]/80">
            © {new Date().getFullYear()} Motion Connect · Powered by Secure Mobile Money & Starlink
          </div>
        </footer>
      </div>

      {/* ============ PAYMENT PROCESSING OVERLAY ============ */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-[#0D1B2A]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-7 max-w-[340px] w-full text-center shadow-xl border border-[#E1E8F0] animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#E1E8F0] border-t-[#05C46B] animate-spin" />
            <h3 className="font-extrabold text-lg text-[#0D1B2A] mb-1.5">{ovTitle}</h3>
            <p className="text-sm text-[#667891] leading-relaxed mb-4">{ovMsg}</p>
            {checkoutUrl && (
              <a
                href={checkoutUrl}
                className="inline-flex items-center justify-center gap-1.5 w-full py-3 px-4 rounded-xl bg-[#1466B8] text-white font-extrabold text-xs shadow-md hover:brightness-110 transition-all cursor-pointer mt-2"
              >
                <span>🔗 Open MoMo Checkout Simulator</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
