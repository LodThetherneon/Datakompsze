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

// --- TÁJÉKOZTATÓ GENERÁLÁSA ---
export async function generatePolicy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Nem vagy bejelentkezve!")

  const websiteId = formData.get('websiteId') as string

  // 1. Cégadatok lekérése
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) throw new Error("Töltsd ki előbb a Beállítások oldalt!")

  // 2. Weboldal adatai
  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single()

  if (!website) throw new Error("A weboldal nem található!")

  // 3. Az ehhez a weboldalhoz tartozó adattípusok
  const { data: systems } = await supabase
    .from('systems')
    .select('*')
    .eq('website_id', websiteId)
    .eq('status', 'active')

  const siteName = website.status === 'offline'
    ? website.url
    : website.url.replace(/^https?:\/\//, '')

  // 4. Verziószám meghatározása
  const { data: lastPolicy } = await supabase
    .from('policies')
    .select('version')
    .eq('website_id', websiteId)
    .order('valid_from', { ascending: false })
    .limit(1)
    .single()

  let newVersion = '1.0'
  if (lastPolicy?.version) {
    const parts = lastPolicy.version.split('.')
    newVersion = `${parts[0]}.${parseInt(parts[1] || '0') + 1}`
  }

  // 5. HTML tájékoztató összerakása
  const today = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date())

  const systemsHtml = systems && systems.length > 0
    ? systems.map(s => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e293b">${s.system_name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${s.collected_data || '—'}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${s.purpose || '—'}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:12px;color:#94a3b8;text-align:center">Nem rögzítettek adatkezelési folyamatot.</td></tr>`

  const dpoSection = company.dpo_name
    ? `<p>Az adatkezelő adatvédelmi tisztviselőjének neve: <strong>${company.dpo_name}</strong><br>
       E-mail: <a href="mailto:${company.dpo_email}">${company.dpo_email}</a></p>`
    : `<p>Az adatkezelő nem nevezett ki adatvédelmi tisztviselőt (DPO), mivel erre jogszabályi kötelezettség nem áll fenn.</p>`

  const contentHtml = `
<!DOCTYPE html>
<html lang="hu">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Adatkezelési Tájékoztató – ${siteName}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.7; max-width: 860px; margin: 0 auto; padding: 40px 24px; }
  h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  h2 { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 36px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #f1f5f9; }
  p { margin: 8px 0; font-size: 14px; color: #334155; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
  th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
  .badge { display: inline-block; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid #d1fae5; }
</style>
</head>
<body>
<h1>Adatkezelési Tájékoztató</h1>
<div class="meta">
  <strong>${siteName}</strong> &nbsp;·&nbsp; 
  Verzió: <span class="badge">v${newVersion}</span> &nbsp;·&nbsp; 
  Hatályos: ${today}-tól
</div>

<h2>1. Az adatkezelő adatai</h2>
<p><strong>Cégnév:</strong> ${company.name || '—'}<br>
<strong>Székhely:</strong> ${company.headquarters || '—'}<br>
<strong>Adószám:</strong> ${company.tax_number || '—'}<br>
<strong>Cégjegyzékszám:</strong> ${company.registration_number || '—'}<br>
<strong>E-mail:</strong> <a href="mailto:${company.email}">${company.email || '—'}</a><br>
<strong>Telefon:</strong> ${company.phone || '—'}</p>

<h2>2. Adatvédelmi tisztviselő (DPO)</h2>
${dpoSection}

<h2>3. A kezelt adatok és az adatkezelés célja</h2>
<p>A(z) <strong>${siteName}</strong> rendszer az alábbi személyes adatokat kezeli:</p>
<table>
  <thead><tr>
    <th>Rendszer / Folyamat</th>
    <th>Kezelt adatok</th>
    <th>Az adatkezelés célja</th>
  </tr></thead>
  <tbody>${systemsHtml}</tbody>
</table>

<h2>4. Az adatkezelés jogalapja</h2>
<p>Az adatkezelés jogalapja az érintett önkéntes hozzájárulása (GDPR 6. cikk (1) bekezdés a) pont), illetve egyes esetekben az adatkezelő jogos érdeke (GDPR 6. cikk (1) bekezdés f) pont).</p>

<h2>5. Adatmegőrzési idő</h2>
<p>Az adatokat az adatkezelési cél megvalósulásáig, vagy az érintett törlési kérelméig őrizzük meg, de legfeljebb 5 évig.</p>

<h2>6. Tárhelyszolgáltató (adatfeldolgozó)</h2>
<p><strong>Cégnév:</strong> ${company.hosting_provider_name || '—'}<br>
<strong>Cím:</strong> ${company.hosting_provider_address || '—'}<br>
<strong>E-mail:</strong> ${company.hosting_provider_email || '—'}</p>

<h2>7. Az érintett jogai</h2>
<p>Ön jogosult: hozzáférni a kezelt adataihoz · azok helyesbítését kérni · adatai törlését kérni · az adatkezelés korlátozását kérni · adatait hordozható formában megkapni · tiltakozni az adatkezelés ellen.</p>
<p>Jogorvoslati lehetőséggel élhet a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH): <a href="https://www.naih.hu" target="_blank">www.naih.hu</a></p>

<h2>8. Kapcsolat</h2>
<p>Adatkezeléssel kapcsolatos kérdéseit az alábbi elérhetőségen teheti fel:<br>
<strong>${company.email || '—'}</strong></p>

<p style="margin-top:48px;font-size:12px;color:#94a3b8">
  Generálva: ${today} · DataKomp automatikus tájékoztató generátor · v${newVersion}
</p>
</body></html>`

  // 6. Korábbi verziót lezárjuk
  await supabase
    .from('policies')
    .update({ status: 'archived', valid_to: new Date().toISOString() })
    .eq('website_id', websiteId)
    .eq('status', 'current')

  // 7. Új verzió mentése
  const { error } = await supabase.from('policies').insert([{
    website_id: websiteId,
    version: newVersion,
    content_html: contentHtml,
    status: 'current',
    valid_from: new Date().toISOString()
  }])

  if (error) throw error

  // 8. Weboldal verziószámának frissítése
  await supabase
    .from('websites')
    .update({ policy_version: newVersion, updated_at: new Date().toISOString() })
    .eq('id', websiteId)

  revalidatePath('/policies')
  revalidatePath('/')
}

// --- TÁJÉKOZTATÓ TÖRLÉSE ---
export async function deletePolicy(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  await supabase.from('policies').delete().eq('id', id)
  revalidatePath('/policies')
}