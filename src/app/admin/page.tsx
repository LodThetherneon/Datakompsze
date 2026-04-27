import { createClient, createServiceClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminPanel } from './admin-panel'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const serviceClient = createServiceClient()

  const { data: roleRow } = await serviceClient
    .from('profiles').select('role').eq('id', user!.id).single()

  const role = roleRow?.role ?? ''
  if (!['superadmin', 'admin', 'admin_reader'].includes(role)) {
    redirect('/admin/login?error=forbidden')
  }

  // Auth admin API-val lekérjük az összes usert (email + meta)
  const { data: authUsers } = await serviceClient.auth.admin.listUsers()

  // Profiles lekérése role-okkal
  const { data: profiles } = await serviceClient
    .from('profiles').select('id, role, created_at')

  // Összeillesztés
  const users = (profiles ?? []).map((p: any) => {
    const authUser = (authUsers?.users ?? []).find((u: any) => u.id === p.id)
    return {
      id: p.id,
      email: authUser?.email ?? p.id,
      role: p.role,
      created_at: p.created_at,
      last_sign_in: authUser?.last_sign_in_at ?? null,
      confirmed: !!authUser?.email_confirmed_at,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <AdminPanel users={users} myId={user!.id} myRole={role} />
    </div>
  )
}