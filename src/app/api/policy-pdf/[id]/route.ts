import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Service role klienssel olvassuk az adatot (bypass RLS)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: policy } = await serviceClient
    .from('policies')
    .select('content_html, version, updated_at')
    .eq('id', id)
    .single()

  if (!policy) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updatedDate = policy.updated_at
    ? new Date(policy.updated_at).toLocaleDateString('hu-HU')
    : new Date().toLocaleDateString('hu-HU')
  const generatedDate = new Date().toLocaleDateString('hu-HU')
  const docId = id.slice(0, 8).toUpperCase()

  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <title>Adatkezelesi Tajekoztato</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.7; color: #1a1a2e; background: #ffffff; }
    .page-wrapper { max-width: 760px; margin: 0 auto; padding: 40px 50px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #2563eb; margin-bottom: 32px; }
    .header-brand { font-size: 13pt; font-weight: 700; color: #2563eb; }
    .header-meta { text-align: right; font-size: 9pt; color: #64748b; line-height: 1.6; }
    .doc-title { font-size: 22pt; font-weight: 700; color: #1e3a8a; margin-bottom: 6px; }
    .doc-subtitle { font-size: 10pt; color: #64748b; margin-bottom: 36px; }
    h1 { font-size: 16pt; font-weight: 700; color: #1e3a8a; margin-top: 32px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #bfdbfe; }
    h2 { font-size: 13pt; font-weight: 600; color: #1e40af; margin-top: 24px; margin-bottom: 8px; }
    h3 { font-size: 11pt; font-weight: 600; color: #1d4ed8; margin-top: 16px; margin-bottom: 6px; }
    p { margin-bottom: 10px; text-align: justify; }
    ul, ol { margin: 8px 0 12px 24px; }
    li { margin-bottom: 4px; }
    strong, b { font-weight: 600; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
    th { background: #1e3a8a; color: #ffffff; padding: 9px 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 8.5pt; color: #94a3b8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <div class="header">
      <div class="header-brand">DataKomp</div>
      <div class="header-meta">Verzio: v${policy.version}<br>Datum: ${updatedDate}<br>ID: ${docId}</div>
    </div>
    <div class="doc-title">Adatkezelesi Tajekoztato</div>
    <div class="doc-subtitle">Halyos verzio - v${policy.version}</div>
    ${policy.content_html}
    <div class="footer">
      <span>DataKomp - Adatkezelesi Tajekoztato v${policy.version}</span>
      <span>Generalva: ${generatedDate}</span>
    </div>
  </div>
</body>
</html>`

  const isVercel = !!process.env.VERCEL

  let executablePath: string
  let launchArgs: string[]

  if (isVercel) {
    const chromium = (await import('@sparticuz/chromium-min')).default
    executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
    )
    launchArgs = [
      ...chromium.args,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ]
  } else if (process.platform === 'darwin') {
    executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    launchArgs = ['--no-sandbox', '--disable-setuid-sandbox']
  } else {
    executablePath = '/usr/bin/google-chrome'
    launchArgs = ['--no-sandbox', '--disable-setuid-sandbox']
  }

  const puppeteer = (await import('puppeteer-core')).default

  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath,
    defaultViewport: { width: 1280, height: 900 },
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '20mm', left: '0mm', right: '0mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        '<div style="font-size:8px;color:#94a3b8;width:100%;text-align:center;font-family:Arial,sans-serif;padding:0 15mm"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    })

    const fileName = `adatkezelesi_tajekoztato_v${policy.version}.pdf`

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } finally {
    await browser.close()
  }
}
