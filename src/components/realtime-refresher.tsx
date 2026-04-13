'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function RealtimeRefresher() {
  const router = useRouter()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const wasScanning = useRef(false)
  const realtimeActiveRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Polling függvény — csak akkor indul el, ha a Realtime nem érhető el
    const startPolling = () => {
      if (pollingRef.current) return // már fut
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
          wasScanning.current = false
          router.refresh()
        }
      }, 10000) // 10 másodperc
    }

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    // Realtime csatorna — fő frissítési mechanizmus
    const channel = supabase
      .channel('websites-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'websites' },
        () => {
          router.refresh()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Realtime él — lehetne polling-ot leállítani, de a scanning-figyelest megőrizzük
          realtimeActiveRef.current = true
          stopPolling() // ha előzőleg futott fallback, leállítjuk
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Realtime nem elérhető — fallback polling indul
          realtimeActiveRef.current = false
          startPolling()
        }
      })

    return () => {
      supabase.removeChannel(channel)
      stopPolling()
    }
  }, [router])

  return null
}
