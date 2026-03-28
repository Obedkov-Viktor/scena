'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function PrintPage() {
  const searchParams = useSearchParams()
  const today = new Date()
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : today.getFullYear()
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : today.getMonth()

  const [events, setEvents] = useState<any[]>([])
  const [theaterName, setTheaterName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const from = new Date(year, month, 1).toISOString()
      const to = new Date(year, month + 1, 0, 23, 59).toISOString()

      const [{ data: evs }, { data: ut }] = await Promise.all([
        supabase.from('events')
          .select('*, venues(name), event_artists(artist_id, artists(full_name))')
          .gte('start_time', from).lte('start_time', to).order('start_time'),
        supabase.from('user_theaters').select('theaters(name)').maybeSingle(),
      ])

      setEvents(evs || [])
      setTheaterName((ut as any)?.theaters?.name || 'Театр')
      setLoading(false)
    }
    load()
  }, [year, month])

  useEffect(() => {
    if (!loading && events.length > 0) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [loading, events.length])

  const byDay = useMemo(() => {
    const map: Record<number, typeof events> = {}
    for (const ev of events) {
      const d = new Date(ev.start_time).getDate()
      if (!map[d]) map[d] = []
      map[d].push(ev)
    }
    return map
  }, [events])

  const typeLabel = (t: string) =>
    t === 'rehearsal' ? 'Репетиция' : t === 'performance' ? 'Спектакль' : 'Другое'

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const dayOfWeek = (day: number) =>
    DAYS_RU[(new Date(year, month, day).getDay() + 6) % 7]

  const sortedDays = useMemo(() => Object.keys(byDay).map(Number).sort((a, b) => a - b), [byDay])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', color: '#888' }}>
      Загрузка...
    </div>
  )

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { margin: 15mm; size: A4; }
        }
        body { font-family: system-ui, sans-serif; color: #1a1a1a; background: white; }
      `}</style>

      <button className="no-print" onClick={() => window.print()} style={{
        position: 'fixed', top: 16, right: 16, zIndex: 999,
        background: '#534AB7', color: '#FFFFFF', border: 'none',
        borderRadius: 8, padding: '8px 18px', fontSize: 13,
        fontWeight: 500, cursor: 'pointer'
      }}>
        Печать / PDF
      </button>

      <button className="no-print" onClick={() => window.history.back()} style={{
        position: 'fixed', top: 16, left: 16, zIndex: 999,
        background: '#F0F0F5', color: '#534AB7', border: 'none',
        borderRadius: 8, padding: '8px 18px', fontSize: 13,
        fontWeight: 500, cursor: 'pointer'
      }}>
        ← Назад
      </button>

      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 16, borderBottom: '2px solid #1E1756' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1E1756', letterSpacing: 1 }}>СЦЕНА</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{theaterName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>Расписание</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{MONTHS_RU[month]} {year}</div>
          </div>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '48px 0', fontSize: 15 }}>
            Нет событий в {MONTHS_RU[month]} {year}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1E1756', color: '#FFFFFF' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Дата</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>День</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Событие</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Тип</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Время</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Площадка</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Артисты</th>
              </tr>
            </thead>
            <tbody>
              {sortedDays.map(day =>
                byDay[day].map((ev, i) => (
                  <tr key={ev.id} style={{ background: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF', borderBottom: '1px solid #E0E0E0' }}>
                    {i === 0 && (
                      <td rowSpan={byDay[day].length} style={{ padding: '10px 12px', fontWeight: 600, color: '#1E1756', verticalAlign: 'top', borderRight: '1px solid #E0E0E0' }}>
                        {day}
                      </td>
                    )}
                    {i === 0 && (
                      <td rowSpan={byDay[day].length} style={{ padding: '10px 12px', color: '#666', verticalAlign: 'top', borderRight: '1px solid #E0E0E0' }}>
                        {dayOfWeek(day)}
                      </td>
                    )}
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{ev.title}</td>
                    <td style={{ padding: '10px 12px', color: ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7' }}>
                      {typeLabel(ev.type)}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {formatTime(ev.start_time)}–{formatTime(ev.end_time)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#666' }}>
                      {ev.venues?.name || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#444', fontSize: 12 }}>
                      {ev.event_artists?.map((ea: any) => ea.artists?.full_name).filter(Boolean).join(', ') || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
          <span>Всего: {events.length} · Спектаклей: {events.reduce((n, e) => n + (e.type === 'performance' ? 1 : 0), 0)} · Репетиций: {events.reduce((n, e) => n + (e.type === 'rehearsal' ? 1 : 0), 0)}</span>
          <span>scena-woad.vercel.app · {new Date().toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    </>
  )
}
