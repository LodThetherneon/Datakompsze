import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('id', id)
    .single()

  if (!policy) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // @ts-ignore
  const HTMLtoDOCX = (await import('html-to-docx')).default

  const docxBuffer = await HTMLtoDOCX(policy.content_html, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  })

  const siteName = policy.content_html.match(/<strong>(.*?)<\/strong>/)?.[1] || 'tajekoztato'
  const fileName = `adatkezelesi_tajekoztato_v${policy.version}.docx`

  return new NextResponse(docxBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}