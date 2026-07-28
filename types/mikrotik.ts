export interface HotspotUser {
  '.id'?: string
  name: string
  password?: string
  profile: string
  'mac-address'?: string
  'limit-bytes-total'?: number | string
  comment?: string
  disabled?: string | boolean
}

export interface HotspotUserProfile {
  '.id'?: string
  name: string
  'rate-limit'?: string
  'session-timeout'?: string
  'shared-users'?: number | string
}

export interface HotspotActiveSession {
  '.id'?: string
  server?: string
  user: string
  address: string
  'mac-address': string
  login?: string
  uptime?: string
  'bytes-in'?: number | string
  'bytes-out'?: number | string
}

export interface MikroTikResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
