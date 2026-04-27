'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/utils/supabase/server'

const ADMIN_ROLES = ['superadmin', 'admin', 'admin_reader']

export async function adminLogin(formData: FormData) {
  const supabase = await createClient()
  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !authData.user) {
    throw new Error('invalid')  // ← VÁLTOZOTT
  }

  const userId = authData.user.id
  const serviceClient = createServiceClient()
  const { data: roleRow } = await serviceClient
    .from('profiles').select('role').eq('id', userId).single()

  if (!ADMIN_ROLES.includes(roleRow?.role ?? '')) {
    await supabase.auth.signOut()
    throw new Error('forbidden')  // ← VÁLTOZOTT
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}