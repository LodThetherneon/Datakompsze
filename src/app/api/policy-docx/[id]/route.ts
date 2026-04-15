import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { parse } from 'node-html-parser'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import fs from 'fs'
import path from 'path'

// ─── HTML → DOCX XML konverter ────────────────────────────────────────────────
// Az Open XML namespace-ek
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function makeRun(text: string, opts: { bold?: boolean; size?: number; color?: string; font?: string } = {}): string {
  const { bold = false, size = 22, color = '000000', font = 'Arial' } = opts
  return `<w:r>
    <w:rPr>
      <w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>
      ${bold ? '<w:b/>' : ''}
      <w:sz w:val="${size}"/>
      <w:szCs w:val="${size}"/>
      <w:color w:val="${color}"/>
    </w:rPr>
    <w:t xml:space="preserve">${esc(text)}</w:t>
  </w:r>`
}

function makePara(
  runs: string,
  opts: { align?: string; spaceBefore?: number; spaceAfter?: number; indentLeft?: number } = {}
): string {
  const { align = 'both', spaceBefore = 0, spaceAfter = 80, indentLeft = 0 } = opts
  return `<w:p>
    <w:pPr>
      <w:jc w:val="${align}"/>
      <w:spacing w:before="${spaceBefore}" w:after="${spaceAfter}"/>
      ${indentLeft ? `<w:ind w:left="${indentLeft}"/>` : ''}
    </w:pPr>
    ${runs}
  </w:p>`
}

function makeTableCell(text: string, isHeader: boolean, width: number): string {
  const shading = isHeader
    ? '<w:shd w:val="clear" w:color="auto" w:fill="1a3a6b"/>'
    : ''
  const textColor = isHeader ? 'ffffff' : '000000'
  return `<w:tc>
    <w:tcPr>
      <w:tcW w:w="${width}" w:type="dxa"/>
      ${shading}
      <w:tcBorders>
        <w:top w:val="single" w:sz="4" w:color="cccccc"/>
        <w:left w:val="single" w:sz="4" w:color="cccccc"/>
        <w:bottom w:val="single" w:sz="4" w:color="cccccc"/>
        <w:right w:val="single" w:sz="4" w:color="cccccc"/>
      </w:tcBorders>
    </w:tcPr>
    ${makePara(makeRun(text, { bold: isHeader, size: 18, color: textColor }), { spaceAfter: 40 })}
  </w:tc>`
}

function htmlToOoxml(html: string): string {
  const root = parse(html)
  let xml = ''

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
          xml += makePara(makeRun(h1.text.trim(), { bold: true, size: 28, color: '0f172a' }), { align: 'center', spaceAfter: 100 })
        }
        if (sub) {
          xml += makePara(makeRun(sub.text.trim(), { bold: true, size: 24, color: '0f172a' }), { align: 'center', spaceAfter: 300 })
        }
      }
      continue
    }

    if (!tag) continue

    if (tag === 'h1') {
      xml += makePara(makeRun(node.text.trim(), { bold: true, size: 28, color: '0f172a' }), { align: 'center', spaceAfter: 200 })
    } else if (tag === 'h2') {
      xml += makePara(makeRun(node.text.trim(), { bold: true, size: 22, color: '1a1a1a' }), { spaceBefore: 280, spaceAfter: 80 })
    } else if (tag === 'h3') {
      xml += makePara(makeRun(node.text.trim(), { bold: true, size: 22, color: '1a1a1a' }), { spaceBefore: 160, spaceAfter: 60 })
    } else if (tag === 'p') {
      const text = node.text.trim()
      if (!text) continue
      xml += makePara(makeRun(text, { size: 22 }), { spaceAfter: 80 })
    } else if (tag === 'ul' || tag === 'ol') {
      for (const li of (node as any).querySelectorAll('li')) {
        xml += makePara(makeRun(`• ${li.text.trim()}`, { size: 22 }), { spaceAfter: 60, indentLeft: 400 })
      }
    } else if (tag === 'table') {
      const headerCells = (node as any).querySelectorAll('thead th')
      const bodyRows = (node as any).querySelectorAll('tbody tr')
      if (headerCells.length === 0 && bodyRows.length === 0) continue

      const colCount = headerCells.length || (bodyRows[0]?.querySelectorAll('td').length ?? 1)
      const colW = Math.floor(9000 / colCount)

      let tableXml = `<w:tbl>
        <w:tblPr>
          <w:tblW w:w="9000" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:color="cccccc"/>
            <w:left w:val="single" w:sz="4" w:color="cccccc"/>
            <w:bottom w:val="single" w:sz="4" w:color="cccccc"/>
            <w:right w:val="single" w:sz="4" w:color="cccccc"/>
            <w:insideH w:val="single" w:sz="4" w:color="cccccc"/>
            <w:insideV w:val="single" w:sz="4" w:color="cccccc"/>
          </w:tblBorders>
        </w:tblPr>`

      if (headerCells.length > 0) {
        tableXml += `<w:tr><w:trPr><w:tblHeader/></w:trPr>`
        for (const th of headerCells) {
          tableXml += makeTableCell(th.text.trim(), true, colW)
        }
        tableXml += `</w:tr>`
      }

      for (const tr of bodyRows) {
        const cells = tr.querySelectorAll('td')
        if (cells.length === 0) continue
        tableXml += `<w:tr>`
        for (const td of cells) {
          tableXml += makeTableCell(td.text.trim(), false, Math.floor(9000 / cells.length))
        }
        tableXml += `</w:tr>`
      }

      tableXml += `</w:tbl>`
      xml += tableXml
      xml += makePara('', { spaceAfter: 200 })
    }
  }

  return xml
}

// ─── Template betöltése ────────────────────────────────────────────────────────
async function loadTemplate(): Promise<Buffer> {
  const filePath = path.join(process.cwd(), 'public', 'szechenyi-bg-template.docx')

  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath)
    }
  } catch { /* folytatás fetch-csel */ }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const res = await fetch(`${baseUrl}/szechenyi-bg-template.docx`)
  if (!res.ok) throw new Error(`Template betöltés sikertelen: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// ─── Fő document.xml csere ZIP-ben ────────────────────────────────────────────
function buildDocumentXml(bodyXml: string, zip: PizZip): string {
  // Az eredeti document.xml-ből kinyerjük a sectPr-t (oldalbeállítások, fejléc/lábléc hivatkozások)
  const originalDocXml = zip.file('word/document.xml')!.asText()

  // Kinyerjük az eredeti sectPr-t (tartalmazza a headerReference és footerReference elemeket)
  const sectPrMatch = originalDocXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/)
  const sectPr = sectPrMatch ? sectPrMatch[0] : `<w:sectPr>
    <w:pgSz w:w="11906" w:h="16838"/>
    <w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="57" w:gutter="0"/>
  </w:sectPr>`

  // Kinyerjük az eredeti XML namespace deklarációkat
  const nsMatch = originalDocXml.match(/<w:document[^>]*>/)
  const nsDecl = nsMatch ? nsMatch[0] : '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
${nsDecl}
  <w:body>
    ${bodyXml}
    ${sectPr}
  </w:body>
</w:document>`
}

// ─── GET handler ──────────────────────────────────────────────────────────────
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

  // 1. Template betöltése
  const templateBuf = await loadTemplate()

  // 2. ZIP megnyitása
  const zip = new PizZip(templateBuf)

  // 3. HTML → OOXML konverzió
  const bodyXml = htmlToOoxml(policy.content_html)

  // 4. Új document.xml összeállítása (megőrzi az eredeti fejléc/lábléc hivatkozásokat!)
  const newDocXml = buildDocumentXml(bodyXml, zip)

  // 5. ZIP-be visszaírás
  zip.file('word/document.xml', newDocXml)

  // 6. Kimenet generálása
  const outputBuf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })

  const fileName = `adatkezelesi_tajekoztato_v${policy.version}.docx`

  return new NextResponse(new Uint8Array(outputBuf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}