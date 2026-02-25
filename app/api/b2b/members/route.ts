import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get principal profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "principal") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Fetch all users in same tenant
    const { data: members, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("tenant_id", profile.tenant_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      members
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Members fetch failed" },
      { status: 500 }
    )
  }
}