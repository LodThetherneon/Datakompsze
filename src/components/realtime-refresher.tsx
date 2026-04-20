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

    const startPolling = () => {
      if (pollingRef.current) return
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
      }, 3000) // 10s → 3s
    }

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    // Websites változás figyelése (státusz: scanning → active)
    const websitesChannel = supabase
      .channel('websites-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'websites' },
        (payload) => {
          // Csak akkor refresh ha scanning → active átmenet történt
          if (payload.old?.status === 'scanning' && payload.new?.status !== 'scanning') {
            router.refresh()
          } else {
            router.refresh()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeActiveRef.current = true
          stopPolling()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          realtimeActiveRef.current = false
          startPolling()
        }
      })

    // Systems tábla figyelése — új scan eredmény azonnal triggereli a refresht
    const systemsChannel = supabase
      .channel('systems-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'systems' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(websitesChannel)
      supabase.removeChannel(systemsChannel)
      stopPolling()
    }
  }, [router])

  return null
}