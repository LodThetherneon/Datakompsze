'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, FolderKanban, ChevronDown, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/toast-provider'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Department {
  id: string
  name: string
}

interface Props {
  addAction: (formData: FormData) => Promise<void>
  addDepartmentAction: (formData: FormData) => Promise<void>
  departments: Department[]
  knownProcessNames: string[]
}

const UNIT_OPTIONS = [
  { value: 'nap',   label: 'Nap' },
  { value: 'hónap', label: 'Hónap' },
  { value: 'év',    label: 'Év' },
]

// ─── Mini combobox ────────────────────────────────────────────────────────────
function DepartmentCombobox({
  departments,
  value,
  onChange,
}: {
  departments: Department[]
  value: string
  onChange: (val: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [inputVal, setInputVal] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setInputVal(value) }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(inputVal.toLowerCase())
  )

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  const handleSelect = (name: string) => {
    setInputVal(name)
    onChange(name)
    setOpen(false)
  }

  const isKnown = departments.some(
    (d) => d.name.toLowerCase() === inputVal.toLowerCase()
  )
  const showNewBadge = inputVal.trim().length > 0 && !isKnown

  return (
    <div ref={ref} className="relative">
      <div className="relative flex items-center">
        <input
          value={inputVal}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Írjon be vagy válasszon egységet..."
          autoComplete="off"
          className="w-full h-11 px-3 pr-10 rounded-lg border border-slate-200 bg-slate-50 text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((v) => !v)}
          className="absolute right-3 text-slate-400 hover:text-slate-600"
        >
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showNewBadge && (
        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full pointer-events-none">
          ÚJ
        </span>
      )}

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filtered.length === 0 && inputVal.trim() === '' && (
            <p className="text-xs text-slate-400 text-center py-4 px-3">
              Még nincs szervezeti egység. Írjon be egyet!
            </p>
          )}
          {filtered.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleSelect(d.name)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
            >
              {d.name}
              {d.name.toLowerCase() === inputVal.toLowerCase() && (
                <Check size={14} className="text-emerald-600" />
              )}
            </button>
          ))}
          {inputVal.trim() !== '' && !isKnown && (
            <button
              type="button"
              onClick={() => handleSelect(inputVal.trim())}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors text-left border-t border-amber-100"
            >
              <Plus size={13} />
              „{inputVal.trim()}" használata
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Főkomponens ──────────────────────────────────────────────────────────────
export function AddProcessDialog({
  addAction,
  addDepartmentAction,
  departments,
  knownProcessNames,
}: Props) {
  const [open, setOpen]               = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deptValue, setDeptValue]     = useState('')
  const [retentionValue, setRetentionValue] = useState('')
  const [retentionUnit, setRetentionUnit]   = useState('év')
  

  const [confirmNewDept, setConfirmNewDept] = useState<{
    name: string
    pendingFormData: FormData
  } | null>(null)

  const { success, error } = useToast()

  const isKnownDept = departments.some(
    (d) => d.name.toLowerCase() === deptValue.trim().toLowerCase()
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const formData = new FormData(e.currentTarget)
    formData.set('department_name', deptValue.trim())

    const retentionStr = retentionValue.trim()
      ? `${retentionValue.trim()} ${retentionUnit}`
      : ''
    formData.set('retention_period', retentionStr)

    if (!retentionValue.trim() || parseInt(retentionValue, 10) < 1) {
      error('A megőrzési idő megadása kötelező.')
      return
    }

    if (!formData.get('storage_location')) {
      error('A tárolás helye megadása kötelező.')
      return
    }

    if (deptValue.trim() && !isKnownDept) {
      setConfirmNewDept({ name: deptValue.trim(), pendingFormData: formData })
      return
    }

    await submitProcess(formData)
  }

  const submitProcess = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await addAction(formData)
      setOpen(false)
      setDeptValue('')
      setRetentionValue('')
      setRetentionUnit('év')
      setConfirmNewDept(null)
      success('Folyamat sikeresen rögzítve!')
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt a mentés során.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmSaveDept = async () => {
    if (!confirmNewDept) return
    setIsSubmitting(true)
    try {
      const deptForm = new FormData()
      deptForm.append('name', confirmNewDept.name)
      await addDepartmentAction(deptForm)
      await submitProcess(confirmNewDept.pendingFormData)
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt.')
      setIsSubmitting(false)
    }
  }

  const handleConfirmSkipDept = async () => {
    if (!confirmNewDept) return
    await submitProcess(confirmNewDept.pendingFormData)
  }

  const handleClose = (v: boolean) => {
    setOpen(v)
    if (!v) {
      setDeptValue('')
      setRetentionValue('')
      setRetentionUnit('év')
      setConfirmNewDept(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger
          nativeButton={false}
          render={(props) => (
            <div
              {...props}
              role="button"
              tabIndex={0}
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] rounded-lg px-6 h-11 cursor-pointer"
            >
              <Plus size={18} className="mr-2" />
              Új folyamat rögzítése
            </div>
          )}
        />

        <DialogContent className="sm:max-w-[520px] rounded-2xl p-6 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white">

          {/* ── Confirm overlay: ismeretlen szervezeti egység ── */}
          {confirmNewDept ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <FolderKanban className="text-amber-500" size={26} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Ismeretlen szervezeti egység
                </h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  A(z){' '}
                  <span className="font-bold text-slate-700">„{confirmNewDept.name}"</span>{' '}
                  még nincs a szervezeti egységek között. Szeretné hozzáadni a listához?
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConfirmSkipDept}
                  disabled={isSubmitting}
                  className="flex-1 border-slate-200 text-slate-600"
                >
                  Nem
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSaveDept}
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? 'Mentés...' : 'Igen, hozzáadja'}
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setConfirmNewDept(null)}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                ← Vissza a szerkesztéshez
              </button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <FolderKanban className="text-emerald-600" size={24} />
                </div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  Új adatkezelési folyamat
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 pt-1">
                  Rögzítsen egy új adatkezelési tevékenységet. 
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-4">

                {/* Szervezeti egység */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Szervezeti egység
                  </label>
                  <DepartmentCombobox
                    departments={departments}
                    value={deptValue}
                    onChange={setDeptValue}
                  />
                  {deptValue.trim() && !isKnownDept && (
                    <p className="text-[11px] text-amber-600 font-medium pl-1">
                      Ez egy új szervezeti egység.
                    </p>
                  )}
                </div>

                {/* Folyamat neve */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Folyamat neve
                  </label>
                  <input
                    name="process_name"
                    list="processes-list"
                    required
                    placeholder="Pl.: Munkavállalói adatok kezelése..."
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    autoComplete="off"
                  />
                  <datalist id="processes-list">
                    {knownProcessNames.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </div>

                {/* Cél */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Adatkezelés célja
                  </label>
                  <Textarea
                    name="purpose"
                    required
                    placeholder="Pl.: Bérszámfejtés és munkaviszony dokumentálása..."
                    className="bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 min-h-[80px] resize-none text-[14px]"
                  />
                </div>

                {/* Megőrzési idő (szám + egység) + Tárolás helye */}
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={11} />
                      Megőrzési idő
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        required
                        value={retentionValue}
                        onChange={(e) => setRetentionValue(e.target.value)}
                        placeholder="Pl.: 5"
                        className="w-16 h-11 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[14px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-center"
                      />
                      <Select value={retentionUnit} onValueChange={(v: string | null) => setRetentionUnit(v ?? "év")}>
                        <SelectTrigger className="flex-1 h-11 bg-slate-50 border-slate-200 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Tárolás helye
                    </label>
                    <input
                      name="storage_location"
                      required
                      placeholder="Pl.: Neptun, Excel..."
                      className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[14px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1 h-11 border-slate-200"
                    disabled={isSubmitting}
                  >
                    Mégsem
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !deptValue.trim()}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSubmitting ? 'Mentés...' : 'Folyamat rögzítése'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}