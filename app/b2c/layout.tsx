import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

export default async function B2CLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans">
      {/* Sidebar - Clean White with Border */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="px-8 py-8">
            <h1 className="text-sm font-black tracking-[0.2em] uppercase text-indigo-600">
              Aetheliz
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              Student Workspace
            </p>
          </div>

          <nav className="mt-2 flex flex-col space-y-1 px-4">
            <NavItem href="/b2c" label="Progress" />
            <NavItem href="/b2c/diagnose" label="Diagnose" />
            <NavItem href="/b2c/architect" label="Architect" />
            <NavItem href="/b2c/repair" label="Repair" />
            <NavItem href="/b2c/history" label="History" />
          </nav>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {profile.full_name || profile.email}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Current Module
          </h2>
          <div className="px-4 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest">
            Role: {profile.role}
          </div>
        </header>

        <main className="p-10">{children}</main>
      </div>
    </div>
  )
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 rounded-xl border-l-4 border-transparent hover:border-indigo-600"
    >
      {label}
    </Link>
  )
}