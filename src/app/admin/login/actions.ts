'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const ADMIN_ROLES = ['superadmin', 'admin', 'admin_reader']

export async function adminLogin(formData: FormData) {
  const supabase = await createClient()

  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !authData.user) {
    redirect('/admin/login?error=invalid')
  }

  const userId = authData.user!.id

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('id', userId).single()

  if (!ADMIN_ROLES.includes(roleRow?.role ?? '')) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=forbidden')
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}