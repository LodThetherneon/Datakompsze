'use client'

type Props = {
  children: React.ReactNode
}

export function SystemActionsCell({ children }: Props) {
  return (
    <div
      className="relative z-10 flex justify-end items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}