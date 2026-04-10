import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, BorderStyle, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType,
} from 'docx'
import { parse } from 'node-html-parser'

function htmlToDocxChildren(html: string): (Paragraph | Table)[] {
  const root = parse(html)
  const result: (Paragraph | Table)[] = []

  for (const node of root.querySelector('body')?.childNodes ?? root.childNodes) {
    const tag = (node as any).tagName?.toLowerCase()

    if (tag === 'h1') {
      result.push(new Paragraph({
        children: [new TextRun({ text: node.text.trim(), bold: true, size: 40, font: 'Calibri', color: '0f172a' })],
        spacing: { after: 200 },
      }))
    } else if (tag === 'h2') {
      result.push(new Paragraph({
        text: node.text.trim(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e2e8f0' } },
      }))
    } else if (tag === 'p') {
      const text = node.text.trim()
      if (!text) continue
      result.push(new Paragraph({
        children: [new TextRun({ text, size: 22, font: 'Calibri' })],
        spacing: { after: 80 },
      }))
    } else if (tag === 'ul' || tag === 'ol') {
      for (const li of (node as any).querySelectorAll('li')) {
        result.push(new Paragraph({
          children: [new TextRun({ text: `• ${li.text.trim()}`, size: 22, font: 'Calibri' })],
          spacing: { after: 60 },
          indent: { left: 400 },
        }))
      }
    } else if (tag === 'table') {
      const rows: TableRow[] = []

      const headerCells = (node as any).querySelectorAll('thead th')
      if (headerCells.length > 0) {
        rows.push(new TableRow({
          children: headerCells.map((th: any) =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: th.text.trim(), bold: true, size: 18, font: 'Calibri', color: 'ffffff' })],
              })],
              shading: { type: ShadingType.SOLID, color: '334155' },
              width: { size: Math.floor(9000 / headerCells.length), type: WidthType.DXA },
            })
          ),
          tableHeader: true,
        }))
      }

      for (const tr of (node as any).querySelectorAll('tbody tr')) {
        const cells = tr.querySelectorAll('td')
        if (cells.length === 0) continue
        rows.push(new TableRow({
          children: cells.map((td: any) =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: td.text.trim(), size: 18, font: 'Calibri' })],
              })],
              width: { size: Math.floor(9000 / cells.length), type: WidthType.DXA },
            })
          ),
        }))
      }

      if (rows.length > 0) {
        result.push(new Table({
          rows,
          width: { size: 9000, type: WidthType.DXA },
        }))
        result.push(new Paragraph({ text: '', spacing: { after: 200 } }))
      }
    }
  }

  return result
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('id', id)
    .single()

  if (!policy) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const children = htmlToDocxChildren(policy.content_html)

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
        },
      },
      children,
    }],
  })

  const uint8 = await Packer.toBuffer(doc)
  const buffer = Buffer.from(uint8)
  const fileName = `adatkezelesi_tajekoztato_v${policy.version}.docx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}