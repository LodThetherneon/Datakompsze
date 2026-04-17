'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { runScanner } from '@/lib/scanner'
import fs from 'fs'
import path from 'path'

function getSzechenyiBg(): string {
  try {
    const imgPath = path.join(process.cwd(), 'public', 'szechenyi-bg.png')
    if (fs.existsSync(imgPath)) {
      return `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
    }
  } catch {}
  return ''
}

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

  const parts = retentionUntilRaw.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) throw new Error("Érvénytelen dátum formátum!")
  const retentionDate = new Date(parts[0], parts[1] - 1, parts[2])
  if (isNaN(retentionDate.getTime())) throw new Error("Érvénytelen dátum!")

  const { error } = await supabase.from('systems').insert([{
    company_id:        company.id,
    website_id:        websiteId,
    system_name:       dataTypeCat,
    purpose: (formData.get('purpose') as string)?.trim() || dataTypeCat,
    collected_data:    collectedData,
    status:            'active',
    source_type:       (formData.get('sourceType') as string) || 'manual',
    retention_until:   retentionUntilRaw,
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

  await supabase
    .from('process_system_links')
    .delete()
    .eq('system_id', id)

  const { error } = await supabase.from('systems').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/systems')
  revalidatePath('/data-registry')
  revalidatePath('/')
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

  const { data: dataProcesses } = await supabase
  .from('data_processes')
  .select('*')
  .eq('company_id', company.id)
  .eq('website_id', websiteId)

  const processRows = (dataProcesses || []).map((p: any) => ({
    system_name:      p.process_name,
    purpose:          p.purpose,
    collected_data:   p.collected_data,
    retention_until:  null,
    retention_period: p.retention_period,
    source_type:      'process',
  }))

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

  const generatedAt = new Date()
  const today = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Budapest'
  }).format(generatedAt)

  const allSystems   = systems || []
  const thirdParties = allSystems.filter((s: any) =>
    s.source_type === 'scanned' && !s.system_name?.includes('Webes űrlap')
  )
  const cookieSystems = thirdParties.filter((s: any) => {
    const n = (s.system_name || '').toLowerCase()
    const p = (s.purpose    || '').toLowerCase()
    return n.includes('analytics') || n.includes('tag')      || n.includes('pixel') ||
           n.includes('cookie')    || n.includes('süti')     || n.includes('hotjar') ||
           n.includes('facebook')  || n.includes('gtm')      || n.includes('clarity') ||
           p.includes('süti')      || p.includes('cookie')   || p.includes('analitik') ||
           p.includes('remarketing')
  })
  const formSystems   = allSystems.filter((s: any) => s.system_name?.includes('Webes űrlap'))
  const manualSystems = allSystems.filter((s: any) => s.source_type === 'manual' || s.source_type === 'process')
  const allRows = [...manualSystems, ...formSystems, ...thirdParties, ...processRows]
  const hasCookies    = cookieSystems.length > 0

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

  function retentionPeriod(s: any): string {
    if ((s.source_type === 'manual' || s.source_type === 'process') && s.retention_until) {
      const raw = String(s.retention_until)
      const dateParts = raw.split('-').map(Number)
      if (dateParts.length === 3 && dateParts.every((n: number) => !isNaN(n))) {
        const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
        if (!isNaN(d.getTime())) {
          return new Intl.DateTimeFormat('hu-HU', {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Budapest'
          }).format(d) + '-ig'
        }
      }
    }
    const p = (s.purpose || '').toLowerCase()
    if (p.includes('hírlevél') || p.includes('marketing'))                          return 'Leiratkozásig'
    if (p.includes('fizetés')  || p.includes('számlázás'))                          return '8 év (számviteli törvény)'
    if (p.includes('analitik') || p.includes('statisztik'))                         return '26 hónap'
    if (p.includes('chat')     || p.includes('kapcsolat') || p.includes('üzenet')) return '1 év'
    if (p.includes('süti')     || p.includes('cookie')   || p.includes('remarketing')) return 'Süti lejártáig (max. 13 hónap)'
    return '5 év'
  }

  // ─── Lap konstansok ────────────────────────────────────────────────────────
  const bg       = getSzechenyiBg()
  const PAGE_W   = 900
  const PAGE_H   = 1273
  const HEADER_H = 165
  const FOOTER_H = 114
  const PAD_X    = 68
  const PAD_Y    = 10
  // Extra 60px puffer hogy ne csússzon szét fejléc és tábla laphatáron
  const AVAIL    = PAGE_H - HEADER_H - FOOTER_H - PAD_Y * 2 - 60

  // ─── CSS ──────────────────────────────────────────────────────────────────
  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #ececec; font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; }
    .document  { width: ${PAGE_W}px; margin: 30px auto; }
    .page {
      position: relative; width: ${PAGE_W}px; height: ${PAGE_H}px;
      background: #fff; overflow: hidden; margin-bottom: 20px;
      box-shadow: 0 2px 16px rgba(0,0,0,.20);
    }
    .bg-img {
      position: absolute; top: 0; left: 0;
      width: ${PAGE_W}px; height: ${PAGE_H}px;
      object-fit: fill; z-index: 0; pointer-events: none;
    }
    .page-content {
      position: absolute;
      top: ${HEADER_H + PAD_Y}px;
      left: ${PAD_X}px;
      right: ${PAD_X}px;
      bottom: ${FOOTER_H + PAD_Y}px;
      overflow: hidden; z-index: 1;
    }
    p   { font-size: 12.5px; color: #1a1a1a; margin-bottom: 5px; line-height: 1.6; }
    h2  { font-size: 12.5px; font-weight: 700; color: #1a1a1a; margin-top: 14px; margin-bottom: 4px; }
    h3  { font-size: 12.5px; font-weight: 700; font-style: italic; color: #1a1a1a; margin-top: 8px; margin-bottom: 3px; }
    a   { color: #1a3a6b; text-decoration: none; }
    .doc-title       { text-align: center; margin-bottom: 14px; margin-top: 6px; }
    .doc-title h1    { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #1a1a1a; }
    .doc-title .sub  { display: inline-block; font-size: 13px; font-weight: 700; color: #1a1a1a; margin-top: 5px; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 5px; font-size: 11px; }
    th { background: #1a3a6b; color: #fff; padding: 5px 7px; text-align: left; font-weight: 700; border: 1px solid #1a3a6b; }
    td { padding: 5px 7px; border: 1px solid #bbb; color: #1a1a1a; vertical-align: top; line-height: 1.4; }
    tr:nth-child(even) td { background: #f4f6fa; }
    .naih-table th { background: #555; border-color: #555; }
    .page-footer {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: ${FOOTER_H}px;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding-bottom: 10px;
    }
    .page-footer .footer-name {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #1a1a1a;
      text-transform: uppercase;
    }
    .page-footer .footer-address {
      font-size: 9.5px;
      color: #1a1a1a;
      letter-spacing: 0.03em;
    }
    .page-footer .footer-contacts {
      font-size: 9.5px;
      color: #1a1a1a;
      letter-spacing: 0.03em;
    }
    .page-footer .footer-sep {
      color: #1a3a6b;
      margin: 0 5px;
    }
  `
  // ─── Segédfüggvények ───────────────────────────────────────────────────────
  const makePage = (inner: string) => `
  <div class="page">
    <img class="bg-img" src="${bg}" alt="" />
    <div class="page-content">${inner}</div>
    <div class="page-footer">
      <div class="footer-name">Széchenyi István Egyetem – University of Győr</div>
      <div class="footer-address">9026 Győr, Egyetem tér 1.</div>
      <div class="footer-contacts">
        uni.sze.hu
        <span class="footer-sep">|</span>
        <a href="mailto:sze@sze.hu" style="color:#1a1a1a;text-decoration:none;">sze@sze.hu</a>
        <span class="footer-sep">|</span>
        +36 96 503 400
      </div>
    </div>
  </div>`

  type Atom = { html: string; estH: number }

  const H2_H    = 32
  const H3_H    = 24
  const P_H     = 22
  const THEAD_H = 30

  function estimateCellLines(text: string, colWidthChars = 30): number {
    if (!text) return 1
    const plain = text.replace(/<[^>]+>/g, '')
    return Math.max(1, Math.ceil(plain.length / colWidthChars))
  }

  function estimateRowHeight(cells: string[]): number {
    const maxLines = Math.max(...cells.map(c => estimateCellLines(c, 30)))
    return 10 + maxLines * 16
  }

  function trRow(cells: string[], even = false): string {
    const bg = even ? 'background:#f4f6fa;' : ''
    return `<tr>${cells.map(c =>
      `<td style="padding:5px 7px;border:1px solid #bbb;color:#1a1a1a;vertical-align:top;line-height:1.4;${bg}">${c}</td>`
    ).join('')}</tr>`
  }

  function thRow(cells: string[]): string {
    return `<thead><tr>${cells.map(c =>
      `<th style="background:#1a3a6b;color:#fff;padding:5px 7px;text-align:left;font-weight:700;border:1px solid #1a3a6b;">${c}</th>`
    ).join('')}</tr></thead>`
  }

  function buildTable(headers: string[], rowCells: string[][]): { html: string; estH: number } {
    const rowsH = rowCells.reduce((sum, cells) => sum + estimateRowHeight(cells), 0)
    const estH  = THEAD_H + rowsH + 16
    const html  = `
      <table>
        ${thRow(headers)}
        <tbody>
          ${rowCells.map((cells, i) => trRow(cells, i % 2 === 1)).join('')}
        </tbody>
      </table>`
    return { html, estH }
  }

  const atoms: Atom[] = []

  function addAtom(html: string, estH: number) {
    atoms.push({ html, estH })
  }

  // ─── 1. Cím blokk ──────────────────────────────────────────────────────────
  addAtom(`
    <div class="doc-title">
      <h1>Adatkezelési tájékoztató</h1>
      <div class="sub">${siteName} vonatkozására</div>
    </div>
    <p>Tájékoztatjuk, hogy a Széchenyi István Egyetem kiemelt jelentőséget tulajdonít a személyes adatok védelmének
    és minden körülmények között biztosítani kívánja az egyének önrendelkezési jogát.</p>
    <p>A Széchenyi István Egyetem bármely – az adatkezelés során tudomására jutott – személyes adatot az
    információs önrendelkezési jogról és az információszabadságról szóló 2011. évi CXII. törvény és AZ EURÓPAI
    PARLAMENT ÉS A TANÁCS (EU) 2016/679 RENDELETE (2016. április 27.) rendelkezései szerint kezel.</p>
  `, 90)

  // ─── 2. Adatkezelő + jogszabályok + tárgy ─────────────────────────────────
  addAtom(`
    <h2>1. Adatkezelő megnevezése:</h2>
    <p>Széchenyi István Egyetem (a továbbiakban: Egyetem)</p>
    <p>cím: 9026 Győr, Egyetem tér 1.</p>
    <p>email: <a href="mailto:sze@sze.hu">sze@sze.hu</a> &nbsp;·&nbsp; telefon: +36(96) 503-400 &nbsp;·&nbsp; honlap: uni.sze.hu</p>
    <h2>2. Adatkezelésre vonatkozó jogszabályok:</h2>
    <p>– az Európai Parlament és a Tanács (EU) 2016/679 Rendelete (2016. április 27.) a természetes személyeknek
    a személyes adatok kezelése tekintetében történő védelméről és az ilyen adatok szabad áramlásáról;</p>
    <p>– az információs önrendelkezési jogról és az információszabadságról szóló 2011. évi CXII. törvény;</p>
    <h2>3. Az adatkezelés tárgya és érintettjei:</h2>
    <p>– Az adatkezelés tárgya: <strong>${siteName}</strong></p>
    <p>– Az adatkezelés érintettjei: az adatkezelési folyamatban részt vevő természetes személyek</p>
  `, 200)

  // ─── 3. Fő adatkezelési táblázat (fejléc + tábla = EGY atom) ──────────────
  const mainHeaders = ['Kezelt adatok köre', 'Adatkezelés célja', 'Adatkezelés jogalapja', 'Adatkezelés időtartama', 'Adatok forrása']
  const mainRowCells: string[][] = allRows.length > 0
    ? allRows.map((s: any) => [
        s.collected_data || '—',
        s.purpose || s.system_name || '—',
        legalBasis(s),
        retentionPeriod(s),
        'az érintett önkéntes adatszolgáltatása'
      ])
    : [['Nem rögzítettek adatkezelési folyamatot.', '', '', '', '']]

  const mainTable = buildTable(mainHeaders, mainRowCells)
  addAtom(`
    <h2>4. A kezelt adatok köre, az adatkezelés célja, időtartama, jogalapja, adatok forrása</h2>
    ${mainTable.html}
  `, H2_H + mainTable.estH)

  // ─── 4. Adattovábbítás (fejléc + bevezető + tábla = EGY atom) ─────────────
  const tpHeaders = ['Szolgáltatás neve', 'Adatkezelés célja', 'Kezelt adatok']
  const tpRowCells: string[][] = thirdParties.length > 0
    ? thirdParties.map((s: any) => [s.system_name, s.purpose || '—', s.collected_data || '—'])
    : [['Jelen adatkezeléshez az Egyetem nem vesz igénybe adatfeldolgozót.', '', '']]

  const tpTable = buildTable(tpHeaders, tpRowCells)
  addAtom(`
    <h2>5. Adattovábbítás, adatfeldolgozás</h2>
    <p>Az Egyetem kizárólag jogszabály engedélye vagy az érintett hozzájárulása alapján kivételes esetben
    továbbít személyes adatokat harmadik fél részére.</p>
    ${tpTable.html}
  `, H2_H + P_H + tpTable.estH)

  // ─── 5. Sütik (fejléc + bevezető + tábla + megjegyzés = EGY atom) ─────────
  if (hasCookies) {
    const cookieHeaders  = ['Sütik / Szolgáltatás neve', 'Célkitűzés', 'Kezelt adatok']
    const cookieRowCells = cookieSystems.map((s: any) => [
      s.system_name, s.purpose || '—', s.collected_data || '—'
    ])
    const cookieTable = buildTable(cookieHeaders, cookieRowCells)
    addAtom(`
      <h2>6. Sütik (Cookie-k) használata</h2>
      <p>A weboldal az alábbi sütiket alkalmazza:</p>
      ${cookieTable.html}
      <p>A sütik elfogadása önkéntes. A böngésző beállításaiban bármikor törölhetők.</p>
    `, H2_H + P_H + cookieTable.estH + P_H)
  }

  // ─── 6. Adatbiztonság ──────────────────────────────────────────────────────
  const sec = hasCookies ? 7 : 6
  addAtom(`
    <h2>${sec}. Adatbiztonsági intézkedések:</h2>
    <p>Az Egyetem a megfelelő technikai vagy szervezési intézkedések alkalmazásával biztosítja a személyes
    adatok megfelelő biztonságát, az adatok jogosulatlan vagy jogellenes kezelésével, véletlen elvesztésével,
    megsemmisítésével vagy károsodásával szembeni védelmet is ideértve.</p>
  `, H2_H + P_H * 2)

  // ─── 7. Jogok blokk ────────────────────────────────────────────────────────
  addAtom(`
    <h2>${sec + 1}. Az Ön adatkezeléssel kapcsolatos jogai:</h2>
    <p>Az Ön adatvédelmi jogait és jogorvoslati lehetőségeit részletesen a GDPR tartalmazza (különösen a GDPR 15.,
    16., 17., 18., 19., 21., 22., 77., 78., 79. és 82. cikkei). Jogait az alábbi elérhetőségen keresztül
    gyakorolhatja:</p>
    <p>személyesen: 9026 Győr, Egyetem tér 1. &nbsp;·&nbsp; telefonon: +3696 503 400 &nbsp;·&nbsp;
    emailen: <a href="mailto:adatvedelem@sze.hu">adatvedelem@sze.hu</a></p>
    <p>adatvédelmi tisztviselő neve: dr. Pőcze Péter &nbsp;·&nbsp; telefon: +3696/503-400 3173-as mellék</p>
    <h3>Tájékoztatáshoz való jog:</h3>
    <p>Ön írásban bármikor tájékoztatást kérhet a személyes adatai kezeléséről (milyen adatait, milyen jogalapon,
    célból, forrásból kezeli az adatkezelő, mennyi ideig, kinek továbbítja).</p>
    <h3>Helyesbítéshez való jog:</h3>
    <p>Ön jogosult arra, hogy kérésére az Egyetem helyesbítse az Önre vonatkozó pontatlan személyes adatokat,
    illetve a hiányos személyes adatokat kiegészítse.</p>
    <h3>Törléshez való jog:</h3>
    <p>Ön írásban kérheti személyes adatainak törlését, kivéve ha az adatkezelés jogszabályi kötelezettség
    teljesítéséhez szükséges.</p>
    <h3>Korlátozáshoz való jog:</h3>
    <p>Az adatkezelő az érintett írásbeli kérésére korlátozza az adatkezelést, ha az érintett vitatja az adatok
    pontosságát, az adatkezelés jogellenes, vagy az adatkezelőnek már nincs szüksége az adatokra de az érintett
    kéri a megtartásukat.</p>
    <h3>Tiltakozáshoz való jog:</h3>
    <p>Ön jogosult arra, hogy saját helyzetével kapcsolatos okokból tiltakozzon a jogos érdek alapján végzett
    adatkezelés ellen. Ebben az esetben az adatkezelő a személyes adatokat nem kezelheti tovább, kivéve, ha az
    adatkezelő bizonyítja, hogy az adatkezelést olyan kényszerítő erejű jogos okok indokolják, amelyek elsőbbséget
    élveznek az érintett érdekeivel, jogaival szemben.</p>
    <h3>Önkéntes hozzájárulás visszavonásához való jog:</h3>
    <p>Az adatkezeléshez adott hozzájárulás bármikor visszavonható. A visszavonás nem érinti a visszavonás előtti
    adatkezelés jogszerűségét.</p>
  `, H2_H + P_H * 3 + H3_H * 5 + P_H * 5)

  // ─── 8. Jogorvoslat + NAIH táblázat ───────────────────────────────────────
  const naihRowCells = [
    ['cím:', '1055 Budapest, Falk Miksa utca 9-11.'],
    ['postacím:', '1363 Budapest, Pf.: 9.'],
    ['telefonszám:', '+36 (1) 391-1400'],
    ['e-mail:', '<a href="mailto:ugyfelszolgalat@naih.hu">ugyfelszolgalat@naih.hu</a>'],
    ['web:', '<a href="https://naih.hu" target="_blank">https://naih.hu/</a>'],
  ]
  const naihRowsH = naihRowCells.reduce((sum, cells) => sum + estimateRowHeight(cells), 0)
  const naihEstH  = THEAD_H + naihRowsH + 16

  addAtom(`
    <h2>${sec + 2}. Az Ön jogérvényesítési lehetőségei</h2>
    <p>Amennyiben az Ön megítélése szerint az adatkezelés jogellenes, a Nemzeti Adatvédelmi és
    Információszabadság Hatósághoz (NAIH) vagy bírósághoz fordulhat:</p>
    <table class="naih-table">
      <thead><tr>
        <th colspan="2" style="background:#555;border-color:#555;color:#fff;padding:5px 7px;font-weight:700">
          NAIH elérhetőségei
        </th>
      </tr></thead>
      <tbody>
        ${naihRowCells.map((cells, i) => trRow(cells, i % 2 === 1)).join('')}
      </tbody>
    </table>
    <p>Bírósági eljárást is kezdeményezhet az adatkezelő ellen: <a href="http://www.birosag.hu" target="_blank">www.birosag.hu</a></p>
    <p style="margin-top:20px;font-size:10px;color:#888;text-align:center">
      Generálva: ${today} &nbsp;·&nbsp; v${newVersion} &nbsp;·&nbsp;
    </p>
  `, H2_H + P_H + naihEstH + P_H * 2)

  // ─── Atom-alapú lapozás ────────────────────────────────────────────────────
  const pages: string[] = []
  let currentContent = ''
  let currentH = 0

  function flushPage() {
    if (currentContent.trim()) pages.push(makePage(currentContent))
    currentContent = ''
    currentH = 0
  }

  for (const atom of atoms) {
    if (currentH + atom.estH > AVAIL && currentH > 0) {
      flushPage()
    }
    currentContent += atom.html
    currentH += atom.estH
  }
  flushPage()

  // ─── Teljes HTML ───────────────────────────────────────────────────────────
  const contentHtml = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adatkezelési Tájékoztató – ${siteName}</title>
  <style>${css}</style>
</head>
<body>
  <div class="document">
    ${pages.join('\n')}
  </div>
</body>
</html>`

  // ─── Mentés Supabase-be ────────────────────────────────────────────────────
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

  const websiteIds = websites.map((w: any) => w.id)

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

export async function updateSystem(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('systems')
    .update({
      system_name:      (formData.get('system_name')      as string)?.trim() || undefined,
      purpose:          (formData.get('purpose')           as string)?.trim() || undefined,
      collected_data:   (formData.get('collected_data')    as string)?.trim() || undefined,
      retention_period: (formData.get('retention_period')  as string)?.trim() || undefined,
      storage_location: (formData.get('storage_location')  as string)?.trim() || undefined,
      department_name:  (formData.get('department_name')   as string)?.trim() || undefined,
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/systems')
}