import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export default async function PolicyPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div style={{padding:40,fontFamily:'Arial'}}>Nincs jogosultság. Kérlek lépj be!</div>

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: policy } = await serviceClient
    .from('policies')
    .select('content_html, version, updated_at')
    .eq('id', id)
    .single()

  if (!policy) notFound()

  const updatedDate = policy.updated_at
    ? new Date(policy.updated_at).toLocaleDateString('hu-HU')
    : new Date().toLocaleDateString('hu-HU')
  const docId = id.slice(0, 8).toUpperCase()

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #fff; color: #1a1a2e; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.7; }
    .page-wrapper { max-width: 760px; margin: 0 auto; padding: 40px 50px; }
    .print-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #2563eb; margin-bottom: 30px; }
    .print-brand { font-size: 14pt; font-weight: 700; color: #2563eb; }
    .print-meta { text-align: right; font-size: 9pt; color: #64748b; line-height: 1.8; }
    .doc-title { font-size: 22pt; font-weight: 700; color: #1e3a8a; margin-bottom: 4px; }
    .doc-sub { font-size: 10pt; color: #64748b; margin-bottom: 32px; }
    h1 { font-size: 15pt; font-weight: 700; color: #1e3a8a; margin-top: 30px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #bfdbfe; }
    h2 { font-size: 12pt; font-weight: 600; color: #1e40af; margin-top: 22px; margin-bottom: 8px; }
    h3 { font-size: 11pt; font-weight: 600; color: #1d4ed8; margin-top: 14px; margin-bottom: 6px; }
    p { margin-bottom: 10px; text-align: justify; }
    ul, ol { margin: 8px 0 12px 24px; }
    li { margin-bottom: 4px; }
    strong, b { font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 10pt; }
    th { background: #1e3a8a; color: #fff; padding: 8px 11px; text-align: left; font-weight: 600; }
    td { padding: 7px 11px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .print-footer { margin-top: 44px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 8.5pt; color: #94a3b8; display: flex; justify-content: space-between; }
    .no-print { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; gap: 8px; }
    .btn-print { background: #2563eb; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: Arial, sans-serif; }
    .btn-close { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: Arial, sans-serif; }
    @media print {
      .no-print { display: none !important; }
      body { font-size: 10.5pt; }
      .page-wrapper { padding: 0; max-width: 100%; }
      @page { margin: 15mm 15mm 20mm 15mm; size: A4; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="no-print">
        <button className="btn-print" onClick={() => (window as any).print()}>\u2b07 Ment\u00e9s PDF-k\u00e9nt</button>
        <button className="btn-close" onClick={() => (window as any).close()}>\u2715 Bez\u00e1r\u00e1s</button>
      </div>
      <div className="page-wrapper">
        <div className="print-header">
          <div className="print-brand">DataKomp</div>
          <div className="print-meta">
            Verzi\u00f3: v{policy.version}<br />
            D\u00e1tum: {updatedDate}<br />
            ID: {docId}
          </div>
        </div>
        <div className="doc-title">Adatkezel\u00e9si T\u00e1j\u00e9koztat\u00f3</div>
        <div className="doc-sub">Hat\u00e1lyos verzi\u00f3 \u2013 v{policy.version}</div>
        <div dangerouslySetInnerHTML={{ __html: policy.content_html }} />
        <div className="print-footer">
          <span>DataKomp \u2013 Adatkezel\u00e9si T\u00e1j\u00e9koztat\u00f3 v{policy.version}</span>
          <span>Gener\u00e1lva: {new Date().toLocaleDateString('hu-HU')}</span>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelector('.btn-print') && document.querySelector('.btn-print').addEventListener('click', function() { window.print(); });
        document.querySelector('.btn-close') && document.querySelector('.btn-close').addEventListener('click', function() { window.close(); });
      ` }} />
    </>
  )
}
