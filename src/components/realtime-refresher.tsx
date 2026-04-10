'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function RealtimeRefresher() {
  const router = useRouter()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const wasScanning = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Realtime figyelő — ha a websites tábla változik
    const channel = supabase
      .channel('websites-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'websites' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Polling fallback — 3 másodpercenként ellenőrzi van-e scanning státuszú oldal
    const startPolling = () => {
      pollingRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('websites')
          .select('id')
          .eq('status', 'scanning')
          .limit(1)

        const isScanning = (data?.length ?? 0) > 0

        if (isScanning) {
          wasScanning.current = true
        } else if (wasScanning.current) {
          // Volt scanning, most már nincs → frissítünk
          wasScanning.current = false
          router.refresh()
        }
      }, 3000)
    }

    startPolling()

    return () => {
      supabase.removeChannel(channel)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [router])

  return null
}