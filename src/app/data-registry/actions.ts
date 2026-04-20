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
    collected_data: formData.get('collected_data') as string,
    retention_period: formData.get('retention_period') as string,
    storage_location: formData.get('storage_location') as string,
  }])

  if (error) throw error
  revalidatePath('/data-registry')
}

export async function deleteDataProcess(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  // 1. Folyamat neve + csatolt website_id-k
  const { data: process } = await supabase
    .from('data_processes')
    .select('process_name')
    .eq('id', id)
    .single()

  const { data: links } = await supabase
    .from('process_system_links')
    .select('system_id')
    .eq('process_id', id)

  if (process && links && links.length > 0) {
    for (const link of links) {
      // 2. Van-e MÁS folyamat ugyanehhez a website_id-hoz ugyanilyen névvel?
      const { data: otherLinks } = await supabase
        .from('process_system_links')
        .select('process_id')
        .eq('system_id', link.system_id)
        .neq('process_id', id)

      const otherProcessIds = (otherLinks ?? []).map((l) => l.process_id)

      let stillUsed = false
      if (otherProcessIds.length > 0) {
        const { data: otherProcesses } = await supabase
          .from('data_processes')
          .select('process_name')
          .in('id', otherProcessIds)
          .eq('process_name', process.process_name)

        if (otherProcesses && otherProcesses.length > 0) stillUsed = true
      }

      // 3. Csak akkor töröljük a systems sort, ha más nem hivatkozik rá
      if (!stillUsed) {
        await supabase
        .from('systems')
        .delete()
        .eq('id', link.system_id)          // ← .eq('id', ...) nem website_id!
        .eq('source_type', 'process')  
      }
    }
  }

  // 4. Links törlése
  await supabase
    .from('process_system_links')
    .delete()
    .eq('process_id', id)

  // 5. Folyamat törlése
  const { error } = await supabase.from('data_processes').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/data-registry')
  revalidatePath('/systems')
}

export async function linkWebsiteToProcess(formData: FormData) {
  const supabase = await createClient()
  const process_id = formData.get('process_id') as string
  const website_id = formData.get('website_id') as string

  const { data: process } = await supabase
    .from('data_processes')
    .select('process_name, purpose, retention_period, storage_location, department_name, collected_data')
    .eq('id', process_id).single()
  if (!process) throw new Error('A folyamat nem található!')

  const { data: website } = await supabase
    .from('websites').select('url, status').eq('id', website_id).single()
  if (!website) throw new Error('A rendszer nem található!')

  const systemName = website.status === 'offline'
    ? website.url
    : website.url.replace(/^https?:\/\//, '')

  // Meglévő systems sor keresése
  let { data: existing } = await supabase
    .from('systems').select('id')
    .eq('website_id', website_id)
    .eq('collected_data', process.process_name)
    .maybeSingle()

  // Ha nincs, létrehozzuk és visszakérjük az id-t
  if (!existing) {
    const { data: newSys, error: sysError } = await supabase
      .from('systems').insert([{
        website_id,
        system_name: systemName,
        purpose: process.purpose || null,
        collected_data: process.collected_data || null,
        status: 'active',
        source_type: 'process',
        retention_display: process.retention_period || null,
        retention_period: process.retention_period || null,
        storage_location: process.storage_location || null,
        department_name: process.department_name || null,
      }]).select('id').single()
    if (sysError) throw sysError
    existing = newSys
  }

  // Link mentése — systems.id-vel (nem website_id!)
  const { data: existingLink } = await supabase
    .from('process_system_links').select('process_id')
    .eq('process_id', process_id)
    .eq('system_id', existing!.id)
    .maybeSingle()

  if (!existingLink) {
    const { error: linkError } = await supabase
      .from('process_system_links')
      .insert([{ process_id, system_id: existing!.id }])
    if (linkError) throw linkError
  }

  revalidatePath('/data-registry')
  revalidatePath('/systems')
}

export async function unlinkWebsiteFromProcess(formData: FormData) {
  const supabase = await createClient()
  const process_id = formData.get('process_id') as string
  const website_id = formData.get('website_id') as string

  // 1. Folyamat nevének lekérése
  const { data: process } = await supabase
    .from('data_processes')
    .select('process_name')
    .eq('id', process_id)
    .single()

  // 2. systems.id megkeresése a website_id alapján
  const { data: sysRow } = await supabase
    .from('systems')
    .select('id')
    .eq('website_id', website_id)
    .eq('collected_data', process?.process_name ?? '')
    .maybeSingle()

  if (!sysRow) {
    // Ha nincs systems sor, csak a linket próbáljuk törölni ha létezik
  } else {
    // 3. Van-e MÁS folyamat ugyanehhez a systems sorhoz?
    const { data: otherLinks } = await supabase
      .from('process_system_links')
      .select('process_id')
      .eq('system_id', sysRow.id)
      .neq('process_id', process_id)

    const otherProcessIds = (otherLinks ?? []).map((l) => l.process_id)
    let stillUsed = false

    if (otherProcessIds.length > 0 && process) {
      const { data: otherProcesses } = await supabase
        .from('data_processes')
        .select('process_name')
        .in('id', otherProcessIds)
        .eq('process_name', process.process_name)

      if (otherProcesses && otherProcesses.length > 0) stillUsed = true
    }

    // 4. Systems sor törlése ha senki más nem használja
    if (!stillUsed) {
      await supabase
        .from('systems')
        .delete()
        .eq('id', sysRow.id)
        .eq('source_type', 'process')  // ← 'process', nem 'manual'!
    }

    // 5. Link törlése a helyes system_id-vel (sysRow.id, nem website_id!)
    const { error } = await supabase
      .from('process_system_links')
      .delete()
      .eq('process_id', process_id)
      .eq('system_id', sysRow.id)  // ← sysRow.id, nem website_id!
    if (error) throw error
  }

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

export async function updateDataProcess(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase.from('data_processes').update({
    department_name: formData.get('department_name') as string,
    process_name: formData.get('process_name') as string,
    purpose: formData.get('purpose') as string,
    collected_data: formData.get('collected_data') as string,
    retention_period: formData.get('retention_period') as string,
    storage_location: formData.get('storage_location') as string,
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/data-registry')
}