'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import type { Profile } from '@/types'
import { createClient } from '@/services/supabaseBrowser'

const supabase = createClient()

interface ShellProps {
  children: React.ReactNode
  profile: Profile
}

export function WorkspaceShell({ children, profile }: ShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 text-white size-8 rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">analytics</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-indigo-600 uppercase italic">Aetheliz</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {profile.role === 'principal' && (
            <>
              <NavItem href="/b2b/principal" icon="dashboard" label="Overview" active={pathname === '/b2b/principal'} />
              <NavItem href="/b2b/principal/fragility-ranking" icon="priority_high" label="Fragility Index" active={pathname.includes('fragility')} />
              <NavItem href="/b2b/principal/trends" icon="trending_up" label="Stability Trends" active={pathname.includes('trends')} />
              <NavItem href="/b2b/principal/alerts" icon="notifications" label="Alerts" active={pathname.includes('alerts')} />
            </>
          )}

          {profile.role === 'teacher' && (
            <>
              <NavItem href="/b2b/teacher" icon="dashboard" label="Dashboard" active={pathname === '/b2b/teacher'} />
              <NavItem href="/b2b/teacher/launch" icon="rocket_launch" label="Probe Launcher" active={pathname.includes('launch')} />
            </>
          )}

          {profile.role === 'student' && (
            <>
              <NavItem href="/b2c" icon="dashboard" label="Progress" active={pathname === '/b2c'} />
              <NavItem href="/b2c/architect" icon="account_tree" label="Architect" active={pathname.includes('architect')} />
              <NavItem href="/b2c/diagnose" icon="biotech" label="Diagnose" active={pathname.includes('diagnose')} />
              <NavItem href="/b2c/repair" icon="build" label="Repair" active={pathname.includes('repair')} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <NavItem href="/workspace/setup/wizard" icon="settings" label="Setup" active={pathname.includes('setup')} />
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-lg">logout</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest italic">
            Structural Environment
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {profile.full_name}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                {profile.role}
              </p>
            </div>
            <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black shrink-0">
              {profile.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-around z-50">
        <MobileNavItem href="/" icon="dashboard" label="Home" />
        <MobileNavItem href="/b2c/diagnose" icon="biotech" label="Probe" />
        <MobileNavItem href="/workspace/setup/wizard" icon="settings" label="Setup" />
      </nav>
    </div>
  )
}

function NavItem({ href, icon, label, active = false }: {
  href: string
  icon: string
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {label}
    </Link>
  )
}

function MobileNavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 text-slate-400">
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  )
}
