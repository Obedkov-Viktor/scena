'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import EventForm from './components/EventForm'

export default function Home() {
  const [events, setEvents] = useState<any[]>([])

  const loadEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*, venues(name)')
      .order('start_time')
    setEvents(data || [])
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '1.5rem', color: '#1a1a1a', fontSize: '1.5rem', fontWeight: 600 }}>
        Расписание — Сцена
      </h1>

      <EventForm onSuccess={loadEvents} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '700px' }}>
        {events.map(event => (
          <div key={event.id} style={{
            border: '1px solid #e0e0e0', borderRadius: '12px',
            padding: '1rem 1.25rem',
            background: event.type === 'rehearsal' ? '#E1F5EE' : '#EEEDFE'
          }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>{event.title}</div>
            <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>
              {new Date(event.start_time).toLocaleString('ru-RU', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
              })}
              {event.venues?.name && ` · ${event.venues.name}`}
            </div>
            <div style={{
              fontSize: '0.75rem', marginTop: '8px',
              background: event.type === 'rehearsal' ? '#085041' : '#3C3489',
              color: 'white', display: 'inline-block', padding: '2px 10px', borderRadius: '10px'
            }}>
              {event.type === 'rehearsal' ? 'Репетиция' : event.type === 'performance' ? 'Спектакль' : 'Другое'}
            </div>
            {event.description && (
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '6px' }}>{event.description}</div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}