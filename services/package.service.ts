import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Package, NewPackage, UpdatePackage } from '@/types/package'

const DEFAULT_PACKAGES: Package[] = [
  { id: '1', name: 'Weekly Access', slug: 'weekly', data_limit: '5GB', data_limit_bytes: 5368709120, duration_label: '7 Days Access', duration_seconds: 604800, amount: 11.00, mikrotik_profile: 'weekly', signal_bars: 1, is_active: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: '24hr Speed Boost', slug: 'boost24', data_limit: '10GB', data_limit_bytes: 10737418240, duration_label: '24 Hours Access', duration_seconds: 86400, amount: 15.00, mikrotik_profile: 'boost24', signal_bars: 2, is_active: true, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'Bi-Weekly Value', slug: 'biweekly', data_limit: '15GB', data_limit_bytes: 16106127360, duration_label: '14 Days Access', duration_seconds: 1209600, amount: 25.00, mikrotik_profile: 'biweekly', signal_bars: 3, is_active: true, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', name: 'Bi-Weekly Pro', slug: 'bwpro', data_limit: '25GB', data_limit_bytes: 26843545600, duration_label: '14 Days Access', duration_seconds: 1209600, amount: 40.00, mikrotik_profile: 'bwpro', signal_bars: 4, is_active: true, sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', name: 'Monthly Unlimited', slug: 'monthly', data_limit: '50GB', data_limit_bytes: 53687091200, duration_label: '30 Days Access', duration_seconds: 2592000, amount: 70.00, mikrotik_profile: 'monthly', signal_bars: 5, is_active: true, sort_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export class PackageService {
  /**
   * Fetch all active packages ordered by sort_order
   */
  static async getActivePackages(): Promise<Package[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error || !data || data.length === 0) {
        return DEFAULT_PACKAGES
      }
      return data
    } catch {
      return DEFAULT_PACKAGES
    }
  }

  /**
   * Fetch all packages (for admin dashboard)
   */
  static async getAllPackages(): Promise<Package[]> {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error || !data || data.length === 0) {
        return DEFAULT_PACKAGES
      }
      return data
    } catch {
      return DEFAULT_PACKAGES
    }
  }

  /**
   * Fetch single package by ID
   */
  static async getPackageById(id: string): Promise<Package | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return null
    }

    return data
  }

  /**
   * Create a new package (Admin only)
   */
  static async createPackage(payload: NewPackage): Promise<Package> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('packages')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error creating package:', error.message)
      throw new Error('Failed to create package')
    }

    return data
  }

  /**
   * Update an existing package (Admin only)
   */
  static async updatePackage(id: string, payload: UpdatePackage): Promise<Package> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('packages')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating package:', error.message)
      throw new Error('Failed to update package')
    }

    return data
  }

  /**
   * Delete a package (Admin only)
   */
  static async deletePackage(id: string): Promise<boolean> {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting package:', error.message)
      throw new Error('Failed to delete package')
    }

    return true
  }
}
