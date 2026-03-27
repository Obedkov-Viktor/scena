'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

let cachedTheaterId: string | null = null

export function useTheater() {
  const [theaterId, setTheaterId] = useState<string | null>(cachedTheaterId)
  const [loading, setLoading] = useState(!cachedTheaterId)

  useEffect(() => {
    if (cachedTheaterId) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('user_theaters')
        .select('theater_id')
        .eq('user_id', user.id)
        .maybeSingle()
      cachedTheaterId = data?.theater_id ?? null
      setTheaterId(cachedTheaterId)
      setLoading(false)
    })
  }, [])

  return { theaterId, loading }
}

export function clearTheaterCache() {
  cachedTheaterId = null
}
