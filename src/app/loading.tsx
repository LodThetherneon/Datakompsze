export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Betöltés...</p>
      </div>
    </div>
  )
}