'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/useAuth'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { LoadingState } from '@/components/ui/LoadingState'

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If auth resolved but no profile (fetch error or missing row) → go to login
    if (!isLoading && !profile) {
      router.replace('/auth/login')
    }
  }, [isLoading, profile, router])

  if (isLoading) return <LoadingState />

  // Still rendering while the redirect fires
  if (!profile) return <LoadingState />

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Failed to load profile</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceShell profile={profile}>
      {children}
    </WorkspaceShell>
  )
}
