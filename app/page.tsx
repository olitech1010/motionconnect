import React from 'react'
import { PackageService } from '@/services/package.service'
import { CaptivePortal } from '@/components/portal/CaptivePortal'
import { Package } from '@/types/package'

const DEFAULT_PACKAGES: Package[] = [
  { id: 'weekly', name: 'Weekly Access', slug: 'weekly', data_limit: '5GB', data_limit_bytes: 5368709120, duration_label: '7 Days Access', duration_seconds: 604800, amount: 11.00, mikrotik_profile: 'weekly', signal_bars: 1, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'boost24', name: '24-Hour Boost', slug: 'boost24', data_limit: '15GB', data_limit_bytes: 16106127360, duration_label: '24 Hours Access', duration_seconds: 86400, amount: 15.00, mikrotik_profile: 'boost24', signal_bars: 3, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: 'biweekly', name: 'Bi-Weekly', slug: 'biweekly', data_limit: '11GB', data_limit_bytes: 11811160064, duration_label: '14 Days Access', duration_seconds: 1209600, amount: 22.00, mikrotik_profile: 'biweekly', signal_bars: 2, is_active: true, sort_order: 3, created_at: '', updated_at: '' },
  { id: 'bwpro', name: 'Bi-Weekly Pro', slug: 'bwpro', data_limit: '22GB', data_limit_bytes: 23622320128, duration_label: '14 Days Access', duration_seconds: 1209600, amount: 42.00, mikrotik_profile: 'bwpro', signal_bars: 4, is_active: true, sort_order: 4, created_at: '', updated_at: '' },
  { id: 'monthly', name: 'Monthly Premium', slug: 'monthly', data_limit: '30GB', data_limit_bytes: 32212254720, duration_label: '30 Days Access', duration_seconds: 2592000, amount: 61.00, mikrotik_profile: 'monthly', signal_bars: 5, is_active: true, sort_order: 5, created_at: '', updated_at: '' }
]

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {}

  let packages: Package[] = []
  try {
    packages = await PackageService.getActivePackages()
  } catch (err) {
    console.warn('Could not load packages from Supabase, falling back to defaults:', err)
  }

  if (!packages || packages.length === 0) {
    packages = DEFAULT_PACKAGES
  }

  const getParamStr = (val: string | string[] | undefined): string | undefined => {
    if (!val) return undefined
    return Array.isArray(val) ? val[0] : val
  }

  const mikrotikParams = {
    loginUrl: getParamStr(resolvedParams['link-login-only']) || getParamStr(resolvedParams['login']),
    dst: getParamStr(resolvedParams['link-orig']) || getParamStr(resolvedParams['dst']),
    error: getParamStr(resolvedParams['error']),
    username: getParamStr(resolvedParams['username']),
  }

  return <CaptivePortal initialPackages={packages} mikrotikParams={mikrotikParams} />
}
