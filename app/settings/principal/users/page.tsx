"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

type UserRow = {
  id: string
  full_name: string
  email: string
  role: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile?.tenant_id) {
      setLoading(false)
      return
    }

    setTenantId(profile.tenant_id)

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("tenant_id", profile.tenant_id)

    if (data) setUsers(data)

    setLoading(false)
  }

  const changeRole = async (id: string, newRole: string) => {
    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id)

    loadUsers()
  }

  const removeUser = async (id: string) => {
    await supabase
      .from("profiles")
      .delete()
      .eq("id", id)

    loadUsers()
  }

  // 🔐 TOKEN-BASED INVITE LOGIC
  const inviteTeacher = async () => {
    if (!tenantId || !inviteEmail) return

    setError(null)
    setSuccess(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const token = crypto.randomUUID()

    const { error } = await supabase
      .from("invitations")
      .insert({
        email: inviteEmail,
        role: "teacher",
        tenant_id: tenantId,
        invited_by: user.id,
        status: "pending",
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })

    if (error) {
      setError(error.message)
      return
    }

    const inviteLink = `${window.location.origin}/invite/${token}`

    // For now we log it (replace with email service later)
    console.log("Invite link:", inviteLink)

    setSuccess("Invitation created. Invite link generated in console.")
    setInviteEmail("")
  }

  if (loading) {
    return <div className="p-10">Loading users...</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">

      <h1 className="text-2xl font-bold">User Management</h1>

      {/* Invite Section */}
      <div className="border p-6 rounded space-y-4">
        <h2 className="font-semibold text-lg">Invite Teacher</h2>

        <div className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teacher@institution.edu"
            className="flex-1 border rounded p-2"
          />
          <button
            onClick={inviteTeacher}
            className="bg-primary text-white px-5 py-2 rounded font-semibold"
          >
            Invite
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.full_name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="principal">Principal</option>
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => removeUser(user.id)}
                    className="text-red-600 font-semibold"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

    </div>
  )
}