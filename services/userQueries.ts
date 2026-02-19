import type { Profile } from '../types'

// Temporary stub — replace with real Supabase query when needed.
// The real profile is fetched by useAuth() via supabaseBrowser.
export const getCurrentUserProfile = async (): Promise<Profile> => {
  return {
    id: '',
    email: '',
    full_name: '',
    role: 'principal',
    institution_id: null,
    tenant_id: null,
  }
}
