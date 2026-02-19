import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // If not logged in and trying to access protected pages
  if (!user && (
    pathname.startsWith('/b2b') ||
    pathname.startsWith('/b2c') ||
    pathname.startsWith('/workspace')
  )) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // If logged in and trying to access login/register
  if (user && (
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register')
  )) {
    return NextResponse.redirect(new URL('/b2c', req.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}