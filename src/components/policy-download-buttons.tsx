'use client'

import { Download } from 'lucide-react'

interface Props {
  policyId: string
  version: string | number
}

export function PolicyDownloadButtons({ policyId, version }: Props) {
  return (
    <a
      href={`/api/policy-docx/${policyId}`}
      download={`adatkezelesi_tajekoztato_v${version}.docx`}
      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-[12px] font-bold text-blue-700 transition-colors"
    >
      <Download size={13} /> DOCX
    </a>
  )
}
