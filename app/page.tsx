'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheater } from '@/lib/useTheater'
import { Sidebar, MobileNav } from '@/app/components/Sidebar'
import Link from 'next/link'
import ArtistPicker from './components/ArtistPicker'

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']


function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDay = (first.getDay() + 6) % 7
  const days: (number | null)[] = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let i = 1; i <= last.getDate(); i++) days.push(i)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

const emptyForm = { title: '', type: 'performance', venue_id: '', start_time: '', end_time: '', description: '' }

function toLocalInput(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Landing() {
  const features = [
    { icon: '📅', title: 'Расписание', desc: 'Календарь спектаклей и репетиций по месяцам и неделям' },
    { icon: '👥', title: 'Артисты', desc: 'Профили, роли, занятость и назначение на события' },
    { icon: '🎭', title: 'Репертуар', desc: 'Каталог спектаклей с составом труппы' },
    { icon: '✈️', title: 'Гастроли', desc: 'Планирование выездных показов и поездок' },
    { icon: '🏛️', title: 'Площадки', desc: 'Управление залами и вместимостью' },
    { icon: '📊', title: 'Отчёты', desc: 'Статистика занятости и активности театра' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#1E1756', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid #2D2580' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', letterSpacing: 2 }}>СЦЕНА</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/login" style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #534AB7', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Войти</a>
          <a href="/register" style={{ padding: '8px 20px', borderRadius: 8, background: '#534AB7', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Зарегистрировать театр</a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 40px 60px' }}>
        <div style={{ fontSize: 13, color: '#7F77DD', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Система управления театром</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: '#FFFFFF', margin: '0 0 20px', lineHeight: 1.15 }}>
          Всё расписание театра —<br />в одном месте
        </h1>
        <p style={{ fontSize: 18, color: '#9B96D4', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Управляйте спектаклями, артистами и гастролями. Без Excel, без путаницы.
        </p>
        <a href="/register" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 12, background: '#534AB7', color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 24px rgba(83,74,183,0.4)' }}>
          Начать бесплатно →
        </a>
        <div style={{ marginTop: 14, fontSize: 13, color: '#6B67A8' }}>Бесплатно · Без кредитной карты · Готово за 2 минуты</div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#2D2580', borderRadius: 12, padding: '24px 20px' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#9B96D4', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '0 40px 80px' }}>
        <div style={{ background: '#2D2580', borderRadius: 16, padding: '48px 40px', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Готовы попробовать?</div>
          <div style={{ fontSize: 14, color: '#9B96D4', marginBottom: 28 }}>Зарегистрируйте театр и начните пользоваться прямо сейчас</div>
          <a href="/register" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: 10, background: '#534AB7', color: '#FFFFFF', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>
            Зарегистрировать театр
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #2D2580', padding: '20px 40px', textAlign: 'center', fontSize: 12, color: '#6B67A8' }}>
        СЦЕНА — система управления театром · 2026
      </div>
    </div>
  )
}

export default function Home() {
  const today = new Date()
  const { theaterId } = useTheater()
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(today.getDate())
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ events: any[], artists: any[] } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [artistPickerEventId, setArtistPickerEventId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    const day = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - day)
    d.setHours(0,0,0,0)
    return d
  })
  const getWeekDays = (start: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }
  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  const [mobileTab, setMobileTab] = useState<'calendar' | 'events' | 'artists'>('calendar')


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const load = useCallback(async () => {
    const from = new Date(year, month, 1).toISOString()
    const to = new Date(year, month + 1, 0, 23, 59).toISOString()
    const { data } = await supabase.from('events').select('*, venues(name), event_artists(artist_id, artists(full_name))').gte('start_time', from).lte('start_time', to).order('start_time')
    setEvents(data || [])
  }, [year, month])

  useEffect(() => { load() }, [load])
  useEffect(() => { supabase.from('venues').select('*').then(({ data }) => setVenues(data || [])) }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return }
    setSearchLoading(true)
    const [{ data: evs }, { data: arts }] = await Promise.all([
      supabase.from('events').select('*, venues(name)').ilike('title', `%${q}%`).order('start_time').limit(8),
      supabase.from('artists').select('*').ilike('full_name', `%${q}%`).limit(8),
    ])
    setSearchResults({ events: evs || [], artists: arts || [] })
    setSearchLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery, doSearch])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1); setSelected(null) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1); setSelected(null) }

  const eventsOnDay = (day: number) => events.filter(e => new Date(e.start_time).getDate() === day)
  const selectedEvents = selected ? eventsOnDay(selected) : []
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const openNew = () => {
    setEditingId(null)
    const pad = (n: number) => String(n).padStart(2, '0')
    const base = selected ? `${year}-${pad(month + 1)}-${pad(selected)}T19:00` : ''
    setForm({ ...emptyForm, start_time: base, end_time: base ? base.replace('19:00', '22:00') : '' })
    setShowForm(true)
  }

  const openEdit = (ev: any) => {
    setEditingId(ev.id)
    setForm({ title: ev.title, type: ev.type, venue_id: ev.venue_id || '', start_time: toLocalInput(ev.start_time), end_time: toLocalInput(ev.end_time), description: ev.description || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const startDt = new Date(form.start_time)
    let endDt = new Date(form.end_time)
    if (endDt <= startDt) endDt.setDate(endDt.getDate() + 1) // ночные события (00:00–03:00)
    const payload = {
      title: form.title,
      type: form.type,
      venue_id: form.venue_id || null,
      start_time: startDt.toISOString(),
      end_time: endDt.toISOString(),
      description: form.description || null,
    }
    if (editingId) {
      await supabase.from('events').update(payload).eq('id', editingId)
    } else {
      await supabase.from('events').insert([{ ...payload, theater_id: theaterId }])
    }
    setLoading(false); setShowForm(false); setEditingId(null); setForm(emptyForm); load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('events').delete().eq('id', id)
    setDeleteConfirm(null); load()
  }

  const days = getCalendarDays(year, month)
  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }


  const WeekBlock = () => {
    const weekDays = getWeekDays(weekStart)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEvents = events.filter(e => {
      const d = new Date(e.start_time)
      return d >= weekStart && d <= weekEnd
    })

    return (
      <div style={{ background: '#FFFFFF', borderRadius: isMobile ? 0 : 12, border: isMobile ? 'none' : '1px solid #EBEBF0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #EBEBF0' }}>
          <button onClick={prevWeek} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>
            {weekStart.getDate()} {MONTHS_RU[weekStart.getMonth()]} — {weekEnd.getDate()} {MONTHS_RU[weekEnd.getMonth()]} {weekEnd.getFullYear()}
          </div>
          <button onClick={nextWeek} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekDays.map((day, i) => {
            const tod = day.toDateString() === today.toDateString()
            const sel = selected === day.getDate() && month === day.getMonth() && year === day.getFullYear()
            const dayEvs = weekEvents.filter(e => new Date(e.start_time).toDateString() === day.toDateString())
            return (
              <div key={i} style={{ borderRight: i < 6 ? '1px solid #F0F0F5' : 'none' }}>
                <div onClick={() => { setSelected(day.getDate()); setMonth(day.getMonth()); setYear(day.getFullYear()) }}
                  style={{ padding: '8px 6px', textAlign: 'center', cursor: 'pointer', background: sel ? '#EEEDFE' : tod ? '#F5F3FF' : '#FAFAFA', borderBottom: '1px solid #EBEBF0' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{DAYS_RU[i]}</div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 13, fontWeight: tod ? 700 : 400, background: tod ? '#534AB7' : 'transparent', color: tod ? '#FFFFFF' : sel ? '#534AB7' : '#1a1a2e' }}>
                    {day.getDate()}
                  </div>
                </div>
                <div style={{ padding: '6px 4px', minHeight: 120 }}>
                  {dayEvs.map(ev => (
                    <div key={ev.id} onClick={() => { setSelected(day.getDate()); setMonth(day.getMonth()); setYear(day.getFullYear()) }}
                      style={{ fontSize: 11, padding: '4px 6px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', background: ev.type === 'rehearsal' ? '#E1F5EE' : '#EEEDFE', color: ev.type === 'rehearsal' ? '#085041' : '#3C3489', borderLeft: `2px solid ${ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7'}` }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      <div style={{ opacity: 0.7, marginTop: 2 }}>
                        {new Date(ev.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {ev.event_artists && ev.event_artists.length > 0 && (
                        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                          {ev.event_artists.slice(0, 3).map((ea: any, j: number) => {
                            const colors = ['#534AB7','#1D9E75','#D85A30','#BA7517','#185FA5']
                            const name = ea.artists?.full_name || ''
                            const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                            return <div key={j} style={{ width: 16, height: 16, borderRadius: '50%', background: colors[j % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600, color: '#FFFFFF' }}>{initials}</div>
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const CalendarBlock = () => (
    <div style={{ background: '#FFFFFF', borderRadius: isMobile ? 0 : 12, border: isMobile ? 'none' : '1px solid #EBEBF0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #EBEBF0' }}>
        <button onClick={prevMonth} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>‹</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>{MONTHS_RU[month]} {year}</div>
        <button onClick={nextMonth} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#FAFAFA' }}>
        {DAYS_RU.map(d => <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 600, color: '#999' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map((day, i) => {
          const dayEvents = day ? eventsOnDay(day) : []
          const sel = day === selected
          const tod = day ? isToday(day) : false
          return (
            <div key={i} onClick={() => { if (day) { setSelected(day); if (isMobile) setMobileTab('events') } }}
              style={{ minHeight: isMobile ? 52 : 68, padding: '5px 6px', borderRight: '1px solid #F0F0F5', borderBottom: '1px solid #F0F0F5', cursor: day ? 'pointer' : 'default', background: sel ? '#EEEDFE' : '#FFFFFF' }}>
              {day && <>
                <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: tod ? 700 : 400, background: tod ? '#534AB7' : 'transparent', color: tod ? '#FFFFFF' : sel ? '#534AB7' : '#1a1a2e', marginBottom: 2 }}>{day}</div>
                {!isMobile && dayEvents.slice(0, 2).map(ev => (
                  <div key={ev.id} style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, marginBottom: 1, background: ev.type === 'rehearsal' ? '#E1F5EE' : '#EEEDFE', color: ev.type === 'rehearsal' ? '#085041' : '#3C3489', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                ))}
                {isMobile && dayEvents.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} style={{ width: 6, height: 6, borderRadius: '50%', background: ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7' }} />
                    ))}
                  </div>
                )}
              </>}
            </div>
          )
        })}
      </div>
    </div>
  )

  const EventsBlock = () => (
    <div style={{ background: '#FFFFFF', borderRadius: isMobile ? 0 : 12, border: isMobile ? 'none' : '1px solid #EBEBF0', overflow: 'hidden', flex: 1 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F5', display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
          {selected ? `${selected} ${MONTHS_RU[month]}` : 'Выберите день'}
        </span>
        {selected && <button onClick={openNew} style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #534AB7', borderRadius: 8, background: '#EEEDFE', cursor: 'pointer', color: '#534AB7', fontWeight: 500 }}>+ Добавить</button>}
      </div>
      <div style={{ padding: 12 }}>
        {selectedEvents.length === 0 ? (
          <div style={{ fontSize: 14, color: '#BBB', textAlign: 'center', padding: '32px 0' }}>
            {selected ? 'Нет событий в этот день' : 'Выберите день в календаре'}
          </div>
        ) : selectedEvents.map(ev => (
          <div key={ev.id} style={{ borderRadius: 10, padding: '12px 14px', marginBottom: 10, background: ev.type === 'rehearsal' ? '#F0FBF6' : '#F5F3FF', borderLeft: `3px solid ${ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {new Date(ev.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(ev.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {ev.venues?.name && ` · ${ev.venues.name}`}
                </div>
                  {ev.event_artists && ev.event_artists.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {ev.event_artists.slice(0, 3).map((ea: any, i: number) => {
                        const colors = ['#534AB7','#1D9E75','#D85A30','#BA7517','#185FA5']
                        const name = ea.artists?.full_name || ''
                        const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                        return (
                          <div key={i} title={name} style={{ width: 22, height: 22, borderRadius: '50%', background: colors[i % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#FFFFFF', flexShrink: 0 }}>
                            {initials}
                          </div>
                        )
                      })}
                      {ev.event_artists.length > 3 && (
                        <div style={{ fontSize: 10, color: '#888' }}>+{ev.event_artists.length - 3}</div>
                      )}
                    </div>
                  )}
                <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, padding: '2px 9px', borderRadius: 10, background: ev.type === 'rehearsal' ? '#E1F5EE' : '#EEEDFE', color: ev.type === 'rehearsal' ? '#085041' : '#3C3489', fontWeight: 500 }}>
                  {ev.type === 'rehearsal' ? 'Репетиция' : 'Спектакль'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(ev)} style={{ border: '1px solid #DDD', background: '#FFF', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#534AB7' }} title="Редактировать">✎</button>
                <button onClick={() => setArtistPickerEventId(ev.id)} style={{ border: '1px solid #C0DDF5', background: '#F0F7FF', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#185FA5' }} title="Артисты">👥</button>
                <button onClick={() => setDeleteConfirm(ev.id)} style={{ border: '1px solid #FFCDD2', background: '#FFF8F8', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#E24B4A' }} title="Удалить">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const FormModal = () => showForm ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#FFFFFF', borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '24px 20px 32px' : 28, width: isMobile ? '100%' : 480, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{editingId ? 'Редактировать' : 'Новое событие'}</div>
          <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}><label style={lbl}>Название *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Например: Чайка" style={inp} /></div>
          <div style={{ marginBottom: 16 }}><label style={lbl}>Тип</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
              <option value="performance">Спектакль</option>
              <option value="rehearsal">Репетиция</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}><label style={lbl}>Площадка</label>
            <select value={form.venue_id} onChange={e => setForm({ ...form, venue_id: e.target.value })} style={inp}>
              <option value="">— не выбрана —</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={lbl}>Начало *</label><input required type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Конец *</label><input required type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ marginBottom: 16 }}><label style={lbl}>Описание</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Необязательно" style={{ ...inp, height: 70, resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #DDD', background: '#FFF', fontSize: 14, cursor: 'pointer', color: '#555' }}>Отмена</button>
            <button type="submit" disabled={loading} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#534AB7', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  const DeleteModal = () => deleteConfirm ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 28, width: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>Удалить событие?</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Это действие нельзя отменить</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setDeleteConfirm(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #DDD', background: '#FFF', fontSize: 13, cursor: 'pointer' }}>Отмена</button>
          <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#E24B4A', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Удалить</button>
        </div>
      </div>
    </div>
  ) : null

  if (!authChecked) return null
  if (!isLoggedIn) return <Landing />

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif', paddingBottom: 70 }}>

        {/* Mobile header */}
        <div style={{ background: '#1E1756', padding: '14px 16px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: 1 }}>СЦЕНА</div>
          <button onClick={openNew} style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Событие</button>
        </div>

        {/* Mobile month nav */}
        <div style={{ background: '#FFFFFF', padding: '10px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #EBEBF0' }}>
          <button onClick={prevMonth} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>{MONTHS_RU[month]} {year}</div>
          <button onClick={nextMonth} style={{ border: 'none', background: '#F5F5FF', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>›</button>
        </div>

        {/* Mobile tabs */}
        <div style={{ display: 'flex', background: '#FFFFFF', borderBottom: '1px solid #EBEBF0' }}>
          {[{ key: 'calendar', label: 'Календарь' }, { key: 'events', label: selected ? `${selected} ${MONTHS_RU[month].slice(0, 3)}` : 'События' }, { key: 'artists', label: 'Артисты' }].map(t => (
            <Link key={t.key} href={t.key === 'artists' ? '/artists' : '#'} style={{ textDecoration: 'none', flex: 1 }}
              onClick={e => { if (t.key !== 'artists') { e.preventDefault(); setMobileTab(t.key as any) } }}>
              <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: mobileTab === t.key ? 600 : 400, color: mobileTab === t.key ? '#534AB7' : '#888', borderBottom: mobileTab === t.key ? '2px solid #534AB7' : '2px solid transparent' }}>
                {t.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile content */}
        <div>
          {mobileTab === 'calendar' && <CalendarBlock />}
          {mobileTab === 'events' && <EventsBlock />}
        </div>

        <MobileNav />
        {artistPickerEventId && (
          <ArtistPicker
            eventId={artistPickerEventId}
            onClose={() => { setArtistPickerEventId(null); load() }}
          />
        )}
        <FormModal />
        <DeleteModal />
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EBEBF0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Расписание</div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Поиск..."
              style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #E0E0E0', fontSize: 13, outline: 'none', width: 200, fontFamily: 'system-ui' }}
            />
            {(searchResults || searchLoading) && searchQuery && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#FFF', borderRadius: 10, border: '1px solid #E0E0E0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 500, maxHeight: 360, overflowY: 'auto', minWidth: 320 }}>
                {searchLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#888', fontSize: 13 }}>Поиск...</div>
                ) : (
                  <>
                    {searchResults!.events.length === 0 && searchResults!.artists.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#BBB', fontSize: 13 }}>Ничего не найдено</div>
                    ) : (
                      <>
                        {searchResults!.events.length > 0 && (
                          <div>
                            <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>События</div>
                            {searchResults!.events.map(ev => (
                              <div key={ev.id} onClick={() => { const d = new Date(ev.start_time); setYear(d.getFullYear()); setMonth(d.getMonth()); setSelected(d.getDate()); setSearchQuery(''); setSearchResults(null) }}
                                style={{ padding: '8px 14px', cursor: 'pointer', borderTop: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 10 }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{ev.title}</div>
                                  <div style={{ fontSize: 11, color: '#888' }}>{new Date(ev.start_time).toLocaleDateString('ru-RU')}{ev.venues?.name ? ` · ${ev.venues.name}` : ''}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults!.artists.length > 0 && (
                          <div>
                            <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Артисты</div>
                            {searchResults!.artists.map(a => (
                              <Link key={a.id} href="/artists" style={{ textDecoration: 'none' }} onClick={() => { setSearchQuery(''); setSearchResults(null) }}>
                                <div style={{ padding: '8px 14px', cursor: 'pointer', borderTop: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 10 }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
                                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#FFF', flexShrink: 0 }}>
                                    {a.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{a.full_name}</div>
                                    <div style={{ fontSize: 11, color: '#888' }}>{a.role || 'Артист'}</div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <Link href={`/print?year=${year}&month=${month}`} target="_blank" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#F5F5FF', color: '#534AB7', border: '1px solid #D0CDFF', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>🖨 Печать</button>
          </Link>
          <button onClick={openNew} style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Событие</button>
          <div style={{ display: 'flex', gap: 4, background: '#F5F5FF', borderRadius: 8, padding: 3 }}>
          {(['month', 'week'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: viewMode === mode ? 500 : 400, background: viewMode === mode ? '#534AB7' : 'transparent', color: viewMode === mode ? '#FFFFFF' : '#888' }}>
              {mode === 'month' ? 'Месяц' : 'Неделя'}
            </button>
          ))}
        </div>
        </div>
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, maxWidth: 1100 }}>
            {viewMode === 'month' ? <CalendarBlock /> : <WeekBlock />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ label: 'Событий', value: events.length }, { label: 'Спектаклей', value: events.filter(e => e.type === 'performance').length }, { label: 'Репетиций', value: events.filter(e => e.type === 'rehearsal').length }, { label: 'Площадок', value: venues.length }].map(s => (
                  <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #EBEBF0', padding: '12px 14px' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <EventsBlock />
            </div>
          </div>
        </div>
      </div>
      {artistPickerEventId && (
        <ArtistPicker
          eventId={artistPickerEventId}
          onClose={() => { setArtistPickerEventId(null); load() }}
        />
      )}
      <FormModal />
      <DeleteModal />
    </div>
  )
}