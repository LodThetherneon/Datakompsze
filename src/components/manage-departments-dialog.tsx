'use client'

import { useState } from 'react'
import { Building2, Plus, Trash2, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Department {
  id: string
  name: string
}

interface Props {
  departments: Department[]
  addAction: (formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
}

export function ManageDepartmentsDialog({ departments, addAction, deleteAction }: Props) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const { success, error } = useToast()

  const handleAdd = async () => {
    if (!newName.trim() || isAdding) return
    setIsAdding(true)
    const formData = new FormData()
    formData.append('name', newName.trim())
    try {
      await addAction(formData)
      setNewName('')
      success('Szervezeti egység hozzáadva!')
      router.refresh()
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id)
    const formData = new FormData()
    formData.append('id', id)
    try {
      await deleteAction(formData)
      success(`„${name}" törölve.`)
      router.refresh()
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={(props) => (
          <div
            {...props}
            role="button"
            tabIndex={0}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-11 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-sm"
          >
            <Building2 size={16} />
            Szervezeti egységek
          </div>
        )}
      />

      <DialogContent className="sm:max-w-[420px] rounded-2xl border-slate-100 shadow-xl bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <Building2 className="text-slate-600" size={22} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Szervezeti egységek</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Kezelje a szervezeti egységeket, amelyekhez folyamatokat rendelhet.
          </DialogDescription>
        </DialogHeader>

        {/* Új hozzáadása */}
        <div className="flex gap-2 pt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Pl.: HR Osztály, Pénzügy..."
            className="flex-1 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={isAdding || !newName.trim()}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Lista */}
        <div className="space-y-1.5 mt-3 max-h-64 overflow-y-auto pr-1">
          {departments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Még nincs felvett szervezeti egység.
            </p>
          ) : (
            departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 group"
              >
                <span className="text-[13px] font-semibold text-slate-700 truncate">{dept.name}</span>
                <button
                  onClick={() => handleDelete(dept.id, dept.name)}
                  disabled={deletingId === dept.id}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Törlés"
                >
                  {deletingId === dept.id ? <X size={14} /> : <Trash2 size={14} />}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full border-slate-200">
            Bezárás
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}