import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/b2b', '/b2c', '/workspace']
const AUTH_ONLY_ROUTES   = ['/auth/login', '/auth/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // getUser() is the secure method — validates JWT with Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthOnly  = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthOnly) {
    const url = req.nextUrl.clone()
    url.pathname = '/workspace/router'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
