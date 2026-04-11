'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  id: string
  processName: string
  deleteAction: (formData: FormData) => Promise<void>
}

export function DeleteProcessButton({ id, processName, deleteAction }: Props) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { success, error } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    const formData = new FormData()
    formData.append('id', id)
    try {
      await deleteAction(formData)
      success(`„${processName}" sikeresen törölve.`)
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt a törlés során.')
    } finally {
      setIsDeleting(false)
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
            title="Folyamat törlése"
            className="p-2 text-rose-500 hover:bg-rose-100 bg-rose-50 rounded-md transition-colors cursor-pointer flex items-center"
          >
            <Trash2 size={16} />
          </div>
        )}
      />

      <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-100 shadow-xl bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
            <AlertTriangle className="text-rose-500" size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Folyamat törlése</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Biztosan törli a <strong className="text-slate-800">{processName}</strong> folyamatot? Ez a művelet végleges.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-slate-200 text-slate-600"
          >
            Mégsem
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-md"
          >
            {isDeleting ? 'Törlés...' : 'Végleges törlés'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}