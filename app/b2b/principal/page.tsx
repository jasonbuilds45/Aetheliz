"use client"

import React, { useEffect, useState } from "react"
import { Card } from "@/components/ui/Card"

type Member = {
  id: string
  full_name: string
  email: string
  role: "principal" | "teacher" | "student"
  created_at: string
}

export default function PrincipalDashboard() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"teacher" | "student">("teacher")
  const [inviting, setInviting] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/b2b/members")
      const data = await res.json()
      setMembers(data.members || [])
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
  if (!inviteEmail) return

  setInviting(true)

  try {
    const res = await fetch("/api/b2b/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole
      })
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Invite failed")
      return
    }

    if (data.invite_link) {
      setGeneratedLink(data.invite_link)
    }

  } catch {
    alert("Something went wrong")
  }

  setInviteEmail("")
  setInviteOpen(false)
  setInviting(false)
}

  const teachers = members.filter(m => m.role === "teacher")
  const students = members.filter(m => m.role === "student")

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Institution Overview
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Manage teachers and students in your institution.
          </p>
        </div>

        <button
          onClick={() => setInviteOpen(true)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          Invite Member
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Total Members" value={members.length.toString()} />
        <MetricCard label="Teachers" value={teachers.length.toString()} />
        <MetricCard label="Students" value={students.length.toString()} />
      </div>

      {/* Members Table */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            Institution Members
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-slate-500">
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-sm text-slate-400">
            No members yet. Invite teachers or students to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-slate-800">
                      {member.full_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {member.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600">
                        {member.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Invite Member
            </h2>

            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full border border-slate-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as any)}
              className="w-full border border-slate-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setInviteOpen(false)}
                className="px-5 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>

              <button
                onClick={handleInvite}
                disabled={inviting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

{/* Generated Link Modal */}
{generatedLink && (
  <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-lg space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Invite Link Generated
      </h2>

      <p className="text-sm text-slate-500">
        Share this link with the invited member:
      </p>

      <div className="flex gap-2">
        <input
          value={generatedLink}
          readOnly
          className="flex-1 border border-slate-300 px-4 py-3 rounded-lg text-sm text-slate-700"
        />

        <button
          onClick={() => {
            navigator.clipboard.writeText(generatedLink)
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
        >
          Copy
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setGeneratedLink(null)}
          className="px-5 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-6">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <h3 className="text-3xl font-bold text-slate-900">
        {value}
      </h3>
    </Card>
  )
}