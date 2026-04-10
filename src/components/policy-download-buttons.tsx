'use client'

import { Download } from 'lucide-react'

interface Props {
  policyId: string
  version: string | number
}

export function PolicyDownloadButtons({ policyId, version }: Props) {
  return (
    <div className="flex items-center gap-2">
      <a
        href={`/api/policy-pdf/${policyId}`}
        download={`adatkezelesi_tajekoztato_v${version}.pdf`}
        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-[12px] font-bold text-red-700 transition-colors"
      >
        <Download size={13} /> PDF
      </a>
      <a
        href={`/api/policy-docx/${policyId}`}
        download={`adatkezelesi_tajekoztato_v${version}.docx`}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-[12px] font-bold text-blue-700 transition-colors"
      >
        <Download size={13} /> DOCX
      </a>
    </div>
  )
}