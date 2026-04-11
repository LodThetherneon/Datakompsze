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

  const { error } = await supabase
    .from('process_system_links')
    .insert([{ process_id, system_id: website_id }])
  if (error) throw error
  revalidatePath('/data-registry')
}

export async function unlinkWebsiteFromProcess(formData: FormData) {
  const supabase = await createClient()
  const process_id = formData.get('process_id') as string
  const website_id = formData.get('website_id') as string

  const { error } = await supabase
    .from('process_system_links')
    .delete()
    .eq('process_id', process_id)
    .eq('system_id', website_id)
  if (error) throw error
  revalidatePath('/data-registry')
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