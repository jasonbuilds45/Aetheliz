'use client'

import React, { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

type TopicProgress = {
  topic: string
  score: number
}

export default function B2CDashboard() {
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<TopicProgress[]>([])
  const [globalScore, setGlobalScore] = useState(0)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: sessions } = await supabase
      .from('probe_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (!sessions || sessions.length === 0) {
      setLoading(false)
      return
    }

    // Get latest session per topic
    const topicMap = new Map<string, any>()

    for (const session of sessions) {
      const topic = session.metadata?.topic
      if (!topicMap.has(topic)) {
        topicMap.set(topic, session)
      }
    }

    const topicProgress: TopicProgress[] = []

    topicMap.forEach((session) => {
      topicProgress.push({
        topic: session.metadata?.topic,
        score: Math.round((session.stability_score || 0) * 100),
      })
    })

    const global =
      topicProgress.reduce((sum, t) => sum + t.score, 0) /
      (topicProgress.length || 1)

    setTopics(topicProgress)
    setGlobalScore(Math.round(global))
    setLoading(false)
  }

  const getStatus = (score: number) => {
    if (score >= 80) return 'stable'
    if (score >= 40) return 'weak'
    return 'broken'
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Progress Overview
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Monitor your conceptual understanding across topics.
          </p>
        </div>

        <Button
          onClick={() => router.push('/b2c/diagnose')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl"
        >
          Run New Diagnostic
        </Button>
      </div>

      {/* Global Stability */}
      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Global Stability Index
        </p>

        {loading ? (
          <p className="text-slate-400 text-sm">Calculating...</p>
        ) : (
          <>
            <div className="flex items-baseline gap-4">
              <h2 className="text-6xl font-black text-indigo-600">
                {globalScore}%
              </h2>
              <span className="text-sm font-bold text-slate-400">
                Current Average
              </span>
            </div>

            <div className="mt-8 h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-3 bg-indigo-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${globalScore}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Topic History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
          Latest Diagnostics
        </h3>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading diagnostics...</p>
        ) : topics.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No diagnostics completed yet.
          </p>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <DiagnosticRow
                key={topic.topic}
                title={topic.topic}
                score={`${topic.score}%`}
                status={getStatus(topic.score)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DiagnosticRow({
  title,
  score,
  status,
}: {
  title: string
  score: string
  status: 'stable' | 'weak' | 'broken'
}) {
  const statusStyles = {
    stable: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    weak: 'text-amber-600 bg-amber-50 border-amber-100',
    broken: 'text-rose-600 bg-rose-50 border-rose-100',
  }

  return (
    <div className="flex justify-between items-center bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl transition-all hover:border-slate-200 hover:shadow-sm">
      <span className="text-sm font-bold text-slate-700">{title}</span>
      <span
        className={`px-4 py-1.5 rounded-lg text-sm font-black border ${statusStyles[status]}`}
      >
        {score}
      </span>
    </div>
  )
}