import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  if (q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) return NextResponse.json([])

  const { data: websites } = await supabase
    .from('websites')
    .select('id, url, status')
    .eq('company_id', company.id)
    .ilike('url', `%${q}%`)
    .limit(8)

  const { data: systems } = await supabase
    .from('systems')
    .select('id, system_name, website_id, collected_data')
    .in('website_id',
      (await supabase.from('websites').select('id').eq('company_id', company.id))
        .data?.map(w => w.id) ?? []
    )
    .or(`system_name.ilike.%${q}%,collected_data.ilike.%${q}%,purpose.ilike.%${q}%`)
    .limit(6)

  const results = [
    ...(websites || []).map(w => ({
      type: 'website' as const,
      id: w.id,
      label: w.url.replace(/^https?:\/\//, ''),
      sub: w.status === 'offline' ? 'Belső rendszer' : 'Weboldal',
    })),
    ...(systems || []).map(s => ({
      type: 'system' as const,
      id: s.website_id,
      label: s.system_name,
      sub: s.collected_data,
    })),
  ]

  return NextResponse.json(results)
}