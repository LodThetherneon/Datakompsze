'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-[12px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
    >
      Nyomtatás / PDF
    </button>
  )
}