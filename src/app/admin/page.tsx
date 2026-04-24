import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { AdminPanel } from './admin-panel'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Role ellenőrzés
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!myProfile || !['superadmin', 'admin'].includes(myProfile.role)) {
    redirect('/')
  }

  // Összes user lekérése admin client-tel (auth.users nem érhető el normál client-tel)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({
    perPage: 200,
  })

  // Profilok lekérése
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, role, created_at')

  // Összefűzés
  const users = (authUsers ?? []).map(u => {
    const profile = profiles?.find(p => p.id === u.id)
    return {
      id: u.id,
      email: u.email ?? '',
      role: profile?.role ?? 'user',
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at ?? null,
      confirmed: !!u.email_confirmed_at,
    }
  }).sort((a, b) => {
    const order = ['superadmin', 'admin', 'admin_reader', 'user', 'limited_user']
    return order.indexOf(a.role) - order.indexOf(b.role)
  })

  return (
    <AdminPanel
      users={users}
      myId={user.id}
      myRole={myProfile.role}
    />
  )
}