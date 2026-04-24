'use client'

import { useState, useTransition } from 'react'
import { changeUserRole, inviteUser, deleteUser } from './actions'
import { Shield, UserPlus, Trash2, ChevronDown, Check, Clock, Mail, ShieldAlert, ShieldCheck, Eye, User, AlertTriangle } from 'lucide-react'

type UserRow = {
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in: string | null
  confirmed: boolean
}

type Props = {
  users: UserRow[]
  myId: string
  myRole: string
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  superadmin: { label: 'Superadmin',    color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-200', icon: ShieldAlert },
  admin:       { label: 'Admin',         color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    icon: ShieldCheck },
  admin_reader:{ label: 'Admin (olvasó)',color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: Eye },
  user:        { label: 'Felhasználó',   color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: User },
  limited_user:{ label: 'Korl. felhasználó', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: User },
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG['user']
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function RoleDropdown({ userId, currentRole, myRole, myId, disabled }: {
  userId: string, currentRole: string, myRole: string, myId: string, disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const availableRoles = myRole === 'superadmin'
    ? ['superadmin', 'admin', 'admin_reader', 'user', 'limited_user']
    : ['admin_reader', 'user', 'limited_user']

  const handleChange = (role: string) => {
    setOpen(false)
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('role', role)
    startTransition(() => changeUserRole(fd))
  }

  if (disabled) return <RoleBadge role={currentRole} />

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-medium text-slate-700 transition-all shadow-sm"
      >
        {isPending ? (
          <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        ) : (
          <RoleBadge role={currentRole} />
        )}
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[180px]">
            {availableRoles.map(role => {
              const cfg = ROLE_CONFIG[role]
              const Icon = cfg.icon
              return (
                <button
                  key={role}
                  onClick={() => handleChange(role)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium hover:bg-slate-50 transition-colors ${currentRole === role ? 'bg-slate-50' : ''}`}
                >
                  <Icon size={13} className={cfg.color} />
                  <span className={cfg.color}>{cfg.label}</span>
                  {currentRole === role && <Check size={12} className="ml-auto text-emerald-500" />}
                </button>
              )
            })}
          </div>
        </>
      )}
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
        setTimeout(onClose, 1500)
      } catch (err: any) {
        setError(err.message ?? 'Hiba történt')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <UserPlus size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">Felhasználó meghívása</h3>
            <p className="text-[12px] text-slate-400">Email meghívó küldése</p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check size={22} className="text-emerald-500" />
            </div>
            <p className="text-[14px] font-bold text-slate-700">Meghívó elküldve!</p>
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
                placeholder="kollegam@sze.hu"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Szerepkör
              </label>
              <select
                name="role"
                defaultValue="user"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {ROLE_CONFIG[role].label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-[13px] p-3 rounded-xl border border-red-100">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-[3px] border-emerald-300 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail size={14} />
                    Meghívó küldése
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function AdminPanel({ users, myId, myRole }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deletePending, startDeleteTransition] = useTransition()

  const handleDelete = (userId: string, email: string) => {
    if (!confirm(`Biztosan törlöd ezt a fiókot?\n\n${email}\n\nEz a művelet nem visszavonható!`)) return
    const fd = new FormData()
    fd.set('userId', userId)
    startDeleteTransition(() => deleteUser(fd))
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
  }

  const stats = {
    total: users.length,
    superadmin: users.filter(u => u.role === 'superadmin').length,
    admin: users.filter(u => u.role === 'admin').length,
    admin_reader: users.filter(u => u.role === 'admin_reader').length,
    user: users.filter(u => u.role === 'user').length,
    limited_user: users.filter(u => u.role === 'limited_user').length,
  }

  return (
    <div className="max-w-6xl space-y-8 font-sans">

      {/* Fejléc */}
      <header className="pb-6 border-b border-slate-200/80 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Admin panel</h1>
          </div>
          <p className="text-[14px] text-slate-500 font-medium">
            Felhasználók kezelése, szerepkörök és meghívók.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
        >
          <UserPlus size={15} />
          Felhasználó meghívása
        </button>
      </header>

      {/* Statisztika kártyák */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Összesen', value: stats.total, color: 'text-slate-800', bg: 'bg-white' },
          { label: 'Superadmin', value: stats.superadmin, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Admin', value: stats.admin, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Admin (olvasó)', value: stats.admin_reader, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Felhasználók', value: stats.user + stats.limited_user, color: 'text-blue-700', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4 flex flex-col gap-1`}>
            <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Felhasználók tábla */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Fejléc sor */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-4">Felhasználó</div>
          <div className="col-span-2">Státusz</div>
          <div className="col-span-2">Regisztrált</div>
          <div className="col-span-2">Utolsó belépés</div>
          <div className="col-span-2 text-right">Szerepkör / Műveletek</div>
        </div>

        <div className="divide-y divide-slate-50">
          {users.map(u => {
            const isMe = u.id === myId
            const canChangeRole = !isMe && !(u.role === 'superadmin' && myRole !== 'superadmin')
            const canDelete = myRole === 'superadmin' && !isMe

            return (
              <div key={u.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors ${isMe ? 'bg-emerald-50/30' : ''}`}>

                {/* Email + saját jelölő */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
                    u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'admin' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {u.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-800 truncate">{u.email}</div>
                    {isMe && (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Te</span>
                    )}
                  </div>
                </div>

                {/* Státusz (megerősített?) */}
                <div className="col-span-2">
                  {u.confirmed ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                      <Check size={10} /> Aktív
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                      <Clock size={10} /> Meghívott
                    </span>
                  )}
                </div>

                {/* Regisztráció dátuma */}
                <div className="col-span-2 text-[12px] text-slate-500 font-medium">
                  {formatDate(u.created_at)}
                </div>

                {/* Utolsó belépés */}
                <div className="col-span-2 text-[12px] text-slate-400 font-medium">
                  {formatDate(u.last_sign_in)}
                </div>

                {/* Role dropdown + törlés */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <RoleDropdown
                    userId={u.id}
                    currentRole={u.role}
                    myRole={myRole}
                    myId={myId}
                    disabled={!canChangeRole}
                  />
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      disabled={deletePending}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Felhasználó törlése"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      </div>

      {/* Meghívó modal */}
      {inviteOpen && (
        <InviteModal onClose={() => setInviteOpen(false)} myRole={myRole} />
      )}

    </div>
  )
}