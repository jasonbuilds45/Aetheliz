"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [tenantId, setTenantId] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link.")
      setLoading(false)
      return
    }

    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      const res = await fetch("/api/b2b/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invitation invalid or expired.")
        setLoading(false)
        return
      }

      setEmail(data.email)
      setRole(data.role)
      setTenantId(data.tenant_id)
      setLoading(false)

    } catch {
      setError("Failed to validate invitation.")
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!fullName || !password) {
      setError("Please complete all fields.")
      return
    }

    setSubmitting(true)
    setError(null)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password
      })

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message || "Signup failed.")
      setSubmitting(false)
      return
    }

    // Insert profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: signUpData.user.id,
        full_name: fullName,
        email,
        role,
        tenant_id: tenantId
      })

    if (profileError) {
      setError("Profile creation failed.")
      setSubmitting(false)
      return
    }

    // Mark invite accepted
    await fetch("/api/b2b/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    })

    router.replace("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Validating invitation...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center space-y-4">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm max-w-md w-full space-y-6">

        <h1 className="text-xl font-semibold text-slate-900">
          Complete Your Registration
        </h1>

        <p className="text-sm text-slate-500">
          Invited as <strong>{role}</strong>
        </p>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full border px-4 py-3 rounded-lg"
        />

        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border px-4 py-3 rounded-lg"
        />

        <button
          onClick={handleSignup}
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {submitting ? "Creating Account..." : "Create Account"}
        </button>

      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  )
}