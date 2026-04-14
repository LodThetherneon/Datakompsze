import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const maxDuration = 30

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  <title>Adatkezelési Tájékoztató v${policy.version}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.7; color: #1a1a2e; background: #fff; }
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
    strong, b { font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
    th { background: #1e3a8a; color: #fff; padding: 9px 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 8.5pt; color: #94a3b8; display: flex; justify-content: space-between; }
    /* Print gomb - csak képernyőn látszik */
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1e3a8a; color: #fff; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; font-family: Arial, sans-serif; font-size: 10pt; z-index: 9999; }
    .print-bar button { background: #fff; color: #1e3a8a; border: none; padding: 6px 18px; border-radius: 6px; font-weight: 700; font-size: 10pt; cursor: pointer; }
    .print-bar button:hover { background: #e0e7ff; }
    body { padding-top: 50px; }
    @media print {
      .print-bar { display: none !important; }
      body { padding-top: 0; }
      @page { margin: 15mm 15mm 20mm 15mm; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>Adatkezelési Tájékoztató v${policy.version} &mdash; Mentés PDF-ként: Nyomtatás &rarr; Mentés PDF-ként</span>
    <button onclick="window.print()">&#128438; Nyomtatás / PDF mentés</button>
  </div>
  <div class="page-wrapper">
    <div class="header">
      <div class="header-brand">DataKomp</div>
      <div class="header-meta">Verzió: v${policy.version}<br>Dátum: ${updatedDate}<br>ID: ${docId}</div>
    </div>
    <div class="doc-title">Adatkezelési Tájékoztató</div>
    <div class="doc-subtitle">Hatályos verzió &mdash; v${policy.version}</div>
    ${policy.content_html}
    <div class="footer">
      <span>DataKomp &mdash; Adatkezelési Tájékoztató v${policy.version}</span>
      <span>Generálva: ${generatedDate}</span>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
