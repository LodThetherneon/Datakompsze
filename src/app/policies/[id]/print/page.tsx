import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export default async function PolicyPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('id', id)
    .single()

  if (!policy) notFound()

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => window.print()' }} />
      <div dangerouslySetInnerHTML={{ __html: policy.content_html }} />
    </>
  )
}