import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Token missing" }, { status: 400 })
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

    const { data: invite } = await supabase
      .from("invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single()

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 })
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({
        role: invite.role,
        tenant_id: invite.tenant_id
      })
      .eq("id", user.id)

    // Mark invite accepted
    await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invite.id)

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json({ error: "Accept failed" }, { status: 500 })
  }
}