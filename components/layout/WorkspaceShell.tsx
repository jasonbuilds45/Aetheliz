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
    router.replace('/')
  }

  const navItems = {
    principal: [
      { href: '/b2b/principal', icon: 'dashboard', label: 'Overview' },
      { href: '/b2b/principal/fragility-ranking', icon: 'priority_high', label: 'Fragility' },
      { href: '/b2b/principal/trends', icon: 'trending_up', label: 'Trends' },
      { href: '/b2b/principal/alerts', icon: 'notifications', label: 'Alerts' },
    ],
    teacher: [
      { href: '/b2b/teacher', icon: 'dashboard', label: 'Dashboard' },
      { href: '/b2b/teacher/launch', icon: 'rocket_launch', label: 'Launcher' },
    ],
    student: [
      { href: '/b2c', icon: 'dashboard', label: 'Progress' },
      { href: '/b2c/architect', icon: 'account_tree', label: 'Architect' },
      { href: '/b2c/diagnose', icon: 'biotech', label: 'Diagnose' },
      { href: '/b2c/repair', icon: 'build', label: 'Repair' },
    ],
  }[profile.role as 'principal' | 'teacher' | 'student'] || navItems.student

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="material-symbols-outlined text-white text-lg">analytics</span>
          </div>
          <span className="text-sm font-black tracking-widest text-slate-900 uppercase">Aetheliz</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/b2c' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {profile.role === 'principal' ? 'Admin Environment' : 'Learning Workspace'}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">{profile.full_name}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{profile.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}