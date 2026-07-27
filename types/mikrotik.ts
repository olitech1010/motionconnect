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

export interface MikroTikResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
