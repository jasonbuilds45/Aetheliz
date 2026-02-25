"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [status, setStatus] = useState<"loading" | "error">("loading")
  const [message, setMessage] = useState("Validating invitation...")

  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid invitation link.")
      return
    }

    handleAcceptance()
  }, [token])

  const handleAcceptance = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        setStatus("error")
        setMessage("You must complete login before accepting invite.")
        return
      }

      const res = await fetch("/api/b2b/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error || "Invitation validation failed.")
        return
      }

      router.replace("/dashboard")

    } catch {
      setStatus("error")
      setMessage("Something went wrong while accepting invitation.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm max-w-md w-full text-center space-y-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Invitation Processing
        </h1>

        {status === "loading" && (
          <div className="space-y-4">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-rose-600">{message}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  )
}