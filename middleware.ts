import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/b2b', '/b2c', '/workspace']
const AUTH_ONLY_ROUTES   = ['/auth/login', '/auth/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  let response = NextResponse.next({
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
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ✅ Use getSession instead of getUser (more stable on Vercel)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  )

  const isAuthOnly = AUTH_ONLY_ROUTES.some((p) =>
    pathname.startsWith(p)
  )

  // 🔐 If not logged in and trying to access protected route → go to login
  if (!user && isProtected) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  // 🚫 If logged in and trying to access login/register → go to workspace
  if (user && isAuthOnly) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/workspace/router'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}