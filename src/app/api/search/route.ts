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

  const { data: allWebsites } = await supabase
    .from('websites').select('id').eq('company_id', company.id)
  const websiteIds = allWebsites?.map(w => w.id) ?? []

  const { data: websites } = await supabase
    .from('websites')
    .select('id, url, status')
    .eq('company_id', company.id)
    .ilike('url', `%${q}%`)
    .limit(8)

  const { data: systems } = websiteIds.length > 0
    ? await supabase
        .from('systems')
        .select('id, system_name, website_id, collected_data')
        .in('website_id', websiteIds)
        .or(`system_name.ilike.%${q}%,collected_data.ilike.%${q}%,purpose.ilike.%${q}%`)
        .limit(6)
    : { data: [] }

  // process_system_links.system_id = website_id, ezért websiteIds alapján kérjük le
  // majd szervezeti egységeket gyűjtjük website_id-nként
  let websiteDeptMap: Record<string, string[]> = {}

  if (websiteIds.length > 0) {
    const { data: links } = await supabase
      .from('process_system_links')
      .select('system_id, process_id')
      .in('system_id', websiteIds)

    if (links && links.length > 0) {
      const processIds = [...new Set(links.map((l: any) => l.process_id))]

      const { data: processes } = await supabase
        .from('data_processes')
        .select('id, department_name')
        .in('id', processIds)

      const deptById: Record<string, string> = {}
      ;(processes ?? []).forEach((p: any) => {
        deptById[p.id] = p.department_name
      })

      links.forEach((link: any) => {
        if (!websiteDeptMap[link.system_id]) websiteDeptMap[link.system_id] = []
        const dept = deptById[link.process_id]
        if (dept && !websiteDeptMap[link.system_id].includes(dept)) {
          websiteDeptMap[link.system_id].push(dept)
        }
      })
    }
  }

  const results = [
    ...(websites || []).map(w => ({
      type: 'website' as const,
      id: w.id,
      label: w.url.replace(/^https?:\/\//, ''),
      sub: w.status === 'offline' ? 'Belső rendszer' : 'Weboldal',
      departments: [] as string[],
    })),
    ...(systems || []).map(s => {
      const depts = websiteDeptMap[s.website_id] ?? []
      return {
        type: 'system' as const,
        id: s.website_id,
        label: s.system_name,
        sub: s.collected_data || 'Nincs részlet',
        departments: depts,
      }
    }),
  ]

  return NextResponse.json(results)
}