"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

type AccountType = 'student' | 'institution'

export default function RegisterPage() {
  const router = useRouter()

  const [accountType, setAccountType] = useState<AccountType>('student')
  const [fullName, setFullName]   = useState("")
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Institution users register as "principal" and will go through the setup wizard
  const role = accountType === 'institution' ? 'principal' : 'student'

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError("Registration failed. Please try again.")
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      role,
      institution_id: null,
      tenant_id: null,
    })

    if (profileError) {
      setError(`Profile setup failed: ${profileError.message}`)
      setLoading(false)
      return
    }

    // Institution accounts go directly to onboarding wizard
    // Student accounts go to the workspace router for role-based routing
    router.replace(
      accountType === 'institution'
        ? '/workspace/setup/wizard'
        : '/workspace/router'
    )
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
        <div className="relative space-y-6">
          {[
            { icon: 'biotech', text: 'Diagnose structural knowledge gaps in minutes' },
            { icon: 'account_tree', text: 'Map concept dependencies across your curriculum' },
            { icon: 'groups', text: 'Give every teacher and student a personalised view' },
            { icon: 'trending_up', text: 'Track institution-wide stability trends over time' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-4">
              <div className="size-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/15 shrink-0">
                <span className="material-symbols-outlined text-white/80 text-xl">{item.icon}</span>
              </div>
              <p className="text-white/80 text-sm font-medium">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="relative text-white/40 text-xs">No credit card required · Setup in under 5 minutes</p>
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-slate-500 mt-2">Free forever for students. Institutions get a 14-day trial.</p>
          </div>

          {/* Account type selector */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-slate-100 rounded-xl">
            {([
              { type: 'student', icon: 'person', label: 'Student' },
              { type: 'institution', icon: 'account_balance', label: 'Institution' },
            ] as const).map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setAccountType(opt.type)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  accountType === opt.type
                    ? 'bg-white text-primary shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {accountType === 'institution' && (
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 text-primary px-4 py-3 rounded-xl text-sm mb-5">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">info</span>
              <p>You&apos;ll set up your institution, grades, and team after creating your account.</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {accountType === 'institution' ? 'Your full name' : 'Full name'}
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {accountType === 'institution' ? 'Work email' : 'Email address'}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={accountType === 'institution' ? 'you@institution.edu' : 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                required
                disabled={loading}
                minLength={6}
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
                  Creating account…
                </>
              ) : (
                <>
                  {accountType === 'institution' ? 'Create institution account' : 'Create free account'}
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Sign in
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
