import Link from 'next/link'

const FEATURES = [
  {
    icon: 'biotech',
    title: 'Structural Diagnostics',
    desc: 'Pinpoint exactly where knowledge breaks down — not just what score a student got, but why their understanding fractures under pressure.',
  },
  {
    icon: 'account_tree',
    title: 'Concept Architecture',
    desc: 'Map the dependency tree of every subject. See which foundational concepts are load-bearing and which are at risk of collapse.',
  },
  {
    icon: 'trending_up',
    title: 'Stability Trends',
    desc: 'Track cohort-level stability over time. Catch fragility before it becomes failure — weeks before any exam.',
  },
  {
    icon: 'groups',
    title: 'Multi-Role Collaboration',
    desc: 'Principals see institution-wide patterns. Teachers target individual interventions. Students build self-awareness.',
  },
]

const STATS = [
  { value: '94%', label: 'Diagnostic accuracy' },
  { value: '3.2×', label: 'Faster intervention' },
  { value: '40K+', label: 'Students diagnosed' },
  { value: '180+', label: 'Institutions' },
]

const TESTIMONIALS = [
  {
    quote: 'Aetheliz showed us that 60% of our Grade 11 failures traced back to a single misunderstood concept in Grade 9. We fixed it in six weeks.',
    name: 'Dr. Patricia Osei',
    role: 'Academic Director, Westbridge Academy',
    avatar: 'PO',
  },
  {
    quote: 'My students now understand their own weak points before I even need to intervene. The self-diagnostic module changed how they study entirely.',
    name: 'Mr. James Carreira',
    role: 'Senior Chemistry Teacher',
    avatar: 'JC',
  },
  {
    quote: 'Finally a platform built for how knowledge actually works — not just tracking scores, but understanding structural integrity.',
    name: 'Prof. Aisha Mensah',
    role: 'Head of Curriculum, Northern Science Institute',
    avatar: 'AM',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/30">
              <span className="material-symbols-outlined text-white text-lg">analytics</span>
            </div>
            <span className="text-lg font-black tracking-tight text-primary uppercase italic">Aetheliz</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Stories</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-bold bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 transition-colors shadow-md shadow-primary/25"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e8edf5_1px,transparent_1px),linear-gradient(to_bottom,#e8edf5_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 text-primary text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">verified</span>
            Trusted by 180+ institutions worldwide
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-slate-900">
            See exactly where{' '}
            <span className="text-primary italic">knowledge breaks.</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Aetheliz diagnoses the structural integrity of student understanding — not just scores,
            but the precise concepts where comprehension fractures. Built for institutions that
            refuse to guess.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-800 transition-all shadow-lg shadow-primary/30 text-base"
            >
              Start free — no credit card
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-bold px-8 py-4 rounded-xl hover:bg-slate-200 transition-all text-base"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-12 border-y border-slate-100 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-black text-primary">{s.value}</p>
              <p className="text-sm text-slate-500 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">Platform capabilities</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Every layer of understanding,<br />made visible.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="size-12 bg-primary/8 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all">
                  <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">The process</p>
            <h2 className="text-4xl font-black tracking-tight">From diagnosis to clarity in three steps.</h2>
          </div>
          <div className="space-y-6">
            {[
              { n: '01', title: 'Probe the structure', desc: 'Students complete targeted diagnostic probes — not tests. Each probe is engineered to reveal exactly where the understanding chain breaks, not just whether an answer is right.' },
              { n: '02', title: 'Analyse the architecture', desc: 'Aetheliz maps each result to a concept dependency tree. You see which foundational ideas are stable, which are fragile, and which are about to collapse under exam pressure.' },
              { n: '03', title: 'Prescribe structural repair', desc: 'Teachers receive precise intervention targets. Students get personalised repair paths. Principals track cohort-level stability trends over time.' },
            ].map((step) => (
              <div key={step.n} className="flex gap-6 bg-white border border-slate-200 rounded-2xl p-8">
                <div className="text-4xl font-black text-primary/20 shrink-0 w-12">{step.n}</div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">From the field</p>
            <h2 className="text-4xl font-black tracking-tight">Institutions that stopped guessing.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col gap-6">
                <p className="text-slate-600 text-sm leading-relaxed italic flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-none">{t.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Ready to see inside your students&apos; understanding?
          </h2>
          <p className="text-primary-200 text-lg mb-10">
            Set up your institution in under 5 minutes. No contracts. No credit card.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-primary font-black px-8 py-4 rounded-xl hover:bg-slate-50 transition-all text-base shadow-xl"
            >
              Create free account
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-primary-800 text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-900 transition-all text-base border border-white/20"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-primary rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">analytics</span>
            </div>
            <span className="text-sm font-black text-primary uppercase italic tracking-tight">Aetheliz</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Aetheliz. Structural diagnostic intelligence for education.</p>
          <div className="flex gap-6 text-xs text-slate-400 font-medium">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
