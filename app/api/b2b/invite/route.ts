import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      )
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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "principal") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const token = randomUUID()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error } = await supabase
      .from("invitations")
      .insert({
        email,
        role,
        tenant_id: profile.tenant_id,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        status: "pending"
      })

    if (error) {
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      )
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/accept-invite?token=${token}`

    return NextResponse.json({
      success: true,
      invite_link: inviteLink
    })

  } catch {
    return NextResponse.json(
      { error: "Invite failed" },
      { status: 500 }
    )
  }
}