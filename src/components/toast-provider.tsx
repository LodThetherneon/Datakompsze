'use client'

import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Slide-in a következő frame-ben
    const enterFrame = requestAnimationFrame(() => setVisible(true))

    // 3.5mp után slide-out, majd unmount
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 350)
    }, 3500)

    return () => {
      cancelAnimationFrame(enterFrame)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [toast.id, onRemove])

  const isSuccess = toast.type === 'success'

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible ? 1 : 0,
        transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease',
      }}
      className={`
        flex items-start gap-3 w-full max-w-[360px] px-4 py-3.5
        rounded-xl border shadow-lg bg-white
        ${isSuccess
          ? 'border-emerald-100 shadow-emerald-500/10'
          : 'border-red-100 shadow-red-500/10'
        }
      `}
    >
      {/* Ikon */}
      <div className={`shrink-0 mt-0.5 ${isSuccess ? 'text-emerald-500' : 'text-red-500'}`}>
        {isSuccess
          ? <CheckCircle2 size={18} strokeWidth={2.5} />
          : <XCircle size={18} strokeWidth={2.5} />
        }
      </div>

      {/* Üzenet */}
      <p className="flex-1 text-[13px] font-semibold text-slate-700 leading-snug">
        {toast.message}
      </p>

      {/* Bezárás */}
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onRemove(toast.id), 350)
        }}
        className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5 cursor-pointer"
        aria-label="Bezárás"
      >
        <X size={14} strokeWidth={2.5} />
      </button>

      {/* Progress bar */}
      <div
        className={`
          absolute bottom-0 left-0 h-[2px] rounded-b-xl
          ${isSuccess ? 'bg-emerald-400' : 'bg-red-400'}
        `}
        style={{
          width: visible ? '0%' : '100%',
          transition: visible ? 'width 3.5s linear' : 'none',
        }}
      />
    </div>
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const success = useCallback((message: string) => toast(message, 'success'), [toast])
  const error = useCallback((message: string) => toast(message, 'error'), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}

      {/* Portal: jobb alsó sarok */}
      <div
        aria-label="Értesítések"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto relative">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}