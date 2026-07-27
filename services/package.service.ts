import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Package, NewPackage, UpdatePackage } from '@/types/package'

export class PackageService {
  /**
   * Fetch all active packages ordered by sort_order
   */
  static async getActivePackages(): Promise<Package[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching active packages:', error.message)
      throw new Error('Failed to fetch packages')
    }

    return data || []
  }

  /**
   * Fetch all packages (for admin dashboard)
   */
  static async getAllPackages(): Promise<Package[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching all packages:', error.message)
      throw new Error('Failed to fetch packages')
    }

    return data || []
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
