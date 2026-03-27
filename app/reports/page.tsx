'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [events, setEvents] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const from = new Date(year, 0, 1).toISOString()
    const to = new Date(year, 11, 31, 23, 59).toISOString()
    supabase
      .from('events')
      .select('*, event_artists(artist_id, artists(full_name))')
      .gte('start_time', from)
      .lte('start_time', to)
      .then(({ data }) => setEvents(data || []))
    supabase.from('artists').select('*, event_artists(event_id)').then(({ data }) => setArtists(data || []))
  }, [year])

  // Stats by month
  const byMonth = MONTHS_FULL.map((name, i) => {
    const monthEvs = events.filter(e => new Date(e.start_time).getMonth() === i)
    return {
      name,
      total: monthEvs.length,
      performances: monthEvs.filter(e => e.type === 'performance').length,
      rehearsals: monthEvs.filter(e => e.type === 'rehearsal').length,
    }
  })

  const maxTotal = Math.max(...byMonth.map(m => m.total), 1)

  // Artist load
  const artistLoad = artists.map(a => ({
    name: a.full_name,
    role: a.role,
    count: events.filter(e => e.event_artists?.some((ea: any) => ea.artist_id === a.id)).length,
  })).sort((a, b) => b.count - a.count)

  const totalPerf = events.filter(e => e.type === 'performance').length
  const totalReh = events.filter(e => e.type === 'rehearsal').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif' }}>
      {!isMobile && (
        <div style={{ width: 220, background: '#1E1756', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2D2580' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', letterSpacing: 1 }}>СЦЕНА</div>
            <div style={{ fontSize: 11, color: '#9B96D4', marginTop: 4 }}>Система управления</div>
          </div>
          {[
            { label: 'Расписание', href: '/' },
            { label: 'Артисты', href: '/artists' },
            { label: 'Гастроли', href: '/tours' },
            { label: 'Площадки', href: '/venues' },
            { label: 'Отчёты', href: '/reports', active: true },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '11px 20px', fontSize: 13, cursor: 'pointer', marginTop: 2, color: item.active ? '#FFFFFF' : '#9B96D4', background: item.active ? '#2D2580' : 'transparent', borderLeft: item.active ? '3px solid #7F77DD' : '3px solid transparent', fontWeight: item.active ? 500 : 400 }}>
                {item.label}
              </div>
            </Link>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: '16px 20px', fontSize: 12, color: '#9B96D4', borderTop: '1px solid #2D2580' }}>
            <div style={{ fontWeight: 500, color: '#FFFFFF' }}>Театр мимики и жеста (ТМЖ)</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EBEBF0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && <Link href="/" style={{ color: '#534AB7', textDecoration: 'none', fontSize: 20 }}>←</Link>}
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Статистика и отчёты</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setYear(y => y - 1)} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#534AB7' }}>‹</button>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e', minWidth: 48, textAlign: 'center' }}>{year}</span>
            <button onClick={() => setYear(y => y + 1)} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#534AB7' }}>›</button>
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Всего событий', value: events.length, color: '#534AB7' },
              { label: 'Спектаклей', value: totalPerf, color: '#1D9E75' },
              { label: 'Репетиций', value: totalReh, color: '#D85A30' },
              { label: 'Артистов в труппе', value: artists.length, color: '#185FA5' },
            ].map(s => (
              <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', padding: '16px 18px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bar chart by month */}
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #EBEBF0', padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 20 }}>События по месяцам</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
              {byMonth.map((m, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: m.total > 0 ? 600 : 400, color: m.total > 0 ? '#534AB7' : '#CCC' }}>
                    {m.total > 0 ? m.total : ''}
                  </div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 100 }}>
                    <div style={{ width: '100%', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                      {m.performances > 0 && (
                        <div style={{ height: Math.round((m.performances / maxTotal) * 80), background: '#534AB7', minHeight: m.performances > 0 ? 4 : 0 }} title={`Спектаклей: ${m.performances}`} />
                      )}
                      {m.rehearsals > 0 && (
                        <div style={{ height: Math.round((m.rehearsals / maxTotal) * 80), background: '#1D9E75', minHeight: m.rehearsals > 0 ? 4 : 0 }} title={`Репетиций: ${m.rehearsals}`} />
                      )}
                      {m.total === 0 && (
                        <div style={{ height: 4, background: '#F0F0F5', borderRadius: 2 }} />
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: isMobile ? 8 : 10, color: '#999', textAlign: 'center' }}>
                    {isMobile ? m.name.slice(0, 1) : m.name.slice(0, 3)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#534AB7' }} />Спектакли
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#1D9E75' }} />Репетиции
              </div>
            </div>
          </div>

          {/* Artist load table */}
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #EBEBF0', padding: '20px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 16 }}>Занятость артистов</div>
            {artistLoad.length === 0 ? (
              <div style={{ color: '#BBB', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Нет данных</div>
            ) : (
              <div>
                {artistLoad.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < artistLoad.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#534AB7', '#1D9E75', '#D85A30', '#BA7517', '#185FA5'][i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#FFF', flexShrink: 0 }}>
                      {a.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{a.role || 'Артист'}</div>
                    </div>
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: '#F0F0F5', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#534AB7', borderRadius: 4, width: `${Math.round((a.count / (artistLoad[0]?.count || 1)) * 100)}%`, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#534AB7', minWidth: 32, textAlign: 'right' }}>{a.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
