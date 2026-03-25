'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const emptyForm = { name: '', capacity: '' }

export default function Venues() {
  const [venues, setVenues] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const load = async () => {
    const { data: v } = await supabase.from('venues').select('*').order('name')
    const { data: e } = await supabase.from('events').select('*, venues(name)').order('start_time')
    setVenues(v || [])
    setEvents(e || [])
  }

  useEffect(() => { load() }, [])

  const venueEvents = (venueId: string) =>
    events.filter(e => e.venue_id === venueId)

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
      await supabase.from('venues').insert([payload])
    }
    setLoading(false); setShowForm(false); setEditingId(null); setForm(emptyForm); load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('venues').delete().eq('id', id)
    setDeleteConfirm(null)
    if (selected === id) setSelected(null)
    load()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5 }

  const selectedVenue = venues.find(v => v.id === selected)
  const selEvents = selected ? upcomingEvents(selected) : []

  const colors = ['#534AB7', '#1D9E75', '#D85A30', '#BA7517', '#185FA5']
  const colorFor = (i: number) => colors[i % colors.length]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif' }}>

      {/* Sidebar */}
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
          <div style={{ fontWeight: 500, color: '#FFFFFF' }}>Театр им. Пушкина</div>
          <div style={{ marginTop: 2 }}>Администратор</div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            style={{ marginTop: 8, fontSize: 11, color: '#9B96D4', background: 'none', border: '1px solid #2D2580', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', width: '100%' }}>
            Выйти
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EBEBF0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Площадки и залы</div>
          <button onClick={openNew} style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Площадка</button>
        </div>

        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, maxWidth: 1100 }}>

            {/* Venues list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Stats row */}
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

              {/* Venues cards */}
              <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: '#FAFAFA', borderBottom: '1px solid #EBEBF0', fontSize: 12, color: '#888', fontWeight: 500 }}>
                  Список площадок
                </div>
                {venues.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#BBB', fontSize: 14 }}>
                    Нет площадок. Нажмите + Площадка чтобы добавить.
                  </div>
                ) : venues.map((venue, i) => {
                  const total = venueEvents(venue.id).length
                  const upcoming = upcomingEvents(venue.id).length
                  const isSelected = selected === venue.id
                  return (
                    <div key={venue.id} onClick={() => setSelected(isSelected ? null : venue.id)}
                      style={{ padding: '16px', borderBottom: '1px solid #F5F5F5', cursor: 'pointer', background: isSelected ? '#F5F3FF' : '#FFFFFF', transition: 'background 0.1s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: colorFor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                          🎭
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>{venue.name}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 3, display: 'flex', gap: 12 }}>
                            {venue.capacity && <span>Вместимость: {venue.capacity} мест</span>}
                            <span>{total} событий всего</span>
                            <span style={{ color: upcoming > 0 ? '#534AB7' : '#BBB', fontWeight: upcoming > 0 ? 500 : 400 }}>{upcoming} предстоящих</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={e => { e.stopPropagation(); openEdit(venue) }}
                            style={{ border: '1px solid #DDD', background: '#FFF', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#534AB7' }}>✎</button>
                          <button onClick={e => { e.stopPropagation(); setDeleteConfirm(venue.id) }}
                            style={{ border: '1px solid #FFCDD2', background: '#FFF8F8', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#E24B4A' }}>✕</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right panel */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', overflow: 'hidden' }}>
              {!selectedVenue ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#BBB', fontSize: 13 }}>
                  Нажмите на площадку чтобы увидеть расписание
                </div>
              ) : (
                <>
                  <div style={{ padding: '20px', borderBottom: '1px solid #F0F0F5' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{selectedVenue.name}</div>
                    {selectedVenue.capacity && (
                      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Вместимость: {selectedVenue.capacity} мест</div>
                    )}
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <div style={{ flex: 1, background: '#F5F3FF', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#534AB7' }}>{venueEvents(selectedVenue.id).length}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>всего</div>
                      </div>
                      <div style={{ flex: 1, background: '#F0FBF6', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1D9E75' }}>{upcomingEvents(selectedVenue.id).length}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>предстоящих</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ближайшие события</div>
                    {selEvents.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#BBB', textAlign: 'center', padding: '16px 0' }}>Нет предстоящих событий</div>
                    ) : selEvents.slice(0, 8).map(ev => (
                      <div key={ev.id} style={{ padding: '9px 10px', borderRadius: 8, marginBottom: 6, background: ev.type === 'rehearsal' ? '#F0FBF6' : '#F5F3FF', borderLeft: `3px solid ${ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7'}` }}>
                        <div style={{ fontWeight: 500, fontSize: 12, color: '#1a1a2e' }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                          {new Date(ev.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(ev.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{editingId ? 'Редактировать площадку' : 'Новая площадка'}</div>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Название *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Например: Большая сцена" style={inp} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Вместимость (мест)</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} placeholder="Например: 500" style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #DDD', background: '#FFF', fontSize: 13, cursor: 'pointer', color: '#555' }}>Отмена</button>
                <button type="submit" disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#534AB7', color: '#FFF', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 28, width: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>Удалить площадку?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>События на этой площадке останутся, но без привязки к залу</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #DDD', background: '#FFF', fontSize: 13, cursor: 'pointer' }}>Отмена</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#E24B4A', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
