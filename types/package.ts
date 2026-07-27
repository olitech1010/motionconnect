import { Database } from './supabase'

export type Package = Database['public']['Tables']['packages']['Row']
export type NewPackage = Database['public']['Tables']['packages']['Insert']
export type UpdatePackage = Database['public']['Tables']['packages']['Update']
