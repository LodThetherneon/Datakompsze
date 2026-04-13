import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { websiteId, url } = body

    if (!websiteId || !url) {
      return NextResponse.json({ error: 'Hiányzó paraméterek' }, { status: 400 })
    }

    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scan-website`

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ websiteId, url }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Scan proxy hiba:', err)
    return NextResponse.json({ error: 'Scanner hiba' }, { status: 500 })
  }
}
