import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

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

  let browser
  const isVercel = !!process.env.VERCEL

  if (isVercel) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  } else {
    const puppeteer = (await import('puppeteer')).default
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  try {
    const page = await browser.newPage()

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (isVercel ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    await page.goto(`${baseUrl}/api/policies/${id}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size:9px; color:#888; width:100%; text-align:center; padding:0 15mm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`,
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
