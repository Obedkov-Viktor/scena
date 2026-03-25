'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const emptyForm = { full_name: '', role: '', phone: '', email: '' }

export default function Artists() {
  const [artists, setArtists] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const load = async () => {
    const { data: a } = await supabase.from('artists').select('*').order('full_name')
    const { data: e } = await supabase.from('events').select('*, event_artists(artist_id)').order('start_time')
    setArtists(a || [])
    setEvents(e || [])
  }

  useEffect(() => { load() }, [])

  const artistEvents = (artistId: string) =>
    events.filter(e => e.event_artists?.some((ea: any) => ea.artist_id === artistId))

  const busyDays = (artistId: string) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return events.filter(e => {
      const d = new Date(e.start_time)
      return d >= monthStart && d <= monthEnd &&
        e.event_artists?.some((ea: any) => ea.artist_id === artistId)
    }).length
  }

  const loadPct = (artistId: string) => Math.min(100, Math.round((busyDays(artistId) / 20) * 100))

  const openNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (a: any) => {
    setEditingId(a.id)
    setForm({ full_name: a.full_name, role: a.role || '', phone: a.phone || '', email: a.email || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (editingId) {
      await supabase.from('artists').update(form).eq('id', editingId)
    } else {
      await supabase.from('artists').insert([form])
    }
    setLoading(false)
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('artists').delete().eq('id', id)
    setDeleteConfirm(null)
    if (selected === id) setSelected(null)
    load()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5 }

  const selectedArtist = artists.find(a => a.id === selected)
  const selEvents = selected ? artistEvents(selected) : []

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
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
          { label: 'Артисты', href: '/artists', active: true },
          { label: 'Площадки', href: '/venues', active: false },
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
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EBEBF0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Артисты</div>
          <button onClick={openNew} style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Артист</button>
        </div>

        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, maxWidth: 1100 }}>

            {/* Artists list */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#FAFAFA', borderBottom: '1px solid #EBEBF0', fontSize: 12, color: '#888', fontWeight: 500 }}>
                Всего артистов: {artists.length}
              </div>
              {artists.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#BBB', fontSize: 14 }}>
                  Нет артистов. Нажмите + Артист чтобы добавить.
                </div>
              ) : artists.map((artist, i) => {
                const pct = loadPct(artist.id)
                const isSelected = selected === artist.id
                return (
                  <div key={artist.id} onClick={() => setSelected(isSelected ? null : artist.id)} style={{ padding: '14px 16px', borderBottom: '1px solid #F5F5F5', cursor: 'pointer', background: isSelected ? '#F5F3FF' : '#FFFFFF', transition: 'background 0.1s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: colorFor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#FFFFFF', flexShrink: 0 }}>
                        {initials(artist.full_name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{artist.full_name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{artist.role || 'Роль не указана'}</div>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 3 }}>
                            <span>Занятость в этом месяце</span>
                            <span style={{ fontWeight: 500, color: pct > 80 ? '#E24B4A' : pct > 60 ? '#BA7517' : '#1D9E75' }}>{pct}%</span>
                          </div>
                          <div style={{ height: 4, background: '#F0F0F5', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#E24B4A' : pct > 60 ? '#EF9F27' : '#1D9E75', borderRadius: 2, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={ev => { ev.stopPropagation(); openEdit(artist) }} style={{ border: '1px solid #DDD', background: '#FFF', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 13, color: '#534AB7' }} title="Редактировать">✎</button>
                        <button onClick={ev => { ev.stopPropagation(); setDeleteConfirm(artist.id) }} style={{ border: '1px solid #FFCDD2', background: '#FFF8F8', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 13, color: '#E24B4A' }} title="Удалить">✕</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right panel — artist detail */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', overflow: 'hidden' }}>
              {!selectedArtist ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#BBB', fontSize: 13 }}>
                  Нажмите на артиста чтобы увидеть детали
                </div>
              ) : (
                <>
                  <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F0F0F5', textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: colorFor(artists.indexOf(selectedArtist)), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 auto 12px' }}>
                      {initials(selectedArtist.full_name)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>{selectedArtist.full_name}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{selectedArtist.role || 'Роль не указана'}</div>
                    {selectedArtist.email && <div style={{ fontSize: 12, color: '#534AB7', marginTop: 4 }}>{selectedArtist.email}</div>}
                    {selectedArtist.phone && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{selectedArtist.phone}</div>}
                  </div>

                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F5' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ближайшие события</div>
                    {selEvents.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#BBB', textAlign: 'center', padding: '10px 0' }}>Нет назначенных событий</div>
                    ) : selEvents.slice(0, 6).map(ev => (
                      <div key={ev.id} style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 6, background: ev.type === 'rehearsal' ? '#F0FBF6' : '#F5F3FF', borderLeft: `3px solid ${ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7'}` }}>
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
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 28, width: 440, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{editingId ? 'Редактировать артиста' : 'Новый артист'}</div>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Полное имя *', key: 'full_name', placeholder: 'Например: Иванова Мария Сергеевна' },
                { label: 'Роль / должность', key: 'role', placeholder: 'Например: Ведущая актриса' },
                { label: 'Телефон', key: 'phone', placeholder: '+7 (999) 000-00-00' },
                { label: 'Email', key: 'email', placeholder: 'artist@theatre.ru' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={lbl}>{f.label}</label>
                  <input
                    required={f.key === 'full_name'}
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={inp}
                  />
                </div>
              ))}
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
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>Удалить артиста?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Это действие нельзя отменить</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #DDD', background: '#FFF', fontSize: 13, cursor: 'pointer', color: '#555' }}>Отмена</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#E24B4A', color: '#FFF', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}