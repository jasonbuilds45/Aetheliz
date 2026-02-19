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
  const router   = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const principalNav = [
    { href: '/b2b/principal',                  icon: 'dashboard',      label: 'Overview'         },
    { href: '/b2b/principal/fragility-ranking', icon: 'priority_high',  label: 'Fragility Index'  },
    { href: '/b2b/principal/trends',            icon: 'trending_up',    label: 'Stability Trends' },
    { href: '/b2b/principal/alerts',            icon: 'notifications',  label: 'Alerts'           },
  ]

  const teacherNav = [
    { href: '/b2b/teacher',        icon: 'dashboard',      label: 'Dashboard'     },
    { href: '/b2b/teacher/launch', icon: 'rocket_launch',  label: 'Probe Launcher'},
  ]

  const studentNav = [
    { href: '/b2c',           icon: 'dashboard',    label: 'Progress'   },
    { href: '/b2c/architect', icon: 'account_tree', label: 'Architect'  },
    { href: '/b2c/diagnose',  icon: 'biotech',      label: 'Diagnose'   },
    { href: '/b2c/repair',    icon: 'build',        label: 'Repair'     },
    { href: '/b2c/history',   icon: 'history',      label: 'History'    },
  ]

  const navItems =
    profile.role === 'principal' ? principalNav :
    profile.role === 'teacher'   ? teacherNav   :
    studentNav

  const mobileHome =
    profile.role === 'principal' ? '/b2b/principal' :
    profile.role === 'teacher'   ? '/b2b/teacher'   :
    '/b2c'

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/30">
            <span className="material-symbols-outlined text-white text-lg">analytics</span>
          </div>
          <span className="text-lg font-black tracking-tight text-primary uppercase italic">Aetheliz</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              item.href === mobileHome
                ? pathname === item.href
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  active
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest italic">
            Structural Environment
          </p>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {profile.full_name}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider capitalize">
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

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around z-50">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              pathname.startsWith(item.href) ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-[9px] font-bold">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-400"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-[9px] font-bold">Sign out</span>
        </button>
      </nav>

    </div>
  )
}
