export type UserRole = 'principal' | 'teacher' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  institution_id?: string | null
  tenant_id?: string | null
}

export interface Diagnostic {
  id: string
  title: string
  status: 'pending' | 'completed' | 'active'
  mastery_score: number
  created_at: string
}

export interface Concept {
  name: string
  stability: number
  fragility: number
  reinforce: number
}
