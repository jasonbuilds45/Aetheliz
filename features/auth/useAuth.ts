"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // 1️⃣ First: get existing session immediately
    const initialize = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }
    }

    initialize()

    // 2️⃣ Then listen for auth changes
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId: string) {
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, institution_id, tenant_id")
      .eq("id", userId)
      .maybeSingle()

    if (fetchError) {
      console.error(
        "[useAuth] Profile fetch failed:",
        fetchError.message,
        fetchError.code
      )
      setError(fetchError.message)
      setProfile(null)
      setIsLoading(false)
      return
    }

    setProfile(data ?? null)
    setIsLoading(false)
  }

  return { user, profile, isLoading, error }
}