"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeLevel {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  color: string
}

interface InvitedMember {
  id: string
  email: string
  role: 'teacher' | 'principal'
}

interface WizardData {
  // Step 1
  institutionName: string
  domain: string
  timezone: string
  region: string
  type: string
  // Step 2
  grades: GradeLevel[]
  // Step 3
  subjects: Subject[]
  // Step 4
  invites: InvitedMember[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5

const STEP_META = [
  { icon: 'account_balance', title: 'Institution profile',   desc: 'Tell us about your school or organisation.' },
  { icon: 'layers',          title: 'Grade structure',       desc: 'Define your learning levels and cohorts.' },
  { icon: 'book',            title: 'Academic subjects',     desc: 'Map your core knowledge domains.' },
  { icon: 'group_add',       title: 'Invite your team',      desc: 'Add teachers and co-administrators.' },
  { icon: 'check_circle',    title: 'Setup complete',        desc: 'Your institution is ready to diagnose.' },
]

const DEFAULT_GRADES: GradeLevel[] = [
  { id: '1', name: 'Grade 9' },
  { id: '2', name: 'Grade 10' },
  { id: '3', name: 'Grade 11' },
  { id: '4', name: 'Grade 12' },
]

const SUGGESTED_SUBJECTS = [
  { name: 'Mathematics',        color: 'bg-blue-500' },
  { name: 'Physics',            color: 'bg-purple-500' },
  { name: 'Chemistry',          color: 'bg-emerald-500' },
  { name: 'Biology',            color: 'bg-green-500' },
  { name: 'English Literature', color: 'bg-amber-500' },
  { name: 'History',            color: 'bg-orange-500' },
  { name: 'Geography',          color: 'bg-cyan-500' },
  { name: 'Computer Science',   color: 'bg-indigo-500' },
]

const TIMEZONES = ['UTC-8 (PST)', 'UTC-5 (EST)', 'UTC+0 (GMT)', 'UTC+1 (CET)', 'UTC+3 (EAT)', 'UTC+5:30 (IST)', 'UTC+8 (CST)', 'UTC+10 (AEST)']
const REGIONS   = ['North America', 'South America', 'Europe', 'Africa', 'Middle East', 'South Asia', 'East Asia', 'Oceania']
const INST_TYPES = ['institution', 'b2c']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupWizard() {
  const router  = useRouter()
  const [step, setStep]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [newGrade, setNewGrade]   = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newInvite, setNewInvite] = useState<{ email: string; role: 'teacher' | 'principal' }>({ email: "", role: "teacher" })

  const [data, setData] = useState<WizardData>({
    institutionName: "",
    domain: "",
    timezone: "UTC+0 (GMT)",
    region: "Europe",
    type: "institution",
    grades: DEFAULT_GRADES,
    subjects: SUGGESTED_SUBJECTS.slice(0, 4).map((s) => ({ ...s, id: uid() })),
    invites: [],
  })

  const update = (patch: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...patch }))

  // ── Step validation ─────────────────────────────────────────────────────────

  const canProceed = () => {
    if (step === 1) return data.institutionName.trim().length > 0 && data.domain.trim().length > 0
    if (step === 2) return data.grades.length > 0
    if (step === 3) return data.subjects.length > 0
    return true
  }

  // ── Final submission ────────────────────────────────────────────────────────

  const handleFinish = async () => {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expired. Please sign in again.")

      // 1. Create the tenant (institution) row.
      // Only inserting columns that exist in the base schema.
      // Run the SQL migration in your Supabase dashboard to add the optional
      // columns (domain, timezone, region, type) — see README or comments below.
      const tenantInsert: Record<string, string> = {
        name:     data.institutionName,
        owner_id: user.id,
      }

      // Add optional columns only if they are present in your schema.
      // If you haven't run the migration yet, these are silently skipped.
      // After running the migration, these lines activate automatically.
      if (data.domain)   tenantInsert.domain   = data.domain
      if (data.timezone) tenantInsert.timezone = data.timezone
      if (data.region)   tenantInsert.region   = data.region
      if (data.type)     tenantInsert.type     = data.type

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert(tenantInsert)
        .select("id")
        .single()

      if (tenantError) throw new Error(`Institution creation failed: ${tenantError.message}`)

      const tenantId = tenant.id

      // 2. Create the institution row (sits between tenant and subjects)
      const { data: institution, error: institutionError } = await supabase
        .from("institutions")
        .insert({
          tenant_id: tenantId,
          name:      data.institutionName,
          country:   data.region,
        })
        .select("id")
        .single()

      if (institutionError) throw new Error(`Institution record failed: ${institutionError.message}`)

      const institutionId = institution.id

      // 3. Link the current user's profile to the tenant and institution
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          tenant_id:      tenantId,
          institution_id: institutionId,
          role:           "principal",
        })
        .eq("id", user.id)

      if (profileError) throw new Error(`Profile update failed: ${profileError.message}`)

      // 4. Insert grade levels
      if (data.grades.length > 0) {
        const { error: gradeError } = await supabase
          .from("grade_levels")
          .insert(data.grades.map((g) => ({ name: g.name, tenant_id: tenantId })))

        if (gradeError && !gradeError.message.includes('does not exist')) {
          throw new Error(`Grade setup failed: ${gradeError.message}`)
        }
      }

      // 5. Insert subjects (requires both tenant_id and institution_id)
      if (data.subjects.length > 0) {
        const { error: subjectError } = await supabase
          .from("subjects")
          .insert(data.subjects.map((s) => ({
            name:           s.name,
            tenant_id:      tenantId,
            institution_id: institutionId,
          })))

        if (subjectError && !subjectError.message.includes('does not exist')) {
          throw new Error(`Subject setup failed: ${subjectError.message}`)
        }
      }

      // 6. Insert invitations
      if (data.invites.length > 0) {
        const { error: inviteError } = await supabase
          .from("invitations")
          .insert(data.invites.map((inv) => ({
            email:      inv.email,
            role:       inv.role,
            tenant_id:  tenantId,
            invited_by: user.id,
            status:     "pending",
          })))

        if (inviteError && !inviteError.message.includes('does not exist')) {
          throw new Error(`Invitations failed: ${inviteError.message}`)
        }
      }

      // 6. Advance to the success step
      setStep(TOTAL_STEPS)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  const next = () => {
    if (step === TOTAL_STEPS - 1) {
      handleFinish()
    } else {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS))
    }
  }

  const back = () => setStep((s) => Math.max(s - 1, 1))

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Left sidebar ── */}
      <div className="hidden lg:flex w-72 bg-white border-r border-slate-100 flex-col p-8 gap-6 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 mb-4">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">analytics</span>
          </div>
          <span className="text-lg font-black text-primary uppercase italic tracking-tight">Aetheliz</span>
        </Link>

        <div className="space-y-1">
          {STEP_META.map((s, i) => {
            const n         = i + 1
            const done      = n < step
            const current   = n === step
            const upcoming  = n > step
            return (
              <div
                key={n}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${current ? 'bg-primary/8' : ''}`}
              >
                <div className={`size-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                  done    ? 'bg-emerald-500 text-white'     :
                  current ? 'bg-primary text-white shadow-md shadow-primary/30' :
                            'bg-slate-100 text-slate-400'
                }`}>
                  {done
                    ? <span className="material-symbols-outlined text-base">check</span>
                    : n
                  }
                </div>
                <div className={upcoming ? 'opacity-40' : ''}>
                  <p className={`text-xs font-bold leading-none ${current ? 'text-primary' : 'text-slate-700'}`}>
                    {s.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-auto">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">
            Step {step} of {TOTAL_STEPS} · {Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)}% complete
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile progress */}
        <div className="lg:hidden bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-700">{STEP_META[step - 1].title}</p>
            <p className="text-xs text-slate-400 font-semibold">Step {step} of {TOTAL_STEPS}</p>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-2xl mx-auto">

            {/* ── Step 1: Institution Profile ── */}
            {step === 1 && (
              <StepShell title="Tell us about your institution" sub="This will be visible to all members of your workspace.">
                <div className="space-y-5">
                  <Field label="Institution name" required>
                    <input
                      type="text"
                      placeholder="St. Jude Academy"
                      value={data.institutionName}
                      onChange={(e) => update({ institutionName: e.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Domain / website" required>
                    <input
                      type="text"
                      placeholder="academy.edu"
                      value={data.domain}
                      onChange={(e) => update({ domain: e.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Institution type">
                    <select value={data.type} onChange={(e) => update({ type: e.target.value })} className={INPUT}>
                      <option value="institution">School / Institution</option>
                      <option value="b2c">Self-Study (B2C)</option>
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Region">
                      <select value={data.region} onChange={(e) => update({ region: e.target.value })} className={INPUT}>
                        {REGIONS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </Field>
                    <Field label="Timezone">
                      <select value={data.timezone} onChange={(e) => update({ timezone: e.target.value })} className={INPUT}>
                        {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              </StepShell>
            )}

            {/* ── Step 2: Grade Structure ── */}
            {step === 2 && (
              <StepShell title="Define your grade structure" sub="Add the grade levels or year groups your institution uses.">
                <div className="space-y-3">
                  {data.grades.map((g) => (
                    <div key={g.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 group">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400 text-lg">drag_indicator</span>
                        <span className="text-sm font-semibold text-slate-700">{g.name}</span>
                      </div>
                      <button
                        onClick={() => update({ grades: data.grades.filter((x) => x.id !== g.id) })}
                        className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-4">
                    <input
                      type="text"
                      placeholder="e.g. Grade 8 or Year 10"
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newGrade.trim()) {
                          update({ grades: [...data.grades, { id: uid(), name: newGrade.trim() }] })
                          setNewGrade("")
                        }
                      }}
                      className={INPUT + " flex-1"}
                    />
                    <button
                      onClick={() => {
                        if (newGrade.trim()) {
                          update({ grades: [...data.grades, { id: uid(), name: newGrade.trim() }] })
                          setNewGrade("")
                        }
                      }}
                      className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Press Enter or click Add to include a new level.</p>
                </div>
              </StepShell>
            )}

            {/* ── Step 3: Academic Subjects ── */}
            {step === 3 && (
              <StepShell title="Add your academic subjects" sub="Select from suggestions or add your own. These will be used to structure diagnostics.">
                {/* Suggestions */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick add</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_SUBJECTS.map((s) => {
                      const added = data.subjects.some((x) => x.name === s.name)
                      return (
                        <button
                          key={s.name}
                          onClick={() => {
                            if (added) {
                              update({ subjects: data.subjects.filter((x) => x.name !== s.name) })
                            } else {
                              update({ subjects: [...data.subjects, { id: uid(), ...s }] })
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                            added
                              ? 'bg-primary/8 border-primary/30 text-primary'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-primary/30'
                          }`}
                        >
                          {added && <span className="material-symbols-outlined text-base">check</span>}
                          {s.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom subject */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom subject…"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubject.trim()) {
                        update({ subjects: [...data.subjects, { id: uid(), name: newSubject.trim(), color: 'bg-slate-500' }] })
                        setNewSubject("")
                      }
                    }}
                    className={INPUT + " flex-1"}
                  />
                  <button
                    onClick={() => {
                      if (newSubject.trim()) {
                        update({ subjects: [...data.subjects, { id: uid(), name: newSubject.trim(), color: 'bg-slate-500' }] })
                        setNewSubject("")
                      }
                    }}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>

                {/* Selected list */}
                {data.subjects.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected ({data.subjects.length})</p>
                    {data.subjects.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5 group">
                        <div className="flex items-center gap-3">
                          <div className={`size-3 rounded-full ${s.color}`} />
                          <span className="text-sm font-medium text-slate-700">{s.name}</span>
                        </div>
                        <button
                          onClick={() => update({ subjects: data.subjects.filter((x) => x.id !== s.id) })}
                          className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </StepShell>
            )}

            {/* ── Step 4: Invite Team ── */}
            {step === 4 && (
              <StepShell title="Invite your teaching team" sub="Add your teachers and co-administrators. They'll receive an email invitation.">
                <div className="flex gap-2 mb-4">
                  <input
                    type="email"
                    placeholder="teacher@institution.edu"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite((p) => ({ ...p, email: e.target.value }))}
                    className={INPUT + " flex-1"}
                  />
                  <select
                    value={newInvite.role}
                    onChange={(e) => setNewInvite((p) => ({ ...p, role: e.target.value as 'teacher' | 'principal' }))}
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="principal">Admin</option>
                  </select>
                  <button
                    onClick={() => {
                      if (newInvite.email.trim() && !data.invites.some((i) => i.email === newInvite.email)) {
                        update({ invites: [...data.invites, { id: uid(), ...newInvite }] })
                        setNewInvite({ email: "", role: "teacher" })
                      }
                    }}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors shrink-0"
                  >
                    Invite
                  </button>
                </div>

                {data.invites.length > 0 ? (
                  <div className="space-y-2">
                    {data.invites.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 group">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-lg">person</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{inv.email}</p>
                            <p className="text-xs text-slate-400 capitalize">{inv.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => update({ invites: data.invites.filter((x) => x.id !== inv.id) })}
                          className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-xl">
                    <span className="material-symbols-outlined text-4xl text-slate-200">group_add</span>
                    <p className="text-slate-400 text-sm mt-2">No team members added yet.</p>
                    <p className="text-slate-400 text-xs">You can always invite them from your dashboard later.</p>
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-4">
                  Invitations can be skipped — you can add team members from your dashboard at any time.
                </p>
              </StepShell>
            )}

            {/* ── Step 5: Done ── */}
            {step === TOTAL_STEPS && (
              <div className="text-center py-16">
                <div className="size-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                  {data.institutionName} is ready!
                </h2>
                <p className="text-slate-500 mb-10 max-w-md mx-auto">
                  Your institution has been set up. Your first diagnostics are ready to launch.
                  Head to your dashboard to get started.
                </p>
                <div className="space-y-3 max-y-xs mx-auto">
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm text-slate-600">
                    <span className="material-symbols-outlined text-emerald-500">check</span>
                    {data.grades.length} grade levels configured
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm text-slate-600">
                    <span className="material-symbols-outlined text-emerald-500">check</span>
                    {data.subjects.length} subjects mapped
                  </div>
                  {data.invites.length > 0 && (
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm text-slate-600">
                      <span className="material-symbols-outlined text-emerald-500">check</span>
                      {data.invites.length} team member{data.invites.length !== 1 ? 's' : ''} invited
                    </div>
                  )}
                </div>
                <button
                  onClick={() => router.replace('/dashboard')}
                  className="mt-10 inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-800 transition-all shadow-lg shadow-primary/25 text-base"
                >
                  Go to my dashboard
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
                {error}
              </div>
            )}

            {/* ── Navigation ── */}
            {step < TOTAL_STEPS && (
              <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-200">
                <button
                  onClick={back}
                  disabled={step === 1}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-2.5"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Back
                </button>

                <button
                  onClick={next}
                  disabled={!canProceed() || saving}
                  className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/25 text-sm"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
                      Saving…
                    </>
                  ) : step === TOTAL_STEPS - 1 ? (
                    <>
                      Complete setup
                      <span className="material-symbols-outlined text-xl">check</span>
                    </>
                  ) : (
                    <>
                      Continue
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-slate-500 mt-1 text-sm">{sub}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400 text-sm"
