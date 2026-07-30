import React from 'react'
import { PackageService, DEFAULT_PACKAGES } from '@/services/package.service'
import { CaptivePortal } from '@/components/portal/CaptivePortal'
import { Package } from '@/types/package'

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
    mac: getParamStr(resolvedParams['mac']) || getParamStr(resolvedParams['client_mac']),
    ip: getParamStr(resolvedParams['ip']) || getParamStr(resolvedParams['client_ip']),
  }

  return <CaptivePortal initialPackages={packages} mikrotikParams={mikrotikParams} />
}
