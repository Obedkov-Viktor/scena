'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ArtistPicker({ eventId, onClose }: { eventId: string, onClose: () => void }) {
  const [artists, setArtists] = useState<any[]>([])
  const [assigned, setAssigned] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('artists').select('*').order('full_name').then(({ data }) => setArtists(data || []))
    supabase.from('event_artists').select('artist_id').eq('event_id', eventId).then(({ data }) => {
      setAssigned((data || []).map((r: any) => r.artist_id))
    })
  }, [eventId])

  const toggle = async (artistId: string) => {
    setLoading(true)
    const isAssigned = assigned.includes(artistId)
    await fetch('/api/event-artists', {
      method: isAssigned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, artist_id: artistId })
    })
    setAssigned(prev => isAssigned ? prev.filter(id => id !== artistId) : [...prev, artistId])
    setLoading(false)
  }

  const initials = (name: string) => name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['#534AB7', '#1D9E75', '#D85A30', '#BA7517', '#185FA5']
  const colorFor = (i: number) => colors[i % colors.length]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 24, width: 420, maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Назначить артистов</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {artists.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#BBB', padding: '24px 0', fontSize: 14 }}>
            Нет артистов. Сначала добавьте артистов на странице Артисты.
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {artists.map((artist, i) => {
              const isAssigned = assigned.includes(artist.id)
              return (
                <div key={artist.id} onClick={() => !loading && toggle(artist.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer', background: isAssigned ? '#F0FBF6' : '#FAFAFA', border: `1.5px solid ${isAssigned ? '#1D9E75' : '#EBEBF0'}`, transition: 'all 0.15s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: colorFor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#FFFFFF', flexShrink: 0 }}>
                    {initials(artist.full_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: '#1a1a2e' }}>{artist.full_name}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{artist.role || 'Роль не указана'}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: isAssigned ? '#1D9E75' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isAssigned && <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#888' }}>Назначено: {assigned.length}</span>
          <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: '#534AB7', color: '#FFF', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Готово</button>
        </div>
      </div>
    </div>
  )
}