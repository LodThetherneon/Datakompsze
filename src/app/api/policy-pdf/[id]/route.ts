import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 60

// v133 chromium pack — v131 brotli bin path bug-ot javítja Vercelen
const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: policy } = await supabase
    .from('policies')
    .select('version')
    .eq('id', id)
    .single()

  if (!policy) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const chromium = (await import('@sparticuz/chromium-min')).default
  const puppeteer = (await import('puppeteer-core')).default

  const isVercel = !!process.env.VERCEL

  let executablePath: string
  if (isVercel) {
    executablePath = await chromium.executablePath(CHROMIUM_URL)
  } else if (process.platform === 'darwin') {
    executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  } else {
    executablePath = '/usr/bin/google-chrome'
  }

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
    ],
    executablePath,
    defaultViewport: { width: 1280, height: 900 },
    headless: true,
  })

  try {
    const page = await browser.newPage()

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (isVercel ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    await page.goto(`${baseUrl}/api/policies/${id}`, {
      waitUntil: 'networkidle0',
      timeout: 45000,
    })

    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '20mm', left: '0mm', right: '0mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        '<div style="font-size:8px; color:#94a3b8; width:100%; text-align:center; font-family:Arial,sans-serif; padding: 0 15mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
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
