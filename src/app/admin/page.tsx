import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminPanel } from './admin-panel'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('id', user.id).single()

  const role = roleRow?.role ?? ''
  if (!['superadmin', 'admin', 'admin_reader'].includes(role)) {
    redirect('/admin/login?error=forbidden')
  }

  const { data: usersRaw } = await supabase
    .from('user_roles')
    .select('id, role')

  const users = (usersRaw ?? []).map((u: any) => ({
    id: u.id,
    email: u.id,
    role: u.role,
    created_at: '',
    last_sign_in: null,
    confirmed: true,
  }))

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <AdminPanel users={users} myId={user.id} myRole={role} />
    </div>
  )
}