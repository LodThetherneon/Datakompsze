import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun,
  BorderStyle, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType,
  Header, Footer, ImageRun,
} from 'docx'
import { parse } from 'node-html-parser'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

function htmlToDocxChildren(html: string): (Paragraph | Table)[] {
  const root = parse(html)
  const result: (Paragraph | Table)[] = []

  const pageContents = root.querySelectorAll('.page-content')
  const nodes = pageContents.length > 0
    ? pageContents.flatMap(pc => [...pc.childNodes])
    : [...(root.querySelector('body')?.childNodes ?? root.childNodes)]

  for (const node of nodes) {
    const tag = (node as any).tagName?.toLowerCase()

    if (tag === 'div') {
      const cls = (node as any).classNames ?? ''
      if (cls.includes('doc-title')) {
        const h1 = (node as any).querySelector('h1')
        const sub = (node as any).querySelector('.sub')
        if (h1) {
          result.push(new Paragraph({
            children: [new TextRun({ text: h1.text.trim(), bold: true, size: 32, font: 'Calibri', color: '0f172a' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }))
        }
        if (sub) {
          result.push(new Paragraph({
            children: [new TextRun({ text: sub.text.trim(), bold: true, size: 26, font: 'Calibri', color: '0f172a' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }))
        }
      }
      continue
    }

    if (tag === 'h1') {
      result.push(new Paragraph({
        children: [new TextRun({ text: node.text.trim(), bold: true, size: 32, font: 'Calibri', color: '0f172a' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }))
    } else if (tag === 'h2') {
      result.push(new Paragraph({
        children: [new TextRun({ text: node.text.trim(), bold: true, size: 22, font: 'Calibri', color: '1a1a1a' })],
        spacing: { before: 280, after: 80 },
      }))
    } else if (tag === 'h3') {
      result.push(new Paragraph({
        children: [new TextRun({ text: node.text.trim(), bold: true, italics: true, size: 22, font: 'Calibri', color: '1a1a1a' })],
        spacing: { before: 160, after: 60 },
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
              shading: { type: ShadingType.SOLID, color: '1a3a6b' },
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

const DOCX_WIDTH_PX = 697
const ORIG_IMG_W    = 900
const HEADER_H_ORIG = 165
const FOOTER_H_ORIG = 114

/**
 * Betölti a szechenyi-bg.png képet.
 * 1. fs.readFileSync – lokális fejlesztésben (gyors, megbízható)
 * 2. fetch fallback  – Vercel és egyéb hosted környezetekben
 */
async function loadSzechenyiBg(): Promise<Buffer> {
  const filePath = path.join(process.cwd(), 'public', 'szechenyi-bg.png')

  // 1. fs próba – lokálban mindig működik
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath)
    }
  } catch {
    // fs nem elérhető → fetch fallback
  }

  // 2. fetch fallback – Vercel / hosting
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const res = await fetch(`${baseUrl}/szechenyi-bg.png`)
  if (!res.ok) throw new Error(`Kép betöltés sikertelen: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
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

  // ─── Fejléc / lábléc kép előkészítése ────────────────────────────────────
  let headerSection: Header
  let footerSection: Footer

  try {
    const imgBuffer = await loadSzechenyiBg()

    const headerImgBuf = await sharp(imgBuffer)
      .extract({ left: 0, top: 0, width: ORIG_IMG_W, height: HEADER_H_ORIG })
      .resize({ width: DOCX_WIDTH_PX })
      .png()
      .toBuffer()

    const footerImgBuf = await sharp(imgBuffer)
      .extract({ left: 0, top: 1273 - FOOTER_H_ORIG, width: ORIG_IMG_W, height: FOOTER_H_ORIG })
      .resize({ width: DOCX_WIDTH_PX })
      .png()
      .toBuffer()

    const headerScaledH = Math.round((HEADER_H_ORIG / ORIG_IMG_W) * DOCX_WIDTH_PX)
    const footerScaledH = Math.round((FOOTER_H_ORIG / ORIG_IMG_W) * DOCX_WIDTH_PX)

    headerSection = new Header({
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: headerImgBuf,
              transformation: { width: DOCX_WIDTH_PX, height: headerScaledH },
              type: 'png',
            }),
          ],
          spacing: { before: 0, after: 0 },
        }),
      ],
    })

    footerSection = new Footer({
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: footerImgBuf,
              transformation: { width: DOCX_WIDTH_PX, height: footerScaledH },
              type: 'png',
            }),
          ],
          spacing: { before: 0, after: 0 },
        }),
      ],
    })
  } catch (err) {
    console.error('Széchenyi háttérkép betöltése sikertelen, szöveges fallback:', err)

    headerSection = new Header({
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'SZÉCHENYI ISTVÁN EGYETEM', bold: true, size: 24, font: 'Calibri', color: '1a3a6b' })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    })
    footerSection = new Footer({
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'SZÉCHENYI ISTVÁN EGYETEM  |  9026 GYŐR, EGYETEM TÉR 1.  |  UNI.SZE.HU', size: 16, font: 'Calibri', color: '555555' })],
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'dddddd' } },
        }),
      ],
    })
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
        },
      },
      headers: { default: headerSection },
      footers: { default: footerSection },
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