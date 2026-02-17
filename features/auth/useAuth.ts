"use client"

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { createClient } from '@/services/supabaseBrowser'

const supabase = createClient()

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
}

export function useAuth(): AuthState {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    // Single source of truth — onAuthStateChange fires immediately on mount
    // with the current session, so we don't need a separate getUser() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, institution_id, tenant_id')
      .eq('id', userId)
      .single()

    if (fetchError) {
      // Always release the loading state even on error — never hang forever
      console.error('[useAuth] Profile fetch failed:', fetchError.message, fetchError.code)
      setError(fetchError.message)
      setProfile(null)
      setIsLoading(false)
      return
    }

    setProfile(data)
    setIsLoading(false)
  }

  return { user, profile, isLoading, error }
}
