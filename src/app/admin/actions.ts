'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Jogosultság ellenőrzés helper
async function requireAdminRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nincs bejelentkezve!')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['superadmin', 'admin'].includes(profile.role)) {
    throw new Error('Nincs jogosultságod ehhez a művelethez!')
  }

  return { supabase, user, role: profile.role }
}

// Role változtatás
export async function changeUserRole(formData: FormData) {
  const { supabase, role: myRole } = await requireAdminRole()

  const targetUserId = formData.get('userId') as string
  const newRole = formData.get('role') as string

  const validRoles = ['superadmin', 'admin', 'admin_reader', 'user', 'limited_user']
  if (!validRoles.includes(newRole)) throw new Error('Érvénytelen role!')

  // Csak superadmin állíthat be superadmin vagy admin role-t
  if (['superadmin', 'admin'].includes(newRole) && myRole !== 'superadmin') {
    throw new Error('Csak superadmin adhat admin jogosultságot!')
  }

  await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  revalidatePath('/admin')
}

// Felhasználó meghívása email alapján
export async function inviteUser(formData: FormData) {
  await requireAdminRole()

  const email = formData.get('email') as string
  const role = (formData.get('role') as string) || 'user'

  if (!email) throw new Error('Email cím megadása kötelező!')

  // Admin client kell az inviteUserByEmail-hez (service_role key)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
  })

  if (error) throw new Error(error.message)

  // Profil létrehozása a meghívott usernek a megfelelő role-lal
  if (data.user) {
    await adminClient
      .from('profiles')
      .upsert({ id: data.user.id, role }, { onConflict: 'id' })
  }

  revalidatePath('/admin')
}

// Felhasználó törlése (csak superadmin)
export async function deleteUser(formData: FormData) {
  const { role: myRole } = await requireAdminRole()

  if (myRole !== 'superadmin') {
    throw new Error('Csak superadmin törölhet felhasználót!')
  }

  const targetUserId = formData.get('userId') as string

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient.auth.admin.deleteUser(targetUserId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}