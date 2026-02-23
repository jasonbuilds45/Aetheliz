"use client"

import Link from "next/link"

export default function RepairQueue() {
  return (
    <div className="space-y-12">

      <div>
        <h1 className="text-lg uppercase tracking-widest text-neutral-400">
          Recovery Queue
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Concepts requiring structural stabilization.
        </p>
      </div>

      <div className="border border-neutral-800 bg-neutral-900 p-8 text-sm text-neutral-400">
        No pending reconstructions.
      </div>

    </div>
  )
}