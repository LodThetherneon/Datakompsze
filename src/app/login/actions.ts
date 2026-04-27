'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/utils/supabase/server'

const ADMIN_ROLES = ['superadmin', 'admin', 'admin_reader']

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error || !authData.user) {
    redirect('/login?error=Hibás+email+vagy+jelszó')
  }

  // SERVICE ROLE kliensre váltás – RLS nem blokkolja
  const serviceClient = createServiceClient()
  const { data: roleRow } = await serviceClient
    .from('profiles').select('role').eq('id', authData.user.id).single()

  if (ADMIN_ROLES.includes(roleRow?.role ?? '')) {
    await supabase.auth.signOut()
    redirect('/login?error=admin')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error || !data.user) {
    redirect('/login?error=Hiba+a+regisztráció+során')
  }

  await supabase.from('companies').insert({
    user_id: data.user.id,
    name: email.split('@')[0],
  })

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}