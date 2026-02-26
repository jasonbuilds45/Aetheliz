import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
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

    const { data: invite, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("token", token)
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 }
      )
    }

    // Check expiration
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)

    if (expiresAt < now) {
      return NextResponse.json(
        { error: "Invitation has expired." },
        { status: 400 }
      )
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json(
        { error: "Invitation already accepted." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      tenant_id: invite.tenant_id
    })

  } catch (error) {
    console.error("Validate invite error:", error)

    return NextResponse.json(
      { error: "Failed to validate invitation." },
      { status: 500 }
    )
  }
}