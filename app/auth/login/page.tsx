"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Wait for auth state to propagate, then do a full page refresh
    // This ensures middleware sees the session and routes correctly
    await new Promise(resolve => setTimeout(resolve, 500))
    window.location.href = "/workspace/router"
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="size-9 bg-white/15 rounded-lg flex items-center justify-center border border-white/20">
            <span className="material-symbols-outlined text-white text-xl">analytics</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase italic">Aetheliz</span>
        </Link>
        <div className="relative">
          <blockquote className="text-white/90 text-xl font-medium leading-relaxed mb-6 italic">
            &ldquo;Aetheliz gave us a window into how our students actually think — not just what they score.&rdquo;
          </blockquote>
          <p className="text-white/60 text-sm font-semibold">Dr. Patricia Osei · Academic Director, Westbridge Academy</p>
        </div>
        <div className="relative flex gap-8">
          <div>
            <p className="text-3xl font-black text-white">180+</p>
            <p className="text-white/60 text-xs font-semibold mt-1">Institutions</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">40K+</p>
            <p className="text-white/60 text-xs font-semibold mt-1">Students diagnosed</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">94%</p>
            <p className="text-white/60 text-xs font-semibold mt-1">Diagnostic accuracy</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">analytics</span>
            </div>
            <span className="text-lg font-black text-primary uppercase italic tracking-tight">Aetheliz</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 mt-2">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 px-4 rounded-xl hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-primary font-bold hover:underline">
              Create one free
            </Link>
          </p>

          <p className="mt-4 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
