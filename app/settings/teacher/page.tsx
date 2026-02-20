"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

export default function TeacherSettingsPage() {
  const [fullName, setFullName] = useState("")
  const [defaultClass, setDefaultClass] = useState<string | null>(null)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [autoSave, setAutoSave] = useState(true)
  const [intensity, setIntensity] = useState("balanced")
  const [notifications, setNotifications] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, tenant_id")
        .eq("id", user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name ?? "")
      }

      // Load classes assigned to teacher
      const { data: teacherClasses } = await supabase
        .from("teacher_assignments")
        .select("class_id, classes(name)")
        .eq("teacher_id", user.id)

      if (teacherClasses) {
        const mapped = teacherClasses.map((c: any) => ({
          id: c.class_id,
          name: c.classes?.name ?? "Unnamed Class"
        }))
        setClasses(mapped)
      }

      // Load teacher settings
      const { data: settings } = await supabase
        .from("teacher_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (settings) {
        setDefaultClass(settings.default_class_id)
        setAutoSave(settings.auto_save_enabled ?? true)
        setIntensity(settings.diagnostic_intensity ?? "balanced")
        setNotifications(settings.notifications_enabled ?? true)
      }

      setLoading(false)
    }

    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expired")

      // Update profile name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Upsert teacher settings
      const { error: settingsError } = await supabase
        .from("teacher_settings")
        .upsert({
          user_id: user.id,
          default_class_id: defaultClass,
          auto_save_enabled: autoSave,
          diagnostic_intensity: intensity,
          notifications_enabled: notifications,
        }, { onConflict: "user_id" })

      if (settingsError) throw settingsError

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-10">Loading settings...</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-10">

      <h1 className="text-2xl font-bold">Teacher Settings</h1>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Profile</h2>

        <div>
          <label className="block mb-1 font-medium">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
      </section>

      {/* Classroom Preferences */}
      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Classroom Preferences</h2>

        <div>
          <label className="block mb-1 font-medium">Default Class</label>
          <select
            value={defaultClass ?? ""}
            onChange={(e) => setDefaultClass(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">None</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          <label>Enable Auto-Save During Probe Launch</label>
        </div>

        <div>
          <label className="block mb-1 font-medium">Diagnostic Intensity</label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="gentle">Gentle</option>
            <option value="balanced">Balanced</option>
            <option value="rigorous">Rigorous</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
          <label>Enable Email Notifications</label>
        </div>
      </section>

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">Settings updated successfully.</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-white px-6 py-3 rounded font-bold"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

    </div>
  )
}