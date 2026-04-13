import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { websiteId, url } = body

    if (!websiteId || !url) {
      return NextResponse.json({ error: 'Hiányzó paraméterek' }, { status: 400 })
    }

    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scan-website`

    // Fire-and-forget: elindítjuk az Edge Function-t, de NEM várjuk meg a válaszát.
    // A Supabase Edge Function fut a háttérben és maga frissíti a DB-t.
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ websiteId, url }),
    }).catch(err => console.error('Scan Edge Function hiba:', err))

    return NextResponse.json({ ok: true, message: 'Szkennelés elindítva' })
  } catch (err) {
    console.error('Scan proxy hiba:', err)
    return NextResponse.json({ error: 'Scanner hiba' }, { status: 500 })
  }
}
