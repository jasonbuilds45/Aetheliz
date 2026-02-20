"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

export default function PrincipalSettingsPage() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [institutionName, setInstitutionName] = useState("")
  const [domain, setDomain] = useState("")
  const [region, setRegion] = useState("")
  const [threshold, setThreshold] = useState(85)
  const [mode, setMode] = useState("adaptive")
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [plan, setPlan] = useState("trial")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get profile to fetch tenant
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

      if (!profile?.tenant_id) return

      setTenantId(profile.tenant_id)

      // Load tenant
      const { data: tenant } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .single()

      if (tenant) {
        setInstitutionName(tenant.name)
        setDomain(tenant.domain ?? "")
        setRegion(tenant.region ?? "")
        setPlan(tenant.subscription_plan ?? "trial")
      }

      // Load tenant settings
      const { data: settings } = await supabase
        .from("tenant_settings")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .maybeSingle()

      if (settings) {
        setThreshold(settings.default_mastery_threshold ?? 85)
        setMode(settings.diagnostic_mode ?? "adaptive")
        setAlertsEnabled(settings.fragility_alerts_enabled ?? true)
      }

      setLoading(false)
    }

    load()
  }, [])

  const handleSave = async () => {
    if (!tenantId) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Update tenant core data
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          name: institutionName,
          domain,
          region,
        })
        .eq("id", tenantId)

      if (tenantError) throw tenantError

      // Upsert tenant settings
      const { error: settingsError } = await supabase
        .from("tenant_settings")
        .upsert({
          tenant_id: tenantId,
          default_mastery_threshold: threshold,
          diagnostic_mode: mode,
          fragility_alerts_enabled: alertsEnabled,
        }, { onConflict: "tenant_id" })

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
    <div className="max-w-4xl mx-auto p-8 space-y-10">

      <h1 className="text-2xl font-bold">Institution Settings</h1>

      {/* Institution Info */}
      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Institution Profile</h2>

        <div>
          <label className="block mb-1 font-medium">Institution Name</label>
          <input
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Domain</label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Region</label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Subscription Plan</label>
          <div className="p-2 bg-slate-100 rounded text-sm font-semibold">
            {plan.toUpperCase()}
          </div>
        </div>
      </section>

      {/* Diagnostic Policy */}
      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Diagnostic Policy</h2>

        <div>
          <label className="block mb-1 font-medium">
            Default Mastery Threshold ({threshold}%)
          </label>
          <input
            type="range"
            min="60"
            max="100"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Diagnostic Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="strict">Strict (high fragility sensitivity)</option>
            <option value="adaptive">Adaptive (balanced)</option>
            <option value="conservative">Conservative (reduced alerts)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={alertsEnabled}
            onChange={(e) => setAlertsEnabled(e.target.checked)}
          />
          <label>Enable Fragility Alerts</label>
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