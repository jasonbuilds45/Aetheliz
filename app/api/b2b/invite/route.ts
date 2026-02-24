import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    if (!["teacher", "student"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {}
        }
      }
    )

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get principal profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "principal") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const token = crypto.randomBytes(32).toString("hex")

    const { error: inviteError } = await supabase
      .from("invitations")
      .insert({
        email,
        role,
        tenant_id: profile.tenant_id,
        token,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })

    if (inviteError) {
      return NextResponse.json({ error: "Invite failed" }, { status: 500 })
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${token}`

    // Send magic link email
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: inviteLink
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ error: "Invite failed" }, { status: 500 })
  }
}