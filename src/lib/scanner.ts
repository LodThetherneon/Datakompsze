/**
 * scanner.ts
 * Vercelben a Next.js server action max ~10s alatt timeoutol.
 * Ezért a scan logikát egy Supabase Edge Function végzi (run-scanner),
 * amit itt csak HTTP-n indítunk el — fire & forget.
 */

export async function runScanner(websiteId: string, url: string) {
  const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/run-scanner`
  const secret = process.env.SCANNER_SECRET ?? ''

  try {
    await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-scanner-secret': secret,
      },
      body: JSON.stringify({ websiteId, url }),
    })
  } catch (err) {
    console.error('Edge Function indítási hiba:', err)
  }
}
