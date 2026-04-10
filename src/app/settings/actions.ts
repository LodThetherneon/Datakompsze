'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveCompanySettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Nem vagy bejelentkezve!")

  // Adatok kinyerése az űrlapból
    // Adatok kinyerése az űrlapból
  const companyData = {
    user_id: user.id,
    name: formData.get('companyName') as string,
    tax_number: formData.get('taxNumber') as string,
    registration_number: formData.get('regNumber') as string,
    headquarters: formData.get('headquarters') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    dpo_name: formData.get('dpoName') as string,
    dpo_email: formData.get('dpoEmail') as string,
    hosting_provider_name: formData.get('hostingName') as string,
    hosting_provider_address: formData.get('hostingAddress') as string,
    hosting_provider_email: formData.get('hostingEmail') as string,
  }

  // Megnézzük, van-e már cége ennek a usernek
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existingCompany) {
    // Ha van, akkor frissítjük (Update)
    await supabase
      .from('companies')
      .update(companyData)
      .eq('id', existingCompany.id)
  } else {
    // Ha nincs, akkor létrehozzuk (Insert)
    await supabase
      .from('companies')
      .insert([companyData])
  }

  // Frissítjük az oldalt, hogy látszódjanak az új adatok
  revalidatePath('/settings')
}

export async function changePlan(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nem vagy bejelentkezve!')

  const plan = formData.get('plan') as string
  if (!['free', 'pro', 'max'].includes(plan)) throw new Error('Érvénytelen csomag!')

  await supabase
    .from('companies')
    .update({ plan })
    .eq('user_id', user.id)

  revalidatePath('/settings')
  revalidatePath('/')
}