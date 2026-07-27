import { createAdminClient } from '@/lib/supabase/admin'
import { HotspotUser, MikroTikResponse } from '@/types/mikrotik'

export class RouterService {
  /**
   * Check if MikroTik is running in Mock Mode (for local development/testing)
   */
  private static isMockMode(): boolean {
    return process.env.MIKROTIK_MOCK === 'true'
  }

  /**
   * Create Hotspot User on MikroTik router via REST API
   */
  static async createHotspotUser(user: HotspotUser): Promise<MikroTikResponse<HotspotUser>> {
    if (this.isMockMode()) {
      console.log('--- [MOCK MODE] Creating MikroTik Hotspot User ---', user)
      // Simulate successful creation in local mock mode
      return {
        success: true,
        data: {
          '.id': '*MOCK_' + Math.floor(Math.random() * 10000),
          ...user,
        },
      }
    }

    const host = process.env.MIKROTIK_HOST
    const port = process.env.MIKROTIK_PORT || '443'
    const username = process.env.MIKROTIK_USERNAME
    const password = process.env.MIKROTIK_PASSWORD

    if (!host || !username || !password) {
      return {
        success: false,
        error: 'MikroTik API credentials not configured in environment',
      }
    }

    const protocol = port === '443' ? 'https' : 'http'
    const url = `${protocol}://${host}:${port}/rest/ip/hotspot/user`
    const auth = Buffer.from(`${username}:${password}`).toString('base64')

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify(user),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `MikroTik API Error (${response.status}): ${errorText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network error communicating with MikroTik'
      console.error('MikroTik Connection Error:', msg)
      return {
        success: false,
        error: msg,
      }
    }
  }

  /**
   * Sync active routers status in Supabase database
   */
  static async getRouters() {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('routers').select('*')
    if (error) throw new Error(error.message)
    return data
  }
}
