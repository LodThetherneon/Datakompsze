import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    });
    return new NextResponse('Server configuration error', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: policy, error } = await supabase
    .from('policies')
    .select('content_html, version')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return new NextResponse('Database error: ' + error.message, { status: 500 });
  }

  if (!policy) {
    return new NextResponse('Not found', { status: 404 });
  }

  const generatedDate = new Date().toLocaleDateString('hu-HU');
  const docId = id.slice(0, 8).toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adatkezelesi Tajekoztato</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.7; color: #1a1a2e; background: #ffffff; }
    .page-wrapper { max-width: 760px; margin: 0 auto; padding: 40px 50px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #2563eb; margin-bottom: 32px; }
    .header-brand { font-size: 13pt; font-weight: 700; color: #2563eb; letter-spacing: -0.3px; }
    .header-meta { text-align: right; font-size: 9pt; color: #64748b; line-height: 1.6; }
    .doc-title { font-size: 22pt; font-weight: 700; color: #1e3a8a; margin-bottom: 6px; line-height: 1.2; }
    .doc-subtitle { font-size: 10pt; color: #64748b; margin-bottom: 36px; }
    h1 { font-size: 16pt; font-weight: 700; color: #1e3a8a; margin-top: 32px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #bfdbfe; }
    h2 { font-size: 13pt; font-weight: 600; color: #1e40af; margin-top: 24px; margin-bottom: 8px; }
    h3 { font-size: 11pt; font-weight: 600; color: #1d4ed8; margin-top: 16px; margin-bottom: 6px; }
    p { margin-bottom: 10px; text-align: justify; }
    ul, ol { margin: 8px 0 12px 24px; }
    li { margin-bottom: 4px; }
    strong, b { font-weight: 600; color: #0f172a; }
    a { color: #2563eb; text-decoration: none; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
    th { background: #1e3a8a; color: #ffffff; padding: 9px 12px; text-align: left; font-weight: 600; font-size: 9.5pt; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 8.5pt; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } table { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <div class="header">
      <div class="header-brand">DataKomp</div>
      <div class="header-meta">Verzio: v${policy.version}<br>Datum: ${generatedDate}<br>Dokumentum ID: ${docId}</div>
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
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
