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

  // 1. lépés: websites id lista és url keresés egyszerre fut
  const [allWebsitesResult, websitesSearchResult] = await Promise.all([
    supabase
      .from('websites')
      .select('id')
      .eq('company_id', company.id),
    supabase
      .from('websites')
      .select('id, url, status')
      .eq('company_id', company.id)
      .ilike('url', `%${q}%`)
      .limit(8),
  ])

  const websiteIds = allWebsitesResult.data?.map((w: { id: string }) => w.id) ?? []
  const websites = websitesSearchResult.data

  // 2. lépés: systems keresés párhuzamosan a process_system_links-szel
  const [systemsResult, linksResult] = await Promise.all([
    websiteIds.length > 0
      ? supabase
          .from('systems')
          .select('id, system_name, website_id, collected_data')
          .in('website_id', websiteIds)
          .or(`system_name.ilike.%${q}%,collected_data.ilike.%${q}%,purpose.ilike.%${q}%`)
          .limit(6)
      : Promise.resolve({ data: [] }),
    websiteIds.length > 0
      ? supabase
          .from('process_system_links')
          .select('system_id, process_id')
          .in('system_id', websiteIds)
      : Promise.resolve({ data: [] }),
  ])

  const systems = systemsResult.data
  const links = linksResult.data

  // 3. lépés: departments feloldása – process id-k alapján
  let websiteDeptMap: Record<string, string[]> = {}

  if (links && links.length > 0) {
    const processIds = [...new Set(links.map((l: { process_id: string }) => l.process_id))]

    const { data: processes } = await supabase
      .from('data_processes')
      .select('id, department_name')
      .in('id', processIds)

    const deptById: Record<string, string> = {}
    ;(processes ?? []).forEach((p: { id: string; department_name: string }) => {
      deptById[p.id] = p.department_name
    })

    links.forEach((link: { system_id: string; process_id: string }) => {
      if (!websiteDeptMap[link.system_id]) websiteDeptMap[link.system_id] = []
      const dept = deptById[link.process_id]
      if (dept && !websiteDeptMap[link.system_id].includes(dept)) {
        websiteDeptMap[link.system_id].push(dept)
      }
    })
  }

  const results = [
    ...(websites || []).map((w: { id: string; url: string; status: string }) => ({
      type: 'website' as const,
      id: w.id,
      label: w.url.replace(/^https?:\/\//, ''),
      sub: w.status === 'offline' ? 'Belső rendszer' : 'Weboldal',
      departments: [] as string[],
    })),
    ...(systems || []).map((s: { id: string; system_name: string; website_id: string; collected_data: string }) => {
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
