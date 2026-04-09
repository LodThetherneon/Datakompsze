'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addConnection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Nem vagy bejelentkezve!")

  // 1. Cég megkeresése
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) throw new Error("Nincs cégadat beállítva!")

  // 2. Kinyerjük a rejtett mezőket
  const type = formData.get('type') as 'website' | 'system'
  const mode = formData.get('mode') as 'link' | 'manual'

  // --- HA WEBOLDALT VAGY RENDSZERT LINKKEL ADNAK HOZZÁ ---
  if (mode === 'link') {
    const rawUrl = formData.get('url') as string
    const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

    // A weboldalakat és a linkelt rendszereket is a FORRÁSOK (websites) közé mentjük!
    const { error } = await supabase.from('websites').insert([
      { 
        company_id: company.id, 
        url: type === 'system' ? `Külső Rendszer: ${cleanUrl}` : cleanUrl,
        status: 'scanning' 
      }
    ])
    if (error) throw error
  } 
  
    // --- HA MANUÁLISAN ADNAK HOZZÁ EGY RENDSZERT ---
  else if (mode === 'manual') {
    const name = formData.get('name') as string
    
    // Szépen, prefix nélkül mentjük el a nevét az URL mezőbe, 
    // DE a status mezőbe beírjuk, hogy 'offline', hogy később meg tudjuk különböztetni!
    const { error } = await supabase.from('websites').insert([
      { 
        company_id: company.id, 
        url: name, // Pl. "Belső HR Rendszer"
        status: 'offline' // <--- EZ A KULCS! Így tudjuk, hogy ez nem egy weblap.
      }
    ])
    if (error) throw error
  }

  revalidatePath('/')
  revalidatePath('/systems')
}

// --- MANUÁLIS ADATTÍPUS FELVÉTELE EGY MEGLÉVŐ FORRÁSHOZ ---
export async function addManualSystem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Nem vagy bejelentkezve!")

  const sourceId = formData.get('systemId') as string // Ez valójában a website_id (Forrás)
  const dataTypeCategory = formData.get('dataTypeCategory') as string
  const collectedData = formData.get('collectedData') as string

  // 1. Lekérjük a "Szülő" FORRÁST a websites táblából!
  const { data: parentSource } = await supabase
    .from('websites')
    .select('url, status')
    .eq('id', sourceId)
    .single()

  if (!parentSource) throw new Error("A kiválasztott forrás nem található!")

  // Ha weboldal, levágjuk a https-t a névhez. Ha offline rendszer, simán a nevet használjuk.
  const systemName = parentSource.status === 'offline' 
    ? parentSource.url 
    : parentSource.url.replace(/^https?:\/\//, '')

  // 2. Létrehozzuk az új ADATTÍPUST a systems táblában.
  const { error } = await supabase.from('systems').insert([
    { 
      website_id: sourceId,                  
      system_name: systemName,               
      purpose: dataTypeCategory,             
      collected_data: collectedData,         
      status: 'active',                     
      source_type: 'manual'     
    } 
  ])

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/systems')
}

// --- ÚJ AKCIÓK A RENDSZEREK KEZELÉSÉHEZ ---

export async function deleteSystem(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase.from('systems').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/systems')
}

export async function acceptSystem(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase.from('systems').update({ status: 'active' }).eq('id', id)
  if (error) throw error

  revalidatePath('/systems')
}

// --- WEBOLDAL / FORRÁS TÖRLÉSE ---
export async function deleteWebsite(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  // Töröljük a weboldalt. 
  // (A Supabase-ben érdemes beállítani az idegen kulcsokon a "Cascade Delete"-et, 
  // így ha törlöd a weboldalt, az ahhoz tartozó összes rendszer is törlődik automatikusan!)
  const { error } = await supabase.from('websites').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/')
}
