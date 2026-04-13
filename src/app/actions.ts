'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { runScanner } from '@/lib/scanner'


export async function addConnection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Nem vagy bejelentkezve!")

  const { data: companyFull } = await supabase
    .from('companies').select('id, plan').eq('user_id', user.id).single()

  const { count: currentCount } = await supabase
    .from('websites')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyFull!.id)

  const quotaMap: Record<string, number | null> = { free: 3, pro: 30, max: null }
  const quota = quotaMap[companyFull?.plan ?? 'free']

  if (quota !== null && (currentCount ?? 0) >= quota) {
    throw new Error(`Elérted a ${companyFull?.plan} csomag kvótáját (${quota} db). Válts magasabb csomagra!`)
  }

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()

  if (!company) throw new Error("Nincs cégadat beállítva!")

  const mode = formData.get('mode') as 'link' | 'manual'

  if (mode === 'link') {
    const rawUrl = formData.get('url') as string
    const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

    const { data: newSite, error } = await supabase
      .from('websites')
      .insert([{ company_id: company.id, url: cleanUrl, status: 'scanning' }])
      .select().single()

    if (error || !newSite) throw error
    runScanner(newSite.id, cleanUrl).catch(err => console.error('Scanner hiba:', err))

  } else if (mode === 'manual') {
    const name = formData.get('name') as string
    const { error } = await supabase.from('websites').insert([{
      company_id: company.id, url: name, status: 'offline'
    }])
    if (error) throw error
  }

  revalidatePath('/')
  revalidatePath('/systems')
}

export async function addManualSystem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Nem vagy bejelentkezve!")

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) throw new Error("Nincs cégadat beállítva!")

  const websiteId = (formData.get('websiteId') as string)?.trim() 
   if (!websiteId) throw new Error("A forrás weboldal megadása kötelező!")

  const dataTypeCat       = (formData.get('dataTypeCategory') as string)?.trim()
  const collectedData     = (formData.get('collectedData')    as string)?.trim()
  const retentionUntilRaw = (formData.get('retentionUntil')   as string)?.trim()
  const retentionDisplay  = (formData.get('retentionDisplay') as string)?.trim()

  if (!dataTypeCat)       throw new Error("A kategória megadása kötelező!")
  if (!collectedData)     throw new Error("A kezelt adat megadása kötelező!")
  if (!retentionUntilRaw) throw new Error("Az adatkezelés végének megadása kötelező!")

  // Dátum validáció (timezone-safe)
  const parts = retentionUntilRaw.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) throw new Error("Érvénytelen dátum formátum!")
  const retentionDate = new Date(parts[0], parts[1] - 1, parts[2])
  if (isNaN(retentionDate.getTime())) throw new Error("Érvénytelen dátum!")

  const { error } = await supabase.from('systems').insert([{
    company_id:      company.id,
    website_id:      websiteId,
    system_name:     dataTypeCat,
    purpose:         dataTypeCat,
    collected_data:  collectedData,
    status:          'active',
    source_type:     'process',
    retention_until: retentionUntilRaw,
    retention_display: retentionDisplay ?? null,
  }])

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/systems')
}

export async function deleteSystem(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { data: sys } = await supabase
    .from('systems').select('website_id').eq('id', id).single()

  const { error } = await supabase.from('systems').delete().eq('id', id)
  if (error) throw error

  return { websiteId: sys?.website_id ?? null }
}

export async function acceptSystem(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const { error } = await supabase.from('systems').update({ status: 'active' }).eq('id', id)
  if (error) throw error
  revalidatePath('/systems')
}

export async function deleteWebsite(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const { error } = await supabase.from('websites').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function generatePolicy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Nem vagy bejelentkezve!")

  const websiteId = formData.get('websiteId') as string

  const { data: company } = await supabase
    .from('companies').select('*').eq('user_id', user.id).single()
  if (!company) throw new Error("Töltsd ki előbb a Beállítások oldalt!")

  const { data: website } = await supabase
    .from('websites').select('*').eq('id', websiteId).single()
  if (!website) throw new Error("A weboldal nem található!")

  const { data: systems } = await supabase
    .from('systems').select('*').eq('website_id', websiteId).eq('status', 'active')

  const siteName = website.status === 'offline'
    ? website.url
    : website.url.replace(/^https?:\/\//, '')

  const { data: lastPolicy } = await supabase
    .from('policies').select('version').eq('website_id', websiteId)
    .order('valid_from', { ascending: false }).limit(1).single()

  let newVersion = '1.0'
  if (lastPolicy?.version) {
    const vParts = lastPolicy.version.split('.')
    newVersion = `${vParts[0]}.${parseInt(vParts[1] || '0') + 1}`
  }

  // Generálás dátuma — Budapest timezone
  const generatedAt = new Date()
  const today = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Budapest'
  }).format(generatedAt)

  const allSystems    = systems || []
  const thirdParties  = allSystems.filter(s => s.source_type === 'scanned' && !s.system_name?.includes('Webes űrlap'))
  const cookieSystems = thirdParties
  const formSystems   = allSystems.filter(s => s.system_name?.includes('Webes űrlap'))
  const manualSystems = allSystems.filter(s => s.source_type === 'manual')

  const dpoSection = company.dpo_name
    ? `<p>Az adatkezelő adatvédelmi tisztviselőjének neve: <strong>${company.dpo_name}</strong><br>
       E-mail: <a href="mailto:${company.dpo_email}">${company.dpo_email}</a></p>`
    : `<p>Az adatkezelő nem nevezett ki adatvédelmi tisztviselőt (DPO), mivel erre jogszabályi kötelezettség jelenleg nem áll fenn.</p>`

  function legalBasis(s: any): string {
    const p = (s.purpose || '').toLowerCase()
    if (p.includes('hírlevél') || p.includes('marketing') || p.includes('remarketing') || p.includes('hirdetés'))
      return 'Hozzájárulás (GDPR 6. cikk (1) a))'
    if (p.includes('fizetés') || p.includes('számlázás') || p.includes('rendelés') || p.includes('szerződés'))
      return 'Szerződés teljesítése (GDPR 6. cikk (1) b))'
    if (p.includes('jogi') || p.includes('törvény') || p.includes('adóügyi'))
      return 'Jogi kötelezettség (GDPR 6. cikk (1) c))'
    if (p.includes('analitik') || p.includes('statisztik') || p.includes('teljesítmény') || p.includes('biztonság'))
      return 'Jogos érdek (GDPR 6. cikk (1) f))'
    return 'Hozzájárulás (GDPR 6. cikk (1) a))'
  }

  // Timezone-safe megőrzési idő: YYYY-MM-DD → lokális dátum, nincs UTC shift
  function retentionPeriod(s: any): string {
    if (s.source_type === 'manual' && s.retention_until) {
      const raw = String(s.retention_until)
      const dateParts = raw.split('-').map(Number)
      if (dateParts.length === 3 && dateParts.every(n => !isNaN(n))) {
        const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
        if (!isNaN(d.getTime())) {
          return new Intl.DateTimeFormat('hu-HU', {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Budapest'
          }).format(d) + '-ig'
        }
      }
    }
    const p = (s.purpose || '').toLowerCase()
    if (p.includes('hírlevél') || p.includes('marketing'))           return 'Leiratkozásig'
    if (p.includes('fizetés')  || p.includes('számlázás'))           return '8 év (számviteli törvény)'
    if (p.includes('analitik') || p.includes('statisztik'))          return '26 hónap'
    if (p.includes('chat')     || p.includes('kapcsolat') || p.includes('üzenet')) return '1 év'
    if (p.includes('süti')     || p.includes('cookie')   || p.includes('remarketing')) return 'Süti lejártáig (max. 13 hónap)'
    return '5 év'
  }

  const allRows = [...manualSystems, ...formSystems, ...thirdParties]

  const mainTableRows = allRows.length > 0
    ? allRows.map(s => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e293b">${s.system_name || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${s.collected_data || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${s.purpose || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${legalBasis(s)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${retentionPeriod(s)}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" style="padding:12px;color:#94a3b8;text-align:center">Nem rögzítettek adatkezelési folyamatot.</td></tr>`

  const thirdPartyRows = thirdParties.length > 0
    ? thirdParties.map(s => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e293b">${s.system_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${s.purpose || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${s.collected_data || '—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="3" style="padding:12px;color:#94a3b8;text-align:center">Nem azonosítottak harmadik fél adatfeldolgozókat.</td></tr>`

  const cookieSection = cookieSystems.length > 0 ? `
    <h2>5. Sütik (Cookie-k) használata</h2>
    <p>A weboldal sütiket használ. Az alábbi sütiket alkalmazzuk:</p>
    <table>
      <thead><tr>
        <th>Sütik / Szolgáltatás neve</th><th>Célkitűzés</th><th>Kezelt adatok</th>
      </tr></thead>
      <tbody>
        ${cookieSystems.map(s => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e293b">${s.system_name}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${s.purpose || '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${s.collected_data || '—'}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <p>A sütik elfogadása önkéntes. A böngésző beállításaiban bármikor törölhetők.</p>` : ''

  const n = cookieSystems.length > 0

  const contentHtml = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adatkezelési Tájékoztató – ${siteName}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.7; max-width: 900px; margin: 0 auto; padding: 40px 24px; }
    h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    h2 { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 40px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #f1f5f9; }
    p { margin: 8px 0; font-size: 14px; color: #334155; }
    ul { font-size: 14px; color: #334155; padding-left: 20px; }
    li { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
    .badge { display: inline-block; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid #d1fae5; }
    a { color: #0ea5e9; }
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
<p>
  <strong>Cégnév:</strong> ${company.name || '—'}<br>
  <strong>Székhely:</strong> ${company.headquarters || '—'}<br>
  <strong>Adószám:</strong> ${company.tax_number || '—'}<br>
  <strong>Cégjegyzékszám:</strong> ${company.registration_number || '—'}<br>
  <strong>E-mail:</strong> <a href="mailto:${company.email}">${company.email || '—'}</a><br>
  <strong>Telefon:</strong> ${company.phone || '—'}
</p>

<h2>2. Adatvédelmi tisztviselő (DPO)</h2>
${dpoSection}

<h2>3. A kezelt adatok, az adatkezelés célja, jogalapja és megőrzési ideje</h2>
<p>A(z) <strong>${siteName}</strong> az alábbi személyes adatokat kezeli:</p>
<table>
  <thead><tr>
    <th>Rendszer / Folyamat</th>
    <th>Kezelt adatok</th>
    <th>Az adatkezelés célja</th>
    <th>Jogalap</th>
    <th>Megőrzési idő</th>
  </tr></thead>
  <tbody>${mainTableRows}</tbody>
</table>

<h2>4. Harmadik fél adatfeldolgozók</h2>
<p>A weboldal az alábbi külső szolgáltatásokat veszi igénybe:</p>
<table>
  <thead><tr>
    <th>Szolgáltatás neve</th><th>Adatkezelés célja</th><th>Kezelt adatok</th>
  </tr></thead>
  <tbody>${thirdPartyRows}</tbody>
</table>
<p style="margin-top:12px;font-size:13px;color:#64748b">Ezek a szolgáltatók saját adatkezelési tájékoztatójuk szerint kezelik az általuk gyűjtött adatokat.</p>

${cookieSection}

<h2>${n ? '6' : '5'}. Tárhelyszolgáltató (adatfeldolgozó)</h2>
<p>
  <strong>Cégnév:</strong> ${company.hosting_provider_name || '—'}<br>
  <strong>Cím:</strong> ${company.hosting_provider_address || '—'}<br>
  <strong>E-mail:</strong> ${company.hosting_provider_email || '—'}
</p>

<h2>${n ? '7' : '6'}. Automatizált döntéshozatal és profilalkotás</h2>
<p>Az adatkezelés automatizált döntéshozatalt vagy profilalkotást <strong>nem végez</strong> (GDPR 22. cikk).</p>

<h2>${n ? '8' : '7'}. Az érintett jogai</h2>
<p>A GDPR alapján Ön az alábbi jogokkal rendelkezik:</p>
<ul>
  <li><strong>Hozzáférési jog (15. cikk):</strong> tájékoztatást kérhet a kezelt adatairól</li>
  <li><strong>Helyesbítési jog (16. cikk):</strong> kérheti a pontatlan adatok javítását</li>
  <li><strong>Törlési jog (17. cikk):</strong> kérheti adatai törlését</li>
  <li><strong>Az adatkezelés korlátozásához való jog (18. cikk):</strong> kérheti az adatkezelés korlátozását</li>
  <li><strong>Adathordozhatósághoz való jog (20. cikk):</strong> kérheti adatait géppel olvasható formátumban</li>
  <li><strong>Tiltakozáshoz való jog (21. cikk):</strong> tiltakozhat az adatkezelés ellen</li>
  <li><strong>Hozzájárulás visszavonása:</strong> hozzájárulás alapú adatkezelésnél bármikor visszavonhatja</li>
</ul>
<p>Jogait az alábbi e-mail címen gyakorolhatja: <a href="mailto:${company.email}">${company.email || '—'}</a></p>
<p>Jogorvoslati lehetőséggel élhet a <strong>Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH)</strong>:<br>
  Cím: 1055 Budapest, Falk Miksa utca 9-11. &nbsp;·&nbsp;
  Web: <a href="https://www.naih.hu" target="_blank">www.naih.hu</a> &nbsp;·&nbsp;
  E-mail: ugyfelszolgalat@naih.hu
</p>

<h2>${n ? '9' : '8'}. Adatbiztonsági intézkedések</h2>
<p>Az adatkezelő megfelelő technikai és szervezési intézkedéseket alkalmaz a személyes adatok védelme érdekében, beleértve a titkosítást, hozzáférés-vezérlést és rendszeres biztonsági felülvizsgálatokat.</p>

<h2>${n ? '10' : '9'}. Tájékoztató módosítása</h2>
<p>Az adatkezelő fenntartja a jogot jelen tájékoztató módosítására. A módosításokról az érintetteket a weboldalon keresztül tájékoztatja.</p>

<p style="margin-top:48px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px">
  Generálva: ${today} &nbsp;·&nbsp; DataKomp automatikus tájékoztató generátor &nbsp;·&nbsp; v${newVersion}
</p>

</body>
</html>`

  await supabase
    .from('policies')
    .update({ status: 'archived', valid_to: new Date().toISOString() })
    .eq('website_id', websiteId)
    .eq('status', 'current')

  const { error } = await supabase.from('policies').insert([{
    website_id:   websiteId,
    version:      newVersion,
    content_html: contentHtml,
    status:       'current',
    valid_from:   new Date().toISOString()
  }])

  if (error) throw error

  await supabase
    .from('websites')
    .update({ policy_version: newVersion, updated_at: new Date().toISOString() })
    .eq('id', websiteId)

  revalidatePath('/policies')
  revalidatePath('/')
}

export async function restorePolicy(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { data: toRestore } = await supabase
    .from('policies').select('*').eq('id', id).single()
  if (!toRestore) throw new Error("A tájékoztató nem található!")

  await supabase
    .from('policies')
    .update({ status: 'archived', valid_to: new Date().toISOString() })
    .eq('website_id', toRestore.website_id)
    .eq('status', 'current')

  await supabase
    .from('policies')
    .update({ status: 'current', valid_from: new Date().toISOString(), valid_to: null })
    .eq('id', id)

  await supabase
    .from('websites')
    .update({ policy_version: toRestore.version, updated_at: new Date().toISOString() })
    .eq('id', toRestore.website_id)

  revalidatePath('/policies')
  revalidatePath('/')
}

export async function deletePolicy(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) throw new Error('Hiányzó tájékoztató ID!')

  const { data: policy } = await supabase
    .from('policies').select('website_id, status').eq('id', id).single()

  const { error } = await supabase.from('policies').delete().eq('id', id)
  if (error) throw error

  if (policy?.website_id) {
    const { data: latest } = await supabase
      .from('policies').select('version')
      .eq('website_id', policy.website_id)
      .eq('status', 'current')
      .order('valid_from', { ascending: false })
      .limit(1).single()

    await supabase
      .from('websites')
      .update({ policy_version: latest?.version || null, updated_at: new Date().toISOString() })
      .eq('id', policy.website_id)
  }

  revalidatePath('/policies')
  revalidatePath('/')
}

export async function refreshAllPolicies() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Nem vagy bejelentkezve!")

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) throw new Error("Nincs cégadat!")

  const { data: websites } = await supabase
    .from('websites').select('id')
    .eq('company_id', company.id)
    .neq('status', 'scanning')
    .neq('status', 'offline')

  if (!websites || websites.length === 0) return

  for (const site of websites) {
    const fd = new FormData()
    fd.set('websiteId', site.id)
    await generatePolicy(fd)
  }

  revalidatePath('/')
  revalidatePath('/policies')
}

export async function rescanWebsite(formData: FormData) {
  const supabase = await createClient()
  const websiteId = formData.get('websiteId') as string
  if (!websiteId) throw new Error('Hiányzó weboldal ID!')

  const { data: website } = await supabase
    .from('websites').select('url').eq('id', websiteId).single()
  if (!website) throw new Error('A weboldal nem található!')

  await supabase
    .from('websites')
    .update({ status: 'scanning', updated_at: new Date().toISOString() })
    .eq('id', websiteId)

  revalidatePath('/')
  runScanner(websiteId, website.url).catch(err => console.error('Rescan hiba:', err))
}

export async function acceptAllPending() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nem vagy bejelentkezve!')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) throw new Error('Nincs cégadat!')

  const { data: websites } = await supabase
    .from('websites').select('id').eq('company_id', company.id)

  if (!websites || websites.length === 0) return

  const websiteIds = websites.map((w) => w.id)

  const { error } = await supabase
    .from('systems')
    .update({ status: 'active' })
    .in('website_id', websiteIds)
    .eq('status', 'pending')

  if (error) throw error
  revalidatePath('/systems')
}

export async function updateRetentionPeriod(id: string, value: string) {
  const supabase = await createClient()
  await supabase
    .from('systems')
    .update({ retention_period: value })
    .eq('id', id)
}