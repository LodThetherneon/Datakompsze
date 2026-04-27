'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { changeUserRole, inviteUser, deleteUser, assignCompany } from './actions'
import {
  UserPlus, Trash2, ChevronDown, Check, Clock,
  Mail, ShieldAlert, ShieldCheck, Eye, User,
  AlertTriangle, Users, Building2
} from 'lucide-react'

type UserRow = {
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in: string | null
  confirmed: boolean
  company_id: string | null
}

type Props = {
  users: UserRow[]
  myId: string
  myRole: string
  companies: { id: string; name: string }[]
}

const ROLE_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; icon: React.ElementType
}> = {
  superadmin:   { label: 'Superadmin',        color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-200', icon: ShieldAlert },
  admin:        { label: 'Admin',             color: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200',   icon: ShieldCheck },
  admin_reader: { label: 'Admin (olvasó)',     color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: Eye },
  user:         { label: 'Felhasználó',        color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: User },
  limited_user: { label: 'Korl. felhasználó', color: 'text-slate-500',  bg: 'bg-slate-100',  border: 'border-slate-200',  icon: User },
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG['user']
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg text-[11px] font-semibold border whitespace-nowrap ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function RoleDropdown({ userId, currentRole, myRole, disabled }: {
  userId: string; currentRole: string; myRole: string; disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [isPending, startTransition] = useTransition()
  const btnRef = useRef<HTMLButtonElement>(null)

  const availableRoles = myRole === 'superadmin'
    ? ['superadmin', 'admin', 'admin_reader', 'user', 'limited_user']
    : ['admin_reader', 'user', 'limited_user']

  const handleOpen = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const menuH = availableRoles.length * 42
    const openUp = spaceBelow < menuH + 8
    setPos({
      top: openUp ? rect.top - menuH - 4 : rect.bottom + 4,
      left: rect.right - 192,
    })
    setOpen(true)
  }

  const handleChange = (role: string) => {
    setOpen(false)
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('role', role)
    startTransition(() => changeUserRole(fd))
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [open])

  if (disabled) return <RoleBadge role={currentRole} />

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-medium text-slate-700 transition-all shadow-sm disabled:opacity-60"
      >
        {isPending
          ? <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          : <RoleBadge role={currentRole} />
        }
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden w-48 py-1"
            style={{ top: pos.top, left: pos.left }}
          >
            {availableRoles.map(role => {
              const cfg = ROLE_CONFIG[role]
              const Icon = cfg.icon
              return (
                <button
                  key={role}
                  onClick={() => handleChange(role)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-slate-50 ${currentRole === role ? 'bg-slate-50' : ''}`}
                >
                  <Icon size={13} className={cfg.color} />
                  <span className={`${cfg.color} flex-1 text-left`}>{cfg.label}</span>
                  {currentRole === role && <Check size={12} className="text-emerald-500 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

function CompanyDropdown({ userId, currentCompanyId, companies }: {
  userId: string
  currentCompanyId: string | null
  companies: { id: string; name: string }[]
}) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('companyId', e.target.value)
    startTransition(() => assignCompany(fd))
  }

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin block" />
        </div>
      )}
      <select
        defaultValue={currentCompanyId ?? ''}
        onChange={handleChange}
        disabled={isPending}
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all disabled:opacity-60 max-w-[180px] cursor-pointer"
      >
        <option value="">— Nincs cég —</option>
        {companies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}

function InviteModal({ onClose, myRole }: { onClose: () => void; myRole: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const availableRoles = myRole === 'superadmin'
    ? ['superadmin', 'admin', 'admin_reader', 'user', 'limited_user']
    : ['admin_reader', 'user', 'limited_user']

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await inviteUser(fd)
        setSuccess(true)
        setTimeout(onClose, 1800)
      } catch (err: any) {
        setError(err.message ?? 'Ismeretlen hiba történt')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] p-7 z-10 border border-slate-100">
        <div className="mb-6">
          <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">Felhasználó meghívása</h3>
          <p className="text-[13px] text-slate-400 mt-0.5">Meghívó emailt küld a megadott címre</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Check size={24} className="text-emerald-500" />
            </div>
            <p className="text-[15px] font-bold text-slate-700">Meghívó elküldve!</p>
            <p className="text-[13px] text-slate-400">A felhasználó emailben kapja meg a linket.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Email cím
              </label>
              <input
                name="email"
                type="email"
                required
                autoFocus
                placeholder="kollegam@sze.hu"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Szerepkör
              </label>
              <select
                name="role"
                defaultValue="user"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>{ROLE_CONFIG[role].label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-600 text-[13px] p-3.5 rounded-xl border border-red-100">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-[13px] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-emerald-500/20"
              >
                {isPending
                  ? <span className="w-4 h-4 border-[2.5px] border-emerald-300 border-t-white rounded-full animate-spin" />
                  : <><Mail size={14} />Meghívó küldése</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function DeleteConfirmModal({ email, onConfirm, onClose }: {
  email: string; onConfirm: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[380px] p-7 z-10 border border-slate-100">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-800">Fiók törlése</h3>
            <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
              Biztosan törlöd ezt a fiókot?<br />
              <span className="font-semibold text-slate-700">{email}</span>
            </p>
            <p className="text-[12px] text-red-500 mt-2 font-medium">Ez a művelet nem visszavonható.</p>
          </div>
          <div className="flex gap-3 w-full mt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Mégse
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-[13px] font-semibold transition-all shadow-sm shadow-red-500/20"
            >
              Törlés
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminPanel({ users, myId, myRole, companies }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [, startDeleteTransition] = useTransition()

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    const fd = new FormData()
    fd.set('userId', deleteTarget.id)
    startDeleteTransition(() => deleteUser(fd))
    setDeleteTarget(null)
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(d))
  }

  const stats = [
    { label: 'Összesen',           value: users.length,                                           color: 'text-slate-800', bg: 'bg-white' },
    { label: 'Admin',              value: users.filter(u => u.role === 'admin').length,           color: 'text-rose-700',  bg: 'bg-rose-50' },
    { label: 'Admin (olvasó)',     value: users.filter(u => u.role === 'admin_reader').length,    color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Felhasználó',        value: users.filter(u => u.role === 'user').length,            color: 'text-blue-700',  bg: 'bg-blue-50' },
    { label: 'Korl. felhasználó',  value: users.filter(u => u.role === 'limited_user').length,   color: 'text-slate-500', bg: 'bg-slate-100' },
  ]

  return (
    <div className="w-full space-y-8">

      {/* ── Fejléc ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Felhasználók kezelése</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            Szerepkörök, meghívók és fiókok kezelése.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] rounded-lg px-6 h-11 cursor-pointer"
        >
          <UserPlus size={18} />
          Felhasználó meghívása
        </button>
      </header>

      {/* ── Stat kártyák ── */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 px-4 py-3.5`}>
            <div className={`text-2xl font-black ${s.color} leading-none`}>{s.value}</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tábla ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">

        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
          <Users size={15} className="text-slate-400" />
          <span className="text-[13px] font-semibold text-slate-600">{users.length} felhasználó</span>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[28%]">Felhasználó</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[10%]">Státusz</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[14%]">Regisztrált</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[14%]">Utolsó belépés</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[18%]">
                <span className="flex items-center gap-1.5"><Building2 size={11} /> Cég</span>
              </th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[16%] text-right">Szerepkör</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => {
              const isMe = u.id === myId
              const canChangeRole = !isMe && !(u.role === 'superadmin' && myRole !== 'superadmin')
              const canDelete = myRole === 'superadmin' && !isMe

              return (
                <tr
                  key={u.id}
                  className={`group transition-colors ${isMe ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}`}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                        u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'admin'      ? 'bg-rose-100 text-rose-700'     :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {u.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-slate-800 truncate">{u.email}</div>
                        {isMe && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Te</span>}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {u.confirmed ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                        <Check size={10} /> Aktív
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                        <Clock size={10} /> Meghívott
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-[12px] text-slate-500 font-medium tabular-nums">
                    {formatDate(u.created_at)}
                  </td>

                  <td className="px-4 py-3.5 text-[12px] text-slate-400 font-medium tabular-nums">
                    {formatDate(u.last_sign_in)}
                  </td>

                  <td className="px-4 py-3.5">
                    <CompanyDropdown
                      userId={u.id}
                      currentCompanyId={u.company_id}
                      companies={companies}
                    />
                  </td>

                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <RoleDropdown
                        userId={u.id}
                        currentRole={u.role}
                        myRole={myRole}
                        disabled={!canChangeRole}
                      />
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Fiók törlése"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} myRole={myRole} />}
      {deleteTarget && (
        <DeleteConfirmModal
          email={deleteTarget.email}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}