import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between">
        <div>
          <div className="px-6 py-6 border-b border-neutral-800">
            <h1 className="text-sm tracking-widest uppercase text-neutral-400">
              Aetheliz
            </h1>
            <p className="text-xs text-cyan-400 mt-1">
              Cognitive Console
            </p>
          </div>

          <nav className="mt-6 flex flex-col space-y-1 px-3">
            <NavItem href="/b2c" label="Progress" />
            <NavItem href="/b2c/diagnose" label="Diagnose" />
            <NavItem href="/b2c/architect" label="Architect" />
            <NavItem href="/b2c/repair" label="Repair" />
            <NavItem href="/b2c/history" label="History" />
          </nav>
        </div>

        <div className="px-6 py-4 border-t border-neutral-800 text-xs text-neutral-500">
          {profile.full_name || profile.email}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-8">
          <h2 className="text-sm uppercase tracking-widest text-neutral-400">
            Student Interface
          </h2>
          <span className="text-xs text-neutral-500">
            Role: {profile.role}
          </span>
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
      className="px-3 py-2 text-sm text-neutral-400 hover:text-cyan-400 hover:bg-neutral-800 transition-colors duration-150 border-l-2 border-transparent hover:border-cyan-400"
    >
      {label}
    </Link>
  )
}