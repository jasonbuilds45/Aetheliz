"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

export default function TenantStrategyOnboarding() {
  const router = useRouter()

  const [curriculumModel, setCurriculumModel] = useState("")
  const [masteryThreshold, setMasteryThreshold] = useState(85)
  const [diagnosticMode, setDiagnosticMode] = useState("balanced")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expired")

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, role")
        .eq("id", user.id)
        .single()

      if (!profile || profile.role !== "principal")
        throw new Error("Only principals can configure institution strategy.")

      if (!profile.tenant_id)
        throw new Error("Institution not configured properly.")

      const { error: insertError } = await supabase
        .from("tenant_settings")
        .insert({
          tenant_id: profile.tenant_id,
          curriculum_model: curriculumModel,
          mastery_threshold_default: masteryThreshold,
          diagnostic_mode: diagnosticMode,
        })

      if (insertError) throw insertError

      router.replace("/b2b/principal")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow space-y-8">

        <h1 className="text-2xl font-bold">
          Configure Diagnostic Strategy
        </h1>

        {/* Curriculum */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Curriculum Model
          </label>
          <input
            type="text"
            placeholder="e.g. National Curriculum, IB, Cambridge, Custom"
            value={curriculumModel}
            onChange={(e) => setCurriculumModel(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        {/* Mastery Threshold */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Default Mastery Threshold: {masteryThreshold}%
          </label>
          <input
            type="range"
            min={70}
            max={95}
            value={masteryThreshold}
            onChange={(e) => setMasteryThreshold(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-500 mt-1">
            Higher threshold = stricter stability expectations
          </p>
        </div>

        {/* Diagnostic Mode */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Diagnostic Mode
          </label>
          <select
            value={diagnosticMode}
            onChange={(e) => setDiagnosticMode(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="preventive">Preventive (early alerts)</option>
            <option value="balanced">Balanced (recommended)</option>
            <option value="strict">Strict (high sensitivity)</option>
          </select>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded font-bold disabled:opacity-50"
        >
          {loading ? "Saving..." : "Activate Institution"}
        </button>

      </div>
    </div>
  )
}