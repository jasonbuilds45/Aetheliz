import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/b2b', '/b2c', '/workspace']
const AUTH_ONLY_ROUTES = ['/auth/login', '/auth/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  let response = NextResponse.next()

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

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const isProtected = PROTECTED_PREFIXES.some(p =>
    pathname.startsWith(p)
  )

  const isAuthOnly = AUTH_ONLY_ROUTES.some(p =>
    pathname.startsWith(p)
  )

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  if (user && isAuthOnly) {
    // Fetch role and redirect properly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    if (profile.role === 'principal' && !profile.tenant_id) {
      return NextResponse.redirect(new URL('/workspace/setup/wizard', req.url))
    }

    if (profile.role === 'principal') {
      return NextResponse.redirect(new URL('/b2b/principal', req.url))
    }

    if (profile.role === 'teacher') {
      return NextResponse.redirect(new URL('/b2b/teacher', req.url))
    }

    if (profile.role === 'student') {
      return NextResponse.redirect(new URL('/b2c', req.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}