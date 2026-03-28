'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

export default function MyPage() {
  const router = useRouter()
  const [artist, setArtist] = useState<any>(null)
  const [theaterName, setTheaterName] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [allUpcoming, setAllUpcoming] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: artistData }, { data: ut }] = await Promise.all([
        supabase.from('artists').select('*').eq('email', user.email).maybeSingle(),
        supabase.from('user_theaters').select('theaters(name)').eq('user_id', user.id).maybeSingle(),
      ])

      setTheaterName((ut as any)?.theaters?.name || '')

      if (!artistData) { setNotFound(true); setLoading(false); return }
      setArtist(artistData)
      setLoading(false)

      const { data: upcoming } = await supabase
        .from('events')
        .select('*, venues(name), event_artists!inner(artist_id)')
        .eq('event_artists.artist_id', artistData.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(10)
      setAllUpcoming(upcoming || [])
    }
    init()
  }, [router])

  useEffect(() => {
    if (!artist) return
    const from = new Date(year, month, 1).toISOString()
    const to = new Date(year, month + 1, 0, 23, 59).toISOString()
    supabase
      .from('events')
      .select('*, venues(name), event_artists!inner(artist_id)')
      .eq('event_artists.artist_id', artist.id)
      .gte('start_time', from)
      .lte('start_time', to)
      .order('start_time')
      .then(({ data }) => setEvents(data || []))
  }, [artist, month, year])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`
  }
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const today = new Date()
  const in3days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
  const soonEvents = allUpcoming.filter(e => new Date(e.start_time) <= in3days)
  const upcoming = events.filter(e => new Date(e.start_time) >= today)
  const past = events.filter(e => new Date(e.start_time) < today)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1E1756', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#FFFFFF', fontSize: 16 }}>Загрузка...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#F7F6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>Профиль артиста не найден</div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Ваш email не совпадает ни с одним артистом.<br />Обратитесь к администратору театра.</div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#534AB7', color: '#FFF', fontSize: 14, cursor: 'pointer' }}>
          Выйти
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1E1756', padding: '0 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: 1 }}>СЦЕНА</div>
            <div style={{ fontSize: 11, color: '#9B96D4', marginTop: 2 }}>Личный кабинет</div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            style={{ fontSize: 12, color: '#9B96D4', background: 'none', border: '1px solid #2D2580', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>
            Выйти
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>

        {/* Notification banner — events within 3 days */}
        {soonEvents.length > 0 && (
          <div style={{ background: '#FFF8E6', border: '1px solid #F0C040', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8B6000', marginBottom: 8 }}>
              🔔 Ближайшие события (в течение 3 дней)
            </div>
            {soonEvents.map(ev => (
              <div key={ev.id} style={{ fontSize: 13, color: '#5A4000', padding: '4px 0', borderTop: '1px solid #F0D070' }}>
                <span style={{ fontWeight: 500 }}>{ev.title}</span>
                {' · '}
                {formatDate(ev.start_time)}, {formatTime(ev.start_time)}
                {ev.venues?.name && ` · ${ev.venues.name}`}
              </div>
            ))}
          </div>
        )}

        {/* Artist card */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #EBEBF0', padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#FFFFFF', flexShrink: 0, overflow: 'hidden' }}>
            {artist?.avatar_url
              ? <img src={artist.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : artist?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{artist?.full_name}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{artist?.role || 'Артист'}{theaterName ? ` · ${theaterName}` : ''}</div>
          </div>
        </div>

        {/* Month nav */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center' }}>
          <button onClick={prevMonth} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>{MONTHS_FULL[month]} {year}</div>
          <button onClick={nextMonth} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>›</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Всего', value: events.length },
            { label: 'Спектаклей', value: events.filter(e => e.type === 'performance').length },
            { label: 'Репетиций', value: events.filter(e => e.type === 'rehearsal').length },
          ].map(s => (
            <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #EBEBF0', padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#534AB7' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Events */}
        {events.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', padding: '48px 24px', textAlign: 'center', color: '#BBB', fontSize: 14 }}>
            Нет событий в {MONTHS_FULL[month]}
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Предстоящие</div>
                {upcoming.map(ev => {
                  const isSoon = new Date(ev.start_time) <= in3days
                  return (
                    <div key={ev.id} style={{ background: '#FFFFFF', borderRadius: 12, border: `1px solid ${isSoon ? '#F0C040' : '#EBEBF0'}`, padding: '14px 16px', marginBottom: 10, borderLeft: `4px solid ${ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e', flex: 1 }}>{ev.title}</div>
                        {isSoon && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: '#FFF0C0', color: '#8B6000', fontWeight: 600 }}>СКОРО</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                        📅 {formatDate(ev.start_time)} · {formatTime(ev.start_time)}–{formatTime(ev.end_time)}
                      </div>
                      {ev.venues?.name && <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>📍 {ev.venues.name}</div>}
                      <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, padding: '2px 9px', borderRadius: 10, background: ev.type === 'rehearsal' ? '#E1F5EE' : '#EEEDFE', color: ev.type === 'rehearsal' ? '#085041' : '#3C3489', fontWeight: 500 }}>
                        {ev.type === 'rehearsal' ? 'Репетиция' : 'Спектакль'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {past.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Прошедшие</div>
                {past.map(ev => (
                  <div key={ev.id} style={{ background: '#FAFAFA', borderRadius: 12, border: '1px solid #EBEBF0', padding: '14px 16px', marginBottom: 10, opacity: 0.7 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#555' }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      {formatDate(ev.start_time)} · {formatTime(ev.start_time)}–{formatTime(ev.end_time)}
                      {ev.venues?.name && ` · ${ev.venues.name}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
