import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { createClient } from '@/utils/supabase/server'

// ============================================================
// ISMERT TRACKER / ADATGYŰJTŐ MINTÁK
// ============================================================
const KNOWN_TRACKERS = [
  // Analytics
  { pattern: /google-analytics\.com|gtag\/js|ga\(|_gaq/i, name: 'Google Analytics', purpose: 'Látogatottsági analitika', collected_data: 'IP-cím, böngésző adatok, oldalmegtekintések, munkamenet adatok' },
  { pattern: /googletagmanager\.com|gtm\.js/i, name: 'Google Tag Manager', purpose: 'Marketing és analitikai tagek kezelése', collected_data: 'Süti azonosítók, kattintási és viselkedési adatok' },
  { pattern: /connect\.facebook\.net|fbq\(|facebook\.com\/tr/i, name: 'Facebook Pixel', purpose: 'Közösségi média remarketing', collected_data: 'IP-cím, böngésző ujjlenyomat, konverziós adatok' },
  { pattern: /hotjar\.com|hj\(|hjid/i, name: 'Hotjar', purpose: 'Felhasználói viselkedés elemzés (hőtérkép, felvétel)', collected_data: 'Egérmozgás, kattintások, munkamenet felvételek' },
  { pattern: /clarity\.ms|microsoft clarity/i, name: 'Microsoft Clarity', purpose: 'Viselkedéselemzés és hőtérkép', collected_data: 'Munkamenet adatok, kattintások, görgetési minták' },
  { pattern: /plausible\.io/i, name: 'Plausible Analytics', purpose: 'Adatvédelmi-barát látogatottsági mérés', collected_data: 'Anonimizált oldalmegtekintési adatok' },
  { pattern: /matomo\.org|piwik\.js/i, name: 'Matomo', purpose: 'Látogatottsági analitika', collected_data: 'IP-cím, oldalmegtekintések, munkamenet adatok' },
  { pattern: /mixpanel\.com/i, name: 'Mixpanel', purpose: 'Termék és esemény analitika', collected_data: 'Felhasználói azonosítók, esemény adatok, eszköz adatok' },
  { pattern: /segment\.com|segment\.io/i, name: 'Segment', purpose: 'Ügyfél adat platform', collected_data: 'Felhasználói viselkedés, tranzakciós adatok' },
  // Reklám
  { pattern: /doubleclick\.net|googlesyndication|adservice\.google/i, name: 'Google Ads / DoubleClick', purpose: 'Célzott hirdetések megjelenítése', collected_data: 'Böngészési szokások, érdeklődési körök, konverziós adatok' },
  { pattern: /linkedin\.com\/insight|snap\.licdn/i, name: 'LinkedIn Insight Tag', purpose: 'LinkedIn remarketing és konverziókövetés', collected_data: 'IP-cím, eszközadatok, szakmai profiladatok' },
  { pattern: /tiktok\.com|ttq\./i, name: 'TikTok Pixel', purpose: 'TikTok hirdetési konverziókövetés', collected_data: 'IP-cím, eszközadatok, viselkedési adatok' },
  { pattern: /twitter\.com\/i\/adsct|ads-twitter/i, name: 'Twitter/X Ads Pixel', purpose: 'Twitter hirdetési konverziókövetés', collected_data: 'IP-cím, böngésző adatok, interakciók' },
  // Chat / Ügyfélszolgálat
  { pattern: /intercom\.io|widget\.intercom/i, name: 'Intercom', purpose: 'Ügyfélszolgálati chat és CRM', collected_data: 'Név, e-mail cím, üzenetek tartalma, munkamenet adatok' },
  { pattern: /tawk\.to/i, name: 'Tawk.to', purpose: 'Élő chat ügyfélszolgálat', collected_data: 'IP-cím, üzenetek, böngésző adatok' },
  { pattern: /zopim\.com|zendesk\.com/i, name: 'Zendesk Chat', purpose: 'Ügyfélszolgálati chat', collected_data: 'Név, e-mail cím, üzenetek tartalma' },
  { pattern: /crisp\.chat/i, name: 'Crisp Chat', purpose: 'Élő chat és ügyfélszolgálat', collected_data: 'IP-cím, böngésző adatok, chat üzenetek' },
  // Fizetési rendszerek
  { pattern: /stripe\.com\/v3|js\.stripe/i, name: 'Stripe', purpose: 'Online fizetés feldolgozás', collected_data: 'Bankkártya adatok (tokenizálva), számlázási cím, tranzakciós adatok' },
  { pattern: /paypal\.com\/sdk|paypalobjects/i, name: 'PayPal', purpose: 'Online fizetés feldolgozás', collected_data: 'PayPal azonosító, tranzakciós adatok, számlázási cím' },
  { pattern: /barion\.com/i, name: 'Barion', purpose: 'Online fizetés feldolgozás', collected_data: 'Fizetési adatok, e-mail cím, tranzakciós adatok' },
  // Közösségi média
  { pattern: /platform\.twitter\.com|twitter\.com\/widgets/i, name: 'Twitter/X Widget', purpose: 'Közösségi média integráció', collected_data: 'Böngészési adatok, közösségi interakciók' },
  { pattern: /connect\.facebook\.net\/.*\/sdk/i, name: 'Facebook SDK', purpose: 'Közösségi bejelentkezés és megosztás', collected_data: 'Facebook profil adatok, barátlista, e-mail cím' },
  { pattern: /apis\.google\.com\/js\/plusone|accounts\.google\.com/i, name: 'Google Sign-In', purpose: 'Google fiókkal való bejelentkezés', collected_data: 'Google profil adatok, e-mail cím, profilkép' },
  // Email marketing
  { pattern: /mailchimp\.com|chimpstatic\.com/i, name: 'Mailchimp', purpose: 'E-mail marketing és hírlevél', collected_data: 'E-mail cím, feliratkozási adatok, megnyitási statisztikák' },
  { pattern: /klaviyo\.com/i, name: 'Klaviyo', purpose: 'E-mail és SMS marketing automatizáció', collected_data: 'E-mail cím, vásárlási előzmények, viselkedési adatok' },
  // CDN / Infrastruktúra
  { pattern: /cloudflare\.com|cloudflareinsights/i, name: 'Cloudflare', purpose: 'CDN, biztonság és teljesítményoptimalizálás', collected_data: 'IP-cím, HTTP fejlécek, teljesítmény metrikák' },
  // Cookie consent
  { pattern: /cookiebot\.com/i, name: 'Cookiebot', purpose: 'Süti hozzájárulás kezelés', collected_data: 'Hozzájárulási preferenciák, időbélyeg' },
  { pattern: /cookiehub\.com/i, name: 'CookieHub', purpose: 'Süti hozzájárulás kezelés', collected_data: 'Hozzájárulási preferenciák, időbélyeg' },
  // Webshop
  { pattern: /shopify\.com\/s\/files|cdn\.shopify/i, name: 'Shopify', purpose: 'E-kereskedelmi platform', collected_data: 'Vásárlói adatok, rendelési adatok, számlázási cím' },
  { pattern: /woocommerce/i, name: 'WooCommerce', purpose: 'E-kereskedelmi rendszer', collected_data: 'Vásárlói adatok, rendelési előzmények, számlázási adatok' },
]

// Form mező felismerés
const FORM_FIELD_PATTERNS = [
  { pattern: /email|e-mail|mail/i, data: 'E-mail cím', purpose: 'Kapcsolattartás, hírlevél, azonosítás' },
  { pattern: /phone|tel|telefon|mobil/i, data: 'Telefonszám', purpose: 'Kapcsolattartás, ügyfélszolgálat' },
  { pattern: /name|nev|firstname|lastname|keresztnev|vezeteknev/i, data: 'Teljes név / Keresztnév / Vezetéknév', purpose: 'Azonosítás, megszólítás' },
  { pattern: /address|cim|utca|varos|city|zip|irsz|postai/i, data: 'Postai / Számlázási cím', purpose: 'Szállítás, számlázás' },
  { pattern: /birth|szulet|dob|age|kor/i, data: 'Születési dátum / Kor', purpose: 'Életkor ellenőrzés, személyazonosítás' },
  { pattern: /password|jelszo|pass/i, data: 'Jelszó (hash-elve tárolva)', purpose: 'Fiók azonosítás és biztonság' },
  { pattern: /card|kartya|cc_|credit|debit/i, data: 'Bankkártya adatok', purpose: 'Online fizetés feldolgozás' },
  { pattern: /message|uzenet|comment|megjegyzes/i, data: 'Üzenet / Megjegyzés tartalma', purpose: 'Kapcsolatfelvétel, ügyfélszolgálat' },
  { pattern: /company|ceg|firma|organization/i, data: 'Cégnév / Szervezet neve', purpose: 'B2B kapcsolattartás, számlázás' },
  { pattern: /tax|adoszam|vat/i, data: 'Adószám / Adóazonosító', purpose: 'Számlázás, jogi megfelelőség' },
]

// ============================================================
// URL NORMALIZÁLÓ ÉS SZŰRŐ
// ============================================================
function normalizeUrl(href: string, base: string): string | null {
  try {
    const url = new URL(href, base)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function isSameDomain(url: string, base: string): boolean {
  try {
    return new URL(url).hostname === new URL(base).hostname
  } catch {
    return false
  }
}

// ============================================================
// EGY OLDAL LESCANNNELÉSE
// ============================================================
async function scanPage(url: string) {
  const trackers: typeof KNOWN_TRACKERS = []
  const formFields: typeof FORM_FIELD_PATTERNS = []
  const links: string[] = []

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DataKomp-Scanner/1.0)' },
      signal: AbortSignal.timeout(10000)
    })

    if (!res.ok) return { trackers, formFields, links }
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) return { trackers, formFields, links }

    const html = await res.text()
    const $ = cheerio.load(html)

    const scriptSrcs: string[] = []
    const scriptContents: string[] = []
    $('script').each((_, el) => {
      const src = $(el).attr('src')
      if (src) scriptSrcs.push(src)
      const content = $(el).html()
      if (content) scriptContents.push(content)
    })

    // Tracker felismerés
    for (const tracker of KNOWN_TRACKERS) {
      const found =
        scriptSrcs.some(s => tracker.pattern.test(s)) ||
        scriptContents.some(s => tracker.pattern.test(s)) ||
        tracker.pattern.test(html)
      if (found && !trackers.find(t => t.name === tracker.name)) {
        trackers.push(tracker)
      }
    }

    // Form mező felismerés
    $('input, textarea, select').each((_, el) => {
      const combined = [
        $(el).attr('name') || '',
        $(el).attr('id') || '',
        $(el).attr('placeholder') || '',
        $(el).attr('type') || ''
      ].join(' ')
      for (const field of FORM_FIELD_PATTERNS) {
        if (field.pattern.test(combined) && !formFields.find(f => f.data === field.data)) {
          formFields.push(field)
        }
      }
    })

    // Linkek összegyűjtése
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) {
        const normalized = normalizeUrl(href, url)
        if (normalized && isSameDomain(normalized, url)) {
          links.push(normalized)
        }
      }
    })
  } catch {
    // Timeout vagy hiba esetén továbblépünk
  }

  return { trackers, formFields, links }
}

// ============================================================
// FŐ CRAWLER - MÉLY SZKENNELÉS
// ============================================================
async function deepScan(startUrl: string, maxDepth = 3, maxPages = 40) {
  const visited = new Set<string>()
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }]
  const allTrackers = new Map<string, typeof KNOWN_TRACKERS[number]>()
  const allFormFields = new Map<string, typeof FORM_FIELD_PATTERNS[number]>()

  while (queue.length > 0 && visited.size < maxPages) {
    const item = queue.shift()
    if (!item) break
    const { url, depth } = item

    const cleanUrl = url.split('?')[0]
    if (visited.has(cleanUrl)) continue
    visited.add(cleanUrl)

    const { trackers, formFields, links } = await scanPage(url)

    for (const t of trackers) allTrackers.set(t.name, t)
    for (const f of formFields) allFormFields.set(f.data, f)

    if (depth < maxDepth) {
      for (const link of links) {
        const cleanLink = link.split('?')[0]
        if (!visited.has(cleanLink)) {
          queue.push({ url: link, depth: depth + 1 })
        }
      }
    }
  }

  return {
    trackers: Array.from(allTrackers.values()),
    formFields: Array.from(allFormFields.values()),
    pagesScanned: visited.size
  }
}

// ============================================================
// API ROUTE - POST /api/scan
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { websiteId, url } = await req.json()
    if (!websiteId || !url) {
      return NextResponse.json({ error: 'Hiányzó paraméterek' }, { status: 400 })
    }

    const supabase = await createClient()
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`
    const { trackers, formFields, pagesScanned } = await deepScan(cleanUrl)

    // Régi scannelt adatok törlése
    await supabase
      .from('systems')
      .delete()
      .eq('website_id', websiteId)
      .eq('source_type', 'scanned')

    // Manuális adatok lekérése (szinkronizáláshoz)
    const { data: manualSystems } = await supabase
      .from('systems')
      .select('purpose, collected_data')
      .eq('website_id', websiteId)
      .eq('source_type', 'manual')

    const siteName = cleanUrl.replace(/^https?:\/\//, '').split('/')[0]

    // Trackerek mentése
    for (const tracker of trackers) {
      const existsManually = manualSystems?.some(
        m => m.purpose?.toLowerCase().includes(tracker.purpose.toLowerCase()) ||
             m.collected_data?.toLowerCase().includes(tracker.name.toLowerCase())
      )
      if (!existsManually) {
        await supabase.from('systems').insert({
          website_id: websiteId,
          system_name: tracker.name,
          purpose: tracker.purpose,
          collected_data: tracker.collected_data,
          status: 'active',
          source_type: 'scanned'
        })
      }
    }

    // Form mezők mentése
    for (const field of formFields) {
      const existsManually = manualSystems?.some(
        m => m.collected_data?.toLowerCase().includes(field.data.toLowerCase())
      )
      if (!existsManually) {
        await supabase.from('systems').insert({
          website_id: websiteId,
          system_name: `${siteName} – Webes űrlap`,
          purpose: field.purpose,
          collected_data: field.data,
          status: 'active',
          source_type: 'scanned'
        })
      }
    }

    // Státusz frissítése: verified
    await supabase
      .from('websites')
      .update({
        status: 'verified',
        last_scanned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    return NextResponse.json({ success: true, pagesScanned, trackersFound: trackers.length, formFieldsFound: formFields.length })
  } catch (err) {
    console.error('Scanner hiba:', err)
    return NextResponse.json({ error: 'Scanner hiba' }, { status: 500 })
  }
}