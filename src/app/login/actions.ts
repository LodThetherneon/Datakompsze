'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=Hibás+email+vagy+jelszó')
  }

  revalidatePath('/', 'layout')
  redirect('/') // Sikeres belépés után irányítópult
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const plan = (formData.get('plan') as string) || 'free'

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error || !data.user) {
    redirect('/login?error=Hiba+a+regisztráció+során')
  }

  // Company létrehozása a választott csomaggal
  await supabase.from('companies').insert({
    user_id: data.user.id,
    name: email.split('@')[0],
    plan: plan,
  })
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}