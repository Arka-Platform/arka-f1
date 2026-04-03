'use client'

import React from 'react'

interface Props {
  name: string
  trust: number
}

export default function UserInline({ name, trust }: Props) {
  return (
    <div className="flex items-center justify-between mt-5">

      <span className="text-[14px] font-medium text-[#1c1917]/90">
        {name}
      </span>

      <div className="flex items-center gap-2">

        <div className="w-[60px] h-[5px] bg-black/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1c1917]/70"
            style={{ width: `${trust}%` }}
          />
        </div>

        <span className="text-[12px] text-[#1c1917]/60">
          {trust}
        </span>

      </div>

    </div>
  )
}
