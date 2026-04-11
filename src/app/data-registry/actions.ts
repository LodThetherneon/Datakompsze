'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addDataProcess(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nem vagy bejelentkezve!')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) throw new Error('Nincs cégadat beállítva!')

  const { error } = await supabase.from('data_processes').insert([{
    company_id: company.id,
    department_name: formData.get('department_name') as string,
    process_name: formData.get('process_name') as string,
    purpose: formData.get('purpose') as string,
    retention_period: formData.get('retention_period') as string,
    storage_location: formData.get('storage_location') as string,
  }])

  if (error) throw error
  revalidatePath('/data-registry')
}

export async function deleteDataProcess(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const { error } = await supabase.from('data_processes').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/data-registry')
}

export async function linkWebsiteToProcess(formData: FormData) {
  const supabase = await createClient()
  const process_id = formData.get('process_id') as string
  const website_id = formData.get('website_id') as string

  // 1. Folyamat nevének lekérése
  const { data: process } = await supabase
    .from('data_processes')
    .select('process_name, purpose')
    .eq('id', process_id)
    .single()

  if (!process) throw new Error('A folyamat nem található!')

  // 2. Website adatainak lekérése
  const { data: website } = await supabase
    .from('websites')
    .select('url, status')
    .eq('id', website_id)
    .single()

  if (!website) throw new Error('A rendszer nem található!')

  const systemName = website.status === 'offline'
    ? website.url
    : website.url.replace(/^https?:\/\//, '')

  // 3. Ellenőrzés: létezik-e már ilyen systems sor (nehogy duplikálódjon)
  const { data: existing } = await supabase
    .from('systems')
    .select('id')
    .eq('website_id', website_id)
    .eq('collected_data', process.process_name)
    .maybeSingle()

  // 4. Ha még nincs ilyen sor, létrehozzuk
  if (!existing) {
    const { error: sysError } = await supabase.from('systems').insert([{
      website_id,
      system_name: systemName,
      purpose: process.purpose || process.process_name,
      collected_data: process.process_name,
      status: 'active',
      source_type: 'manual',
    }])
    if (sysError) throw sysError
  }

  // 5. Link mentése (process_system_links) — duplikáció védelem
  const { data: existingLink } = await supabase
    .from('process_system_links')
    .select('process_id')
    .eq('process_id', process_id)
    .eq('system_id', website_id)
    .maybeSingle()

  if (!existingLink) {
    const { error: linkError } = await supabase
      .from('process_system_links')
      .insert([{ process_id, system_id: website_id }])
    if (linkError) throw linkError
  }

  revalidatePath('/data-registry')
  revalidatePath('/systems')
}

export async function unlinkWebsiteFromProcess(formData: FormData) {
  const supabase = await createClient()
  const process_id = formData.get('process_id') as string
  const website_id = formData.get('website_id') as string

  // 1. Folyamat nevének lekérése (a systems sorhoz kell)
  const { data: process } = await supabase
    .from('data_processes')
    .select('process_name')
    .eq('id', process_id)
    .single()

  // 2. A kapcsolódó systems sort is töröljük (ahol collected_data = folyamat neve)
  if (process) {
    await supabase
      .from('systems')
      .delete()
      .eq('website_id', website_id)
      .eq('collected_data', process.process_name)
      .eq('source_type', 'manual')
  }

  // 3. Link törlése
  const { error } = await supabase
    .from('process_system_links')
    .delete()
    .eq('process_id', process_id)
    .eq('system_id', website_id)
  if (error) throw error

  revalidatePath('/data-registry')
  revalidatePath('/systems')
}

export async function addDepartment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nem vagy bejelentkezve!')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) throw new Error('Nincs cégadat!')

  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('A név nem lehet üres!')

  const { error } = await supabase.from('departments').insert([{
    company_id: company.id,
    name,
  }])
  if (error) throw error
  revalidatePath('/data-registry')
}

export async function deleteDepartment(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/data-registry')
}