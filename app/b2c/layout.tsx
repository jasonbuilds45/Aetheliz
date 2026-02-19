'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/useAuth'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'

export default function B2CLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace('/auth/login')
    }
  }, [isLoading, profile, router])

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-white text-xl">analytics</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">Loading workspace…</p>
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
