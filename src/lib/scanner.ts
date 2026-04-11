import * as cheerio from 'cheerio'
import { createClient } from '@/utils/supabase/server'

// ─── Tracker minták ───────────────────────────────────────────────────────────

const KNOWN_TRACKERS = [
  { pattern: /google-analytics\.com|gtag\/js|ga\(|_gaq/i, name: 'Google Analytics', purpose: 'Látogatottsági analitika', collected_data: 'IP-cím, böngésző adatok, oldalmegtekintések, munkamenet adatok' },
  { pattern: /googletagmanager\.com|gtm\.js/i, name: 'Google Tag Manager', purpose: 'Marketing és analitikai tagek kezelése', collected_data: 'Süti azonosítók, kattintási és viselkedési adatok' },
  { pattern: /connect\.facebook\.net|fbq\(|facebook\.com\/tr/i, name: 'Facebook Pixel', purpose: 'Közösségi média remarketing', collected_data: 'IP-cím, böngésző ujjlenyomat, konverziós adatok' },
  { pattern: /hotjar\.com|hj\(|hjid/i, name: 'Hotjar', purpose: 'Felhasználói viselkedés elemzés (hőtérkép, felvétel)', collected_data: 'Egérmozgás, kattintások, munkamenet felvételek' },
  { pattern: /clarity\.ms|microsoft clarity/i, name: 'Microsoft Clarity', purpose: 'Viselkedéselemzés és hőtérkép', collected_data: 'Munkamenet adatok, kattintások, görgetési minták' },
  { pattern: /plausible\.io/i, name: 'Plausible Analytics', purpose: 'Adatvédelmi-barát látogatottsági mérés', collected_data: 'Anonimizált oldalmegtekintési adatok' },
  { pattern: /matomo\.org|piwik\.js/i, name: 'Matomo', purpose: 'Látogatottsági analitika', collected_data: 'IP-cím, oldalmegtekintések, munkamenet adatok' },
  { pattern: /mixpanel\.com/i, name: 'Mixpanel', purpose: 'Termék és esemény analitika', collected_data: 'Felhasználói azonosítók, esemény adatok, eszköz adatok' },
  { pattern: /segment\.com|segment\.io/i, name: 'Segment', purpose: 'Ügyfél adat platform', collected_data: 'Felhasználói viselkedés, tranzakciós adatok' },
  { pattern: /doubleclick\.net|googlesyndication|adservice\.google/i, name: 'Google Ads / DoubleClick', purpose: 'Célzott hirdetések megjelenítése', collected_data: 'Böngészési szokások, érdeklődési körök, konverziós adatok' },
  { pattern: /linkedin\.com\/insight|snap\.licdn/i, name: 'LinkedIn Insight Tag', purpose: 'LinkedIn remarketing és konverziókövetés', collected_data: 'IP-cím, eszközadatok, szakmai profiladatok' },
  { pattern: /tiktok\.com|ttq\./i, name: 'TikTok Pixel', purpose: 'TikTok hirdetési konverziókövetés', collected_data: 'IP-cím, eszközadatok, viselkedési adatok' },
  { pattern: /twitter\.com\/i\/adsct|ads-twitter/i, name: 'Twitter/X Ads Pixel', purpose: 'Twitter hirdetési konverziókövetés', collected_data: 'IP-cím, böngésző adatok, interakciók' },
  { pattern: /intercom\.io|widget\.intercom/i, name: 'Intercom', purpose: 'Ügyfélszolgálati chat és CRM', collected_data: 'Név, e-mail cím, üzenetek tartalma, munkamenet adatok' },
  { pattern: /tawk\.to/i, name: 'Tawk.to', purpose: 'Élő chat ügyfélszolgálat', collected_data: 'IP-cím, üzenetek, böngésző adatok' },
  { pattern: /zopim\.com|zendesk\.com/i, name: 'Zendesk Chat', purpose: 'Ügyfélszolgálati chat', collected_data: 'Név, e-mail cím, üzenetek tartalma' },
  { pattern: /crisp\.chat/i, name: 'Crisp Chat', purpose: 'Élő chat és ügyfélszolgálat', collected_data: 'IP-cím, böngésző adatok, chat üzenetek' },
  { pattern: /stripe\.com\/v3|js\.stripe/i, name: 'Stripe', purpose: 'Online fizetés feldolgozás', collected_data: 'Bankkártya adatok (tokenizálva), számlázási cím, tranzakciós adatok' },
  { pattern: /paypal\.com\/sdk|paypalobjects/i, name: 'PayPal', purpose: 'Online fizetés feldolgozás', collected_data: 'PayPal azonosító, tranzakciós adatok, számlázási cím' },
  { pattern: /barion\.com/i, name: 'Barion', purpose: 'Online fizetés feldolgozás', collected_data: 'Fizetési adatok, e-mail cím, tranzakciós adatok' },
  { pattern: /platform\.twitter\.com|twitter\.com\/widgets/i, name: 'Twitter/X Widget', purpose: 'Közösségi média integráció', collected_data: 'Böngészési adatok, közösségi interakciók' },
  { pattern: /connect\.facebook\.net\/.*\/sdk/i, name: 'Facebook SDK', purpose: 'Közösségi bejelentkezés és megosztás', collected_data: 'Facebook profil adatok, barátlista, e-mail cím' },
  { pattern: /apis\.google\.com\/js\/plusone|accounts\.google\.com/i, name: 'Google Sign-In', purpose: 'Google fiókkal való bejelentkezés', collected_data: 'Google profil adatok, e-mail cím, profilkép' },
  { pattern: /mailchimp\.com|chimpstatic\.com/i, name: 'Mailchimp', purpose: 'E-mail marketing és hírlevél', collected_data: 'E-mail cím, feliratkozási adatok, megnyitási statisztikák' },
  { pattern: /klaviyo\.com/i, name: 'Klaviyo', purpose: 'E-mail és SMS marketing automatizáció', collected_data: 'E-mail cím, vásárlási előzmények, viselkedési adatok' },
  { pattern: /cloudflare\.com|cloudflareinsights/i, name: 'Cloudflare', purpose: 'CDN, biztonság és teljesítményoptimalizálás', collected_data: 'IP-cím, HTTP fejlécek, teljesítmény metrikák' },
  { pattern: /cookiebot\.com/i, name: 'Cookiebot', purpose: 'Süti hozzájárulás kezelés', collected_data: 'Hozzájárulási preferenciák, időbélyeg' },
  { pattern: /cookiehub\.com/i, name: 'CookieHub', purpose: 'Süti hozzájárulás kezelés', collected_data: 'Hozzájárulási preferenciák, időbélyeg' },
  { pattern: /shopify\.com\/s\/files|cdn\.shopify/i, name: 'Shopify', purpose: 'E-kereskedelmi platform', collected_data: 'Vásárlói adatok, rendelési adatok, számlázási cím' },
  { pattern: /woocommerce/i, name: 'WooCommerce', purpose: 'E-kereskedelmi rendszer', collected_data: 'Vásárlói adatok, rendelési előzmények, számlázási adatok' },
  { pattern: /snaptr\(/i, name: 'Snapchat Pixel', purpose: 'Snapchat hirdetési konverziókövetés', collected_data: 'IP-cím, eszközadatok, viselkedési adatok' },
  { pattern: /pinterest\.com\/ct\/core|pintrk\(/i, name: 'Pinterest Tag', purpose: 'Pinterest hirdetési konverziókövetés', collected_data: 'Oldalmegtekintések, konverziók, érdeklődési adatok' },
  { pattern: /smartlook\.com/i, name: 'Smartlook', purpose: 'Felhasználói munkamenet rögzítés', collected_data: 'Egérmozgás, kattintások, munkamenet felvételek' },
  { pattern: /heap\.io|heap\.track/i, name: 'Heap Analytics', purpose: 'Automatikus esemény analitika', collected_data: 'Felhasználói interakciók, esemény adatok' },
  { pattern: /amplitude\.com/i, name: 'Amplitude', purpose: 'Termék analitika', collected_data: 'Felhasználói azonosítók, esemény adatok, eszköz adatok' },
  { pattern: /fullstory\.com|_fs_/i, name: 'FullStory', purpose: 'Digitális élmény analitika', collected_data: 'Munkamenet felvételek, kattintások, görgetési adatok' },
  { pattern: /hubspot\.com\/hs\.js|_hsq/i, name: 'HubSpot', purpose: 'CRM és marketing automatizáció', collected_data: 'E-mail cím, viselkedési adatok, kapcsolatfelvételi adatok' },
  { pattern: /cdn\.cookie-script\.com|cookie-script/i, name: 'Cookie Script', purpose: 'Süti hozzájárulás kezelés', collected_data: 'Hozzájárulási preferenciák, időbélyeg' },
  { pattern: /termly\.io/i, name: 'Termly', purpose: 'Süti hozzájárulás és adatvédelmi kezelés', collected_data: 'Hozzájárulási preferenciák, IP-cím' },
]

// ─── Meta tag trackerek ───────────────────────────────────────────────────────

const META_TRACKERS = [
  { pattern: /google-site-verification/i, name: 'Google Search Console', purpose: 'Weboldal tulajdon igazolás és keresési statisztikák', collected_data: 'Keresési lekérdezések, kattintások, megjelenések' },
  { pattern: /p:domain_verify/i, name: 'Pinterest Tag', purpose: 'Pinterest hirdetési konverziókövetés', collected_data: 'Oldalmegtekintések, konverziók, érdeklődési adatok' },
  { pattern: /msvalidate\.01/i, name: 'Bing Webmaster Tools', purpose: 'Bing keresési statisztikák és indexelés', collected_data: 'Keresési lekérdezések, kattintások, crawl adatok' },
  { pattern: /yandex-verification/i, name: 'Yandex Webmaster', purpose: 'Yandex keresési statisztikák', collected_data: 'Keresési lekérdezések, oldalmegtekintések' },
  { pattern: /facebook-domain-verification/i, name: 'Facebook Domain Verification', purpose: 'Facebook hirdetési domain hitelesítés', collected_data: 'Domain tulajdonjog, hirdetési teljesítmény adatok' },
]

// ─── HTTP header alapú tracker detektálás (ÚJ RÉTEG) ─────────────────────────
// Sok tracker server-side headert is beállít (pl. Cloudflare, Shopify)

const HEADER_TRACKERS: { header: string; value: RegExp; name: string; purpose: string; collected_data: string }[] = [
  { header: 'server', value: /cloudflare/i, name: 'Cloudflare', purpose: 'CDN, biztonság és teljesítményoptimalizálás', collected_data: 'IP-cím, HTTP fejlécek, teljesítmény metrikák' },
  { header: 'x-powered-by', value: /shopify/i, name: 'Shopify', purpose: 'E-kereskedelmi platform', collected_data: 'Vásárlói adatok, rendelési adatok, számlázási cím' },
  { header: 'x-shopify-stage', value: /.+/, name: 'Shopify', purpose: 'E-kereskedelmi platform', collected_data: 'Vásárlói adatok, rendelési adatok, számlázási cím' },
  { header: 'x-wix-request-id', value: /.+/, name: 'Wix', purpose: 'Weboldal platform és analitika', collected_data: 'Látogatói adatok, munkamenet adatok' },
  { header: 'x-squarespace-served-by', value: /.+/, name: 'Squarespace', purpose: 'Weboldal platform', collected_data: 'Látogatói adatok, munkamenet adatok' },
  { header: 'x-drupal-cache', value: /.+/, name: 'Drupal CMS', purpose: 'Tartalomkezelő rendszer', collected_data: 'Munkamenet adatok, felhasználói azonosítók' },
  { header: 'x-generator', value: /wordpress/i, name: 'WordPress', purpose: 'Tartalomkezelő rendszer', collected_data: 'Munkamenet adatok, komment adatok, felhasználói adatok' },
  { header: 'set-cookie', value: /_ga|_gid/i, name: 'Google Analytics', purpose: 'Látogatottsági analitika', collected_data: 'IP-cím, böngésző adatok, oldalmegtekintések, munkamenet adatok' },
  { header: 'set-cookie', value: /hjsession|hjid/i, name: 'Hotjar', purpose: 'Felhasználói viselkedés elemzés (hőtérkép, felvétel)', collected_data: 'Egérmozgás, kattintások, munkamenet felvételek' },
  { header: 'set-cookie', value: /intercom/i, name: 'Intercom', purpose: 'Ügyfélszolgálati chat és CRM', collected_data: 'Név, e-mail cím, üzenetek tartalma, munkamenet adatok' },
  { header: 'set-cookie', value: /hubspot|hstc|hssc/i, name: 'HubSpot', purpose: 'CRM és marketing automatizáció', collected_data: 'E-mail cím, viselkedési adatok, kapcsolatfelvételi adatok' },
  { header: 'x-content-type-options', value: /.+/, name: 'Biztonsági HTTP fejlécek', purpose: 'Böngésző biztonsági házirendek', collected_data: 'Nincs személyes adat gyűjtés' },
]

// ─── Form mező minták ─────────────────────────────────────────────────────────

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
  { pattern: /username|felhasznalonev|login/i, data: 'Felhasználónév', purpose: 'Fiók azonosítás és bejelentkezés' },
  { pattern: /gender|nem|ferfi|no|male|female/i, data: 'Nem / Nemi azonosság', purpose: 'Személyre szabás, statisztika' },
  { pattern: /newsletter|hirlevel|feliratkozas|subscribe/i, data: 'Hírlevél feliratkozás', purpose: 'E-mail marketing, tájékoztatás' },
  { pattern: /subject|targy|tema/i, data: 'Üzenet tárgya', purpose: 'Kapcsolatfelvétel, ügyfélszolgálat' },
]

// ─── Segédfüggvények ──────────────────────────────────────────────────────────

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

// Prioritás URL-ek — ezeken van a legtöbb tracker és form
function isPriorityPath(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase()
  return /kapcsolat|contact|rendeles|order|checkout|fizet|payment|regisztr|register|signup|login|bejelent|cart|kosar|newsletter|hirlevel|demo|ajanlat|quote/.test(path)
}

// ─── HTTP header elemzés (ÚJ) ─────────────────────────────────────────────────

function analyzeHeaders(
  headers: Headers,
  allTrackers: Map<string, typeof KNOWN_TRACKERS[number]>
) {
  for (const { header, value, name, purpose, collected_data } of HEADER_TRACKERS) {
    const headerVal = headers.get(header) || ''
    if (value.test(headerVal) && !allTrackers.has(name)) {
      allTrackers.set(name, { pattern: value, name, purpose, collected_data })
    }
  }
}

// ─── Sitemap + robots.txt URL gyűjtés (ÚJ: párhuzamos) ───────────────────────

async function getDiscoveryUrls(baseUrl: string): Promise<string[]> {
  const urls: string[] = []
  const origin = new URL(baseUrl).origin

  // Párhuzamosan kérjük le a sitemap és robots.txt fájlokat
  const [sitemapResult, robotsResult] = await Promise.allSettled([
    fetchSitemapUrls(origin, baseUrl),
    fetchRobotsUrls(origin, baseUrl),
  ])

  if (sitemapResult.status === 'fulfilled') urls.push(...sitemapResult.value)
  if (robotsResult.status === 'fulfilled') urls.push(...robotsResult.value)

  // Egyedi URL-ek, prioritásos oldalak előre
  const unique = [...new Set(urls)]
  return [
    ...unique.filter(u => isPriorityPath(u)),
    ...unique.filter(u => !isPriorityPath(u)),
  ].slice(0, 80)
}

async function fetchSitemapUrls(origin: string, baseUrl: string): Promise<string[]> {
  const urls: string[] = []
  const candidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]

  for (const sitemapUrl of candidates) {
    try {
      const res = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 DataKomp Scanner' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const xml = await res.text()
      const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]

      for (const m of matches) {
        const loc = m[1].trim()
        if (loc.endsWith('.xml')) {
          // Al-sitemap rekurzív olvasása
          try {
            const subRes = await fetch(loc, {
              headers: { 'User-Agent': 'Mozilla/5.0 DataKomp Scanner' },
              signal: AbortSignal.timeout(6000),
            })
            if (subRes.ok) {
              const subXml = await subRes.text()
              const subMatches = [...subXml.matchAll(/<loc>(.*?)<\/loc>/gi)]
              for (const sm of subMatches) {
                const subLoc = sm[1].trim()
                if (!subLoc.endsWith('.xml') && isSameDomain(subLoc, baseUrl)) {
                  urls.push(subLoc)
                }
              }
            }
          } catch { /* továbblépünk */ }
        } else if (isSameDomain(loc, baseUrl)) {
          urls.push(loc)
        }
      }
      if (urls.length > 0) break
    } catch { /* továbblépünk */ }
  }

  return urls
}

async function fetchRobotsUrls(origin: string, baseUrl: string): Promise<string[]> {
  const urls: string[] = []
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return urls
    const text = await res.text()

    // robots.txt-ben lévő Sitemap: direktívák
    const sitemapMatches = [...text.matchAll(/^Sitemap:\s*(.+)$/gim)]
    for (const m of sitemapMatches) {
      const sitemapUrl = m[1].trim()
      try {
        const sRes = await fetch(sitemapUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 DataKomp Scanner' },
          signal: AbortSignal.timeout(6000),
        })
        if (sRes.ok) {
          const xml = await sRes.text()
          const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]
          for (const l of locs) {
            const loc = l[1].trim()
            if (!loc.endsWith('.xml') && isSameDomain(loc, baseUrl)) {
              urls.push(loc)
            }
          }
        }
      } catch { /* továbblépünk */ }
    }
  } catch { /* továbblépünk */ }
  return urls
}

// ─── Egyetlen oldal szkennelése ───────────────────────────────────────────────

async function scanPage(url: string) {
  const trackers: typeof KNOWN_TRACKERS = []
  const formFields: typeof FORM_FIELD_PATTERNS = []
  const links: string[] = []
  let responseHeaders: Headers | null = null

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
    })

    responseHeaders = res.headers

    if (!res.ok) return { trackers, formFields, links, headers: responseHeaders }
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) return { trackers, formFields, links, headers: responseHeaders }

    const html = await res.text()
    const $ = cheerio.load(html)

    // Script src-ek és tartalmak
    const scriptSrcs: string[] = []
    const scriptContents: string[] = []
    $('script').each((_, el) => {
      const src = $(el).attr('src')
      if (src) scriptSrcs.push(src)
      const content = $(el).html()
      if (content) scriptContents.push(content)
    })

    // Script trackerek
    for (const tracker of KNOWN_TRACKERS) {
      const found =
        scriptSrcs.some(s => tracker.pattern.test(s)) ||
        scriptContents.some(s => tracker.pattern.test(s)) ||
        tracker.pattern.test(html)
      if (found && !trackers.find(t => t.name === tracker.name)) {
        trackers.push(tracker)
      }
    }

    // Meta tag trackerek
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || ''
      const content = $(el).attr('content') || ''
      const combined = `${name} ${content}`
      for (const tracker of META_TRACKERS) {
        if (tracker.pattern.test(combined) && !trackers.find(t => t.name === tracker.name)) {
          trackers.push(tracker)
        }
      }
    })

    // noscript blokkok (GTM, Facebook Pixel)
    $('noscript').each((_, el) => {
      const content = $(el).html() || ''
      for (const tracker of KNOWN_TRACKERS) {
        if (tracker.pattern.test(content) && !trackers.find(t => t.name === tracker.name)) {
          trackers.push(tracker)
        }
      }
    })

    // Form mezők — label szövege + attribútumok
    $('input, textarea, select').each((_, el) => {
      const inputId = $(el).attr('id') || ''
      const labelText = inputId ? $(`label[for="${inputId}"]`).text() : ''
      const combined = [
        $(el).attr('name') || '',
        inputId,
        $(el).attr('placeholder') || '',
        $(el).attr('type') || '',
        $(el).attr('autocomplete') || '',
        labelText,
        $(el).closest('form').attr('action') || '',
      ].join(' ')

      for (const field of FORM_FIELD_PATTERNS) {
        if (field.pattern.test(combined) && !formFields.find(f => f.data === field.data)) {
          formFields.push(field)
        }
      }
    })

    // Link gyűjtés a crawl-hoz
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
    // timeout vagy hálózati hiba
  }

  return { trackers, formFields, links, headers: responseHeaders }
}

// ─── Mély szkennelés ──────────────────────────────────────────────────────────

async function deepScan(startUrl: string, maxDepth = 3, maxPages = 60) {
  const visited = new Set<string>()
  const allTrackers = new Map<string, typeof KNOWN_TRACKERS[number]>()
  const allFormFields = new Map<string, typeof FORM_FIELD_PATTERNS[number]>()

  // Discovery URL-ek (sitemap + robots.txt) párhuzamosan
  const discoveryUrls = await getDiscoveryUrls(startUrl)

  // Prioritásos oldalak előre, utána a crawl-ból jövők
  const queue: { url: string; depth: number }[] = [
    { url: startUrl, depth: 0 },
    ...discoveryUrls.map(u => ({ url: u, depth: 1 })),
  ]

  // Globális 90 másodperces timeout
  const deadline = Date.now() + 90_000

  while (queue.length > 0 && visited.size < maxPages && Date.now() < deadline) {
    // Párhuzamos feldolgozás: egyszerre max 5 oldal (ÚJ)
    const batch = queue.splice(0, 5)
    const results = await Promise.allSettled(
      batch.map(async item => {
        const cleanUrl = item.url.split('?')[0]
        if (visited.has(cleanUrl)) return null
        visited.add(cleanUrl)
        const result = await scanPage(item.url)
        return { ...result, depth: item.depth, url: item.url }
      })
    )

    for (const result of results) {
      if (result.status !== 'fulfilled' || !result.value) continue
      const { trackers, formFields, links, headers, depth, url } = result.value

      for (const t of trackers) allTrackers.set(t.name, t)
      for (const f of formFields) allFormFields.set(f.data, f)

      // HTTP header elemzés az első oldalon (ÚJ)
      if (url === startUrl && headers) {
        analyzeHeaders(headers, allTrackers)
      }

      // Prioritásos linkek előre a sorban
      if (depth < maxDepth) {
        const newLinks = links
          .map(l => ({ url: l, depth: depth + 1 }))
          .filter(l => !visited.has(l.url.split('?')[0]))

        const priorityLinks = newLinks.filter(l => isPriorityPath(l.url))
        const normalLinks = newLinks.filter(l => !isPriorityPath(l.url))

        queue.unshift(...priorityLinks)
        queue.push(...normalLinks)
      }
    }
  }

  return {
    trackers: Array.from(allTrackers.values()),
    formFields: Array.from(allFormFields.values()),
    pagesScanned: visited.size,
  }
}

// ─── Fő belépési pont ─────────────────────────────────────────────────────────

export async function runScanner(websiteId: string, url: string) {
  const supabase = await createClient()

  try {
    const { trackers, formFields, pagesScanned } = await deepScan(url)

    // Pending scanned rekordok törlése (az aktívakat megtartjuk)
    await supabase
      .from('systems')
      .delete()
      .eq('website_id', websiteId)
      .eq('source_type', 'scanned')
      .eq('status', 'pending')

    // Már aktív scanned rekordok (duplikáció elkerülése)
    const { data: activeSystems } = await supabase
      .from('systems')
      .select('system_name, collected_data')
      .eq('website_id', websiteId)
      .eq('source_type', 'scanned')
      .eq('status', 'active')

    const activeNames = new Set(activeSystems?.map(s => s.system_name) ?? [])
    const activeData = new Set(activeSystems?.map(s => s.collected_data) ?? [])

    // Manuális rendszerek (nem duplikálunk)
    const { data: manualSystems } = await supabase
      .from('systems')
      .select('purpose, collected_data')
      .eq('website_id', websiteId)
      .eq('source_type', 'manual')

    const siteName = url.replace(/^https?:\/\//, '').split('/')[0]

    for (const tracker of trackers) {
      if (activeNames.has(tracker.name)) continue
      const existsManually = manualSystems?.some(
        m =>
          m.purpose?.toLowerCase().includes(tracker.purpose.toLowerCase()) ||
          m.collected_data?.toLowerCase().includes(tracker.name.toLowerCase())
      )
      if (!existsManually) {
        await supabase.from('systems').insert({
          website_id: websiteId,
          system_name: tracker.name,
          purpose: tracker.purpose,
          collected_data: tracker.collected_data,
          status: 'pending',
          source_type: 'scanned',
        })
      }
    }

    for (const field of formFields) {
      if (activeData.has(field.data)) continue
      const existsManually = manualSystems?.some(m =>
        m.collected_data?.toLowerCase().includes(field.data.toLowerCase())
      )
      if (!existsManually) {
        await supabase.from('systems').insert({
          website_id: websiteId,
          system_name: `${siteName} – Webes űrlap`,
          purpose: field.purpose,
          collected_data: field.data,
          status: 'pending',
          source_type: 'scanned',
        })
      }
    }

    await supabase
      .from('websites')
      .update({
        status: 'verified',
        last_scanned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', websiteId)

    console.log(`✅ Scanner kész: ${pagesScanned} oldal, ${trackers.length} tracker, ${formFields.length} form mező`)
  } catch (err) {
    console.error('Scanner hiba:', err)
    await supabase
      .from('websites')
      .update({ status: 'verified', updated_at: new Date().toISOString() })
      .eq('id', websiteId)
  }
}