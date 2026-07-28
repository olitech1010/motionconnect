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
  { icon: <Zap className="w-4 h-4 text-canvas" />, head: 'Powered by Starlink', sub: 'Fast, low-latency internet across campus.' },
  { icon: <Award className="w-4 h-4 text-canvas" />, head: 'Student Favourite: Weekly Access', sub: '5GB for just GHS 11 — 7 full days.' },
  { icon: <Zap className="w-4 h-4 text-canvas" />, head: 'Best Value: Monthly Premium', sub: '30GB for GHS 61 — 30 days.' },
  { icon: <Smartphone className="w-4 h-4 text-canvas" />, head: 'Pay with Mobile Money', sub: 'Instant & secure approval on your phone.' },
  { icon: <MessageCircle className="w-4 h-4 text-canvas" />, head: 'Need Help?', sub: 'Chat our support team on WhatsApp anytime.' },
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
    <div className="min-h-screen bg-kumo-brand text-cream py-6 px-4 font-sans antialiased selection:bg-selection-bg selection:text-cream">
      <div className="max-w-[460px] mx-auto">
        
        {/* ============ CNA DETECTED WARNING ============ */}
        {isCna && (
          <div className="mb-4 bg-canvas/10 border border-canvas/20 rounded-lg p-3.5 flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-cream shrink-0 mt-0.5" />
            <div className="text-xs text-cream leading-relaxed">
              <span className="font-bold">Captive Portal Browser Detected:</span> Please copy or screenshot your login credentials when generated before closing this screen.
            </div>
          </div>
        )}

        {/* ============ TOP BAR ============ */}
        <header className="flex items-center justify-between mb-4 px-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
              <svg viewBox="0 0 28 28" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="16" width="3.4" height="8" rx="1.4" fill="#ff5e1f" opacity=".55" />
                <rect x="9.3" y="12" width="3.4" height="12" rx="1.4" fill="#ff5e1f" opacity=".8" />
                <rect x="14.6" y="7" width="3.4" height="17" rx="1.4" fill="#ff5e1f" />
                <circle cx="21.6" cy="8.6" r="2.2" fill="#262626" />
              </svg>
            </div>
            <div>
              <h1 className="font-medium text-[16px] tracking-tight leading-tight text-cream">Motion Connect</h1>
              <p className="font-mono text-[12px] text-cream/80 tracking-wide">Campus Student Wi-Fi</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-wider text-ink bg-cream border border-cream/30 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-ai animate-pulse shadow-[0_0_8px_#00bd7d]" />
            LIVE
          </div>
        </header>

        {/* ============ ROTATING PROMO BANNER ============ */}
        <div className="relative overflow-hidden bg-kumo-brand-dark rounded-lg p-3.5 mb-3.5 text-cream min-h-[64px] flex flex-col justify-between border border-white/10">
          <span className="absolute top-2.5 right-3 text-[10px] font-mono tracking-widest text-cream/60 uppercase">
            OFFERS
          </span>
          <div className="transition-all duration-300 pr-12">
            <div className="flex items-center gap-2 font-medium text-[14px] tracking-tight text-cream mb-0.5">
              {PROMOS[promoIdx].icon}
              <span>{PROMOS[promoIdx].head}</span>
            </div>
            <p className="font-mono text-[12px] text-cream/80 leading-snug">{PROMOS[promoIdx].sub}</p>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            {PROMOS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPromoIdx(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === promoIdx ? 'w-4 bg-cream' : 'w-1 bg-cream/35 hover:bg-cream/60'
                }`}
                aria-label={`Promo slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ============ TABS ============ */}
        <div className="grid grid-cols-2 gap-1 bg-kumo-brand-dark rounded-lg p-1 mb-3.5 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`py-2 px-3 rounded-md font-mono font-medium text-xs transition-all ${
              activeTab === 'buy' || activeTab === 'creds'
                ? 'bg-canvas text-ink shadow-sm'
                : 'text-cream/80 hover:text-cream hover:bg-white/5'
            }`}
          >
            Buy internet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2 px-3 rounded-md font-mono font-medium text-xs transition-all ${
              activeTab === 'login'
                ? 'bg-canvas text-ink shadow-sm'
                : 'text-cream/80 hover:text-cream hover:bg-white/5'
            }`}
          >
            I have an account
          </button>
        </div>

        {/* ============ PANEL: BUY INTERNET ============ */}
        {(activeTab === 'buy' || (activeTab === 'creds' && !creds)) && (
          <div className="bg-canvas border border-hairline rounded-lg shadow-sm p-4.5 transition-all text-ink">
            <p className="font-mono text-[12px] tracking-widest text-muted uppercase mb-3">
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
                    className={`w-full text-left grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-kumo-brand bg-kumo-brand/5'
                        : 'border-hairline bg-canvas hover:border-kumo-brand/40'
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
                            className={`w-1 rounded-[1px] transition-colors ${heights[bar - 1]} ${
                              isOn ? (isSelected ? 'bg-kumo-brand' : 'bg-ink') : 'bg-hairline'
                            }`}
                          />
                        )
                      })}
                    </div>

                    {/* Package Name & Meta */}
                    <div className="min-w-0">
                      <div className="font-medium text-[15px] text-ink truncate">{pkg.name}</div>
                      <div className="font-mono text-[12px] text-muted mt-0.5 truncate">
                        {pkg.data_limit} · {pkg.duration_label}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[12px] text-muted mr-0.5">GHS</span>
                      <span className="font-medium tracking-tight text-[18px] text-ink">
                        {pkg.amount.toFixed(2)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* MoMo Number Field */}
            <div className="mt-4">
              <label htmlFor="phone" className="block font-mono text-[12px] text-ink-soft mb-1.5 tracking-wide">
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
                className="w-full font-sans text-[16px] text-ink bg-canvas border border-hairline rounded-md py-3 px-3.5 focus:outline-none focus:border-kumo-brand focus:ring-1 focus:ring-kumo-brand transition-all placeholder:text-muted/60"
              />
              <p className="font-mono text-[11.5px] text-muted mt-1.5">
                You&apos;ll receive a prompt on this number to approve payment.
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="mt-3.5 bg-emergency-red/10 border border-emergency-red/20 text-emergency-red text-[13px] font-medium py-2.5 px-3.5 rounded-md flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Proceed Button */}
            <button
              type="button"
              onClick={handleStartPayment}
              disabled={!selectedPkgId || phone.replace(/\D/g, '').length < 9 || isProcessing}
              className="w-full mt-4 font-medium text-[15px] bg-ink text-cream rounded-full py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:brightness-110 active:translate-y-0.5 transition-all disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:brightness-100"
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
          <div className="bg-canvas border border-hairline rounded-lg shadow-sm p-4.5 transition-all text-ink">
            <p className="font-mono text-[12px] tracking-widest text-muted uppercase mb-3">
              Existing client login
            </p>

            {/* RouterOS Login Form */}
            <form action={loginUrl} method="post" onSubmit={() => true}>
              <input type="hidden" name="dst" value={dstUrl} />
              <input type="hidden" name="popup" value="true" />

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="username" className="block font-mono text-[12px] text-ink-soft mb-1.5 tracking-wide">
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
                    className="w-full font-sans text-[16px] text-ink bg-canvas border border-hairline rounded-md py-3 px-3.5 focus:outline-none focus:border-kumo-brand focus:ring-1 focus:ring-kumo-brand transition-all placeholder:text-muted/60"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block font-mono text-[12px] text-ink-soft mb-1.5 tracking-wide">
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
                    className="w-full font-sans text-[16px] text-ink bg-canvas border border-hairline rounded-md py-3 px-3.5 focus:outline-none focus:border-kumo-brand focus:ring-1 focus:ring-kumo-brand transition-all placeholder:text-muted/60"
                  />
                </div>
              </div>

              {mikrotikParams?.error && (
                <div className="mt-3.5 bg-emergency-red/10 border border-emergency-red/20 text-emergency-red text-[13px] font-medium py-2.5 px-3.5 rounded-md flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{mikrotikParams.error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 font-medium text-[15px] bg-ink text-cream rounded-full py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:brightness-110 active:translate-y-0.5 transition-all"
              >
                <span>Connect to Wi-Fi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ============ PANEL: CREDENTIALS RESULT ============ */}
        {activeTab === 'creds' && creds && (
          <div className="bg-canvas border border-hairline rounded-lg shadow-sm p-5 transition-all text-ink">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-ai text-cream flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="font-medium text-lg text-ink">Payment Successful!</h2>
            </div>
            <p className="font-mono text-[12px] text-muted mb-4">
              Your Wi-Fi credentials have been activated. Please save them safely.
            </p>

            {/* Credentials Card Table */}
            <div className="divide-y divide-hairline border-t border-b border-hairline my-3">
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-mono text-[12px] text-muted">Voucher Code</span>
                <span className="font-mono text-[16px] font-bold tracking-wide text-ink bg-hairline/50 px-2 py-0.5 rounded-md border border-hairline">
                  {creds.voucher}
                </span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="font-mono text-[12px] text-muted">Username</span>
                <span className="font-medium text-ink">{creds.username}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="font-mono text-[12px] text-muted">Password</span>
                <span className="font-medium text-ink">{creds.password}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="font-mono text-[12px] text-muted">Profile</span>
                <span className="font-medium text-ink capitalize">{creds.profile}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="font-mono text-[12px] text-muted">Expiry Date</span>
                <span className="font-medium text-ink">{creds.expiry}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-sm">
                <span className="font-mono text-[12px] text-muted">SMS Notification</span>
                <span className="font-medium text-ai">{creds.sms}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={handleCopyCreds}
                className="w-full font-medium text-sm bg-canvas text-ink border border-hairline rounded-full py-3 px-3 flex items-center justify-center gap-1.5 hover:bg-hairline/50 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-ai" /> : <Copy className="w-4 h-4 text-muted" />}
                <span>{copied ? 'Copied!' : 'Copy Info'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="w-full font-medium text-sm bg-ink text-cream rounded-full py-3 px-3 flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110 transition-all"
              >
                <span>Login Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center font-mono text-[11px] text-muted mt-3.5">
              Auto switching to login form in <strong className="text-ink">{countdown}s</strong>…
            </p>
          </div>
        )}

        {/* ============ FOOTER ============ */}
        <footer className="text-center font-mono text-[12px] text-cream/70 mt-5 mb-2 leading-relaxed space-y-1">
          <div>
            Need help?{' '}
            <a href="tel:+233508135559" className="text-cream font-medium hover:underline">
              Call Support
            </a>{' '}
            ·{' '}
            <a href="https://wa.me/233508135559" target="_blank" rel="noopener noreferrer" className="text-cream font-medium hover:underline">
              WhatsApp
            </a>{' '}
            ·{' '}
            <button
              type="button"
              onClick={() => setActiveTab('buy')}
              className="text-cream font-medium hover:underline bg-transparent border-0 cursor-pointer p-0 font-mono"
            >
              How to buy data
            </button>
          </div>
          <div className="text-[11px] text-cream/50">
            © {new Date().getFullYear()} Motion Connect · Powered by Secure Mobile Money & Starlink
          </div>
        </footer>
      </div>

      {/* ============ PAYMENT PROCESSING OVERLAY ============ */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas rounded-lg p-7 max-w-[340px] w-full text-center shadow-xl border border-hairline animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-hairline border-t-kumo-brand animate-spin" />
            <h3 className="font-medium text-lg text-ink mb-1.5">{ovTitle}</h3>
            <p className="font-mono text-[12px] text-muted leading-relaxed mb-4">{ovMsg}</p>
            {checkoutUrl && (
              <a
                href={checkoutUrl}
                className="inline-flex items-center justify-center gap-1.5 w-full py-3 px-4 rounded-full bg-ink text-cream font-medium text-xs shadow-md hover:brightness-110 transition-all cursor-pointer mt-2"
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
