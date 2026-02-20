"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

export default function AcceptInvitePage() {
  const { token } = useParams()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [invite, setInvite] = useState<any>(null)

  useEffect(() => {
    const loadInvite = async () => {
      const { data } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", token)
        .maybeSingle()

      if (!data) {
        setError("Invalid invitation.")
        setLoading(false)
        return
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("Invitation expired.")
        setLoading(false)
        return
      }

      if (data.accepted_at) {
        setError("Invitation already used.")
        setLoading(false)
        return
      }

      setInvite(data)
      setEmail(data.email)
      setLoading(false)
    }

    loadInvite()
  }, [token])

  const handleAccept = async () => {
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error || !data.user) {
      setError(error?.message ?? "Signup failed.")
      return
    }

    // Create profile
    await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        email,
        role: invite.role,
        tenant_id: invite.tenant_id,
      }, { onConflict: "id" })

    // Mark invitation accepted
    await supabase
      .from("invitations")
      .update({
        accepted_at: new Date(),
        status: "accepted"
      })
      .eq("token", token)

    router.push("/dashboard")
  }

  if (loading) return <div className="p-10">Validating invite...</div>

  return (
    <div className="max-w-md mx-auto p-10 space-y-6">
      <h1 className="text-xl font-bold">Accept Invitation</h1>

      {error && <div className="text-red-600">{error}</div>}

      {!error && (
        <>
          <div>
            <label>Email</label>
            <input
              value={email}
              disabled
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label>Create Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <button
            onClick={handleAccept}
            className="bg-primary text-white px-6 py-3 rounded font-bold w-full"
          >
            Create Account
          </button>
        </>
      )}
    </div>
  )
}