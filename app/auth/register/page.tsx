"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

type AccountType = "student" | "institution"

export default function RegisterPage() {
  const router = useRouter()

  const [accountType, setAccountType] = useState<AccountType>("student")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = accountType === "institution" ? "principal" : "student"

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

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

    // Create profile
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

    // If email confirmation is enabled, user must login manually
    if (!data.session) {
      setLoading(false)
      router.push("/auth/login")
      return
    }

    // 🔥 Clean institutional flow enforcement
    if (role === "principal") {
      router.push("/workspace/setup/wizard")
    } else {
      router.push("/dashboard")
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="size-9 bg-white/15 rounded-lg flex items-center justify-center border border-white/20">
            <span className="material-symbols-outlined text-white text-xl">
              analytics
            </span>
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase italic">
            Aetheliz
          </span>
        </Link>
        <p className="relative text-white/40 text-xs">
          No credit card required · Setup in under 5 minutes
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Create your account
            </h1>
            <p className="text-slate-500 mt-2">
              Free forever for students. Institutions get a 14-day trial.
            </p>
          </div>

          {/* Account type selector */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-slate-100 rounded-xl">
            {(["student", "institution"] as AccountType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                  accountType === type
                    ? "bg-white text-primary shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {type === "student" ? "Student" : "Institution"}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-bold">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}