'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheater } from '@/lib/useTheater'
import Link from 'next/link'

const emptyForm = { name: '', capacity: '' }

export default function Venues() {
  const { theaterId } = useTheater()
  const [venues, setVenues] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const load = async () => {
    const { data: v } = await supabase.from('venues').select('*').order('name')
    const { data: e } = await supabase.from('events').select('*, venues(name)').order('start_time')
    setVenues(v || [])
    setEvents(e || [])
  }

  useEffect(() => { load() }, [])

  const venueEvents = (venueId: string) => events.filter(e => e.venue_id === venueId)
  const upcomingEvents = (venueId: string) => {
    const now = new Date()
    return events.filter(e => e.venue_id === venueId && new Date(e.start_time) >= now)
  }

  const openNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (v: any) => {
    setEditingId(v.id)
    setForm({ name: v.name, capacity: v.capacity || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = { name: form.name, capacity: form.capacity ? parseInt(form.capacity) : null }
    if (editingId) {
      await supabase.from('venues').update(payload).eq('id', editingId)
    } else {
      await supabase.from('venues').insert([{ ...payload, theater_id: theaterId }])
    }
    setLoading(false); setShowForm(false); setEditingId(null); setForm(emptyForm); load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('venues').delete().eq('id', id)
    setDeleteConfirm(null)
    if (selected === id) setSelected(null)
    load()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }

  const selectedVenue = venues.find(v => v.id === selected)
  const colors = ['#534AB7', '#1D9E75', '#D85A30', '#BA7517', '#185FA5']
  const colorFor = (i: number) => colors[i % colors.length]

  const VenueList = () => (
    <div style={{ background: '#FFFFFF', borderRadius: isMobile ? 0 : 12, border: isMobile ? 'none' : '1px solid #EBEBF0', overflow: 'hidden' }}>
      {venues.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#BBB', fontSize: 14 }}>Нет площадок. Нажмите + Площадка.</div>
      ) : venues.map((venue, i) => {
        const total = venueEvents(venue.id).length
        const upcoming = upcomingEvents(venue.id).length
        const isSelected = selected === venue.id
        return (
          <div key={venue.id} onClick={() => setSelected(isSelected ? null : venue.id)}
            style={{ padding: '16px', borderBottom: '1px solid #F5F5F5', cursor: 'pointer', background: isSelected ? '#F5F3FF' : '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: colorFor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎭</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>{venue.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {venue.capacity && <span>Вместимость: {venue.capacity} мест</span>}
                  <span>{total} событий</span>
                  <span style={{ color: upcoming > 0 ? '#534AB7' : '#BBB', fontWeight: upcoming > 0 ? 500 : 400 }}>{upcoming} предстоящих</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={e => { e.stopPropagation(); openEdit(venue) }}
                  style={{ border: '1px solid #DDD', background: '#FFF', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#534AB7' }}>✎</button>
                <button onClick={e => { e.stopPropagation(); setDeleteConfirm(venue.id) }}
                  style={{ border: '1px solid #FFCDD2', background: '#FFF8F8', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#E24B4A' }}>✕</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const VenueDetail = () => !selectedVenue ? (
    <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', padding: 40, textAlign: 'center', color: '#BBB', fontSize: 13 }}>
      Нажмите на площадку чтобы увидеть расписание
    </div>
  ) : (
    <div style={{ background: '#FFFFFF', borderRadius: isMobile ? 0 : 12, border: isMobile ? 'none' : '1px solid #EBEBF0', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #F0F0F5' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>{selectedVenue.name}</div>
        {selectedVenue.capacity && <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Вместимость: {selectedVenue.capacity} мест</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1, background: '#F5F3FF', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7' }}>{venueEvents(selectedVenue.id).length}</div>
            <div style={{ fontSize: 11, color: '#888' }}>всего</div>
          </div>
          <div style={{ flex: 1, background: '#F0FBF6', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75' }}>{upcomingEvents(selectedVenue.id).length}</div>
            <div style={{ fontSize: 11, color: '#888' }}>предстоящих</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ближайшие события</div>
        {upcomingEvents(selectedVenue.id).length === 0 ? (
          <div style={{ fontSize: 13, color: '#BBB', textAlign: 'center', padding: '16px 0' }}>Нет предстоящих событий</div>
        ) : upcomingEvents(selectedVenue.id).slice(0, 8).map(ev => (
          <div key={ev.id} style={{ padding: '9px 10px', borderRadius: 8, marginBottom: 6, background: ev.type === 'rehearsal' ? '#F0FBF6' : '#F5F3FF', borderLeft: `3px solid ${ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7'}` }}>
            <div style={{ fontWeight: 500, fontSize: 13, color: '#1a1a2e' }}>{ev.title}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {new Date(ev.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              {' · '}
              {new Date(ev.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const FormModal = () => showForm ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#FFFFFF', borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '24px 20px 32px' : 28, width: isMobile ? '100%' : 400, maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{editingId ? 'Редактировать' : 'Новая площадка'}</div>
          <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Название *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Большая сцена" style={inp} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Вместимость (мест)</label>
            <input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} placeholder="500" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #DDD', background: '#FFF', fontSize: 14, cursor: 'pointer' }}>Отмена</button>
            <button type="submit" disabled={loading} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#534AB7', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Добавить'}
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
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>Удалить площадку?</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>События останутся без привязки к залу</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setDeleteConfirm(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #DDD', background: '#FFF', fontSize: 13, cursor: 'pointer' }}>Отмена</button>
          <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#E24B4A', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Удалить</button>
        </div>
      </div>
    </div>
  ) : null

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif', paddingBottom: 70 }}>
        <div style={{ background: '#1E1756', padding: '14px 16px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: 1 }}>СЦЕНА</div>
          <button onClick={openNew} style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Площадка</button>
        </div>

        <div style={{ background: '#FFFFFF', padding: '12px 16px', borderBottom: '1px solid #EBEBF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>Площадки и залы</div>
          <div style={{ fontSize: 12, color: '#888' }}>Всего: {venues.length}</div>
        </div>

        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#534AB7', fontWeight: 500 }}>
              ← Назад к списку
            </button>
            <VenueDetail />
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 16px' }}>
              {[
                { label: 'Площадок', value: venues.length },
                { label: 'Сегодня', value: events.filter(e => new Date(e.start_time).toDateString() === new Date().toDateString()).length },
                { label: 'Предстоящих', value: events.filter(e => new Date(e.start_time) >= new Date()).length },
              ].map(s => (
                <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #EBEBF0', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#534AB7' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <VenueList />
          </div>
        )}

        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1E1756', display: 'flex', padding: '10px 0 16px', zIndex: 100 }}>
          {[
            { label: 'Расписание', href: '/', icon: '📅' },
            { label: 'Артисты', href: '/artists', icon: '👥' },
            { label: 'Площадки', href: '/venues', icon: '🎭' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none', flex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>{item.icon}</div>
                <div style={{ fontSize: 10, color: item.href === '/venues' ? '#FFFFFF' : '#9B96D4', marginTop: 2, fontWeight: item.href === '/venues' ? 600 : 400 }}>{item.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <FormModal />
        <DeleteModal />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 220, background: '#1E1756', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2D2580' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', letterSpacing: 1 }}>СЦЕНА</div>
          <div style={{ fontSize: 11, color: '#9B96D4', marginTop: 4 }}>Система управления</div>
        </div>
        {[
          { label: 'Расписание', href: '/', active: false },
          { label: 'Артисты', href: '/artists', active: false },
          { label: 'Площадки', href: '/venues', active: true },
          { label: 'Отчёты', href: '#', active: false },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '11px 20px', fontSize: 13, cursor: 'pointer', marginTop: 2, color: item.active ? '#FFFFFF' : '#9B96D4', background: item.active ? '#2D2580' : 'transparent', borderLeft: item.active ? '3px solid #7F77DD' : '3px solid transparent', fontWeight: item.active ? 500 : 400 }}>{item.label}</div>
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '16px 20px', fontSize: 12, color: '#9B96D4', borderTop: '1px solid #2D2580' }}>
          <div style={{ fontWeight: 500, color: '#FFFFFF' }}>Театр мимики и жеста (ТМЖ)</div>
          <div style={{ marginTop: 2 }}>Администратор</div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            style={{ marginTop: 8, fontSize: 11, color: '#9B96D4', background: 'none', border: '1px solid #2D2580', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', width: '100%' }}>
            Выйти
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EBEBF0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Площадки и залы</div>
          <button onClick={openNew} style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Площадка</button>
        </div>
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, maxWidth: 1100 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Всего площадок', value: venues.length },
                  { label: 'Событий сегодня', value: events.filter(e => new Date(e.start_time).toDateString() === new Date().toDateString()).length },
                  { label: 'Предстоящих', value: events.filter(e => new Date(e.start_time) >= new Date()).length },
                ].map(s => (
                  <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #EBEBF0', padding: '12px 16px' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#534AB7' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <VenueList />
            </div>
            <VenueDetail />
          </div>
        </div>
      </div>
      <FormModal />
      <DeleteModal />
    </div>
  )
}