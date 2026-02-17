import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns a Supabase client for use in Client Components.
 * Call once outside the component to avoid re-instantiation on every render.
 *
 * Usage:
 *   const supabase = createClient()    ← outside component
 *   export default function Page() { ... }
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
