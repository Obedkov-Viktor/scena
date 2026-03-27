'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/app/components/Sidebar'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  planned: 'Запланировано',
  confirmed: 'Подтверждено',
  completed: 'Завершено',
  cancelled: 'Отменено',
}
const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  planned:   { bg: '#F5F3FF', color: '#534AB7', border: '#D0CDFF' },
  confirmed: { bg: '#F0FBF6', color: '#1D9E75', border: '#A8E6CF' },
  completed: { bg: '#F5F5F5', color: '#666',    border: '#DDD' },
  cancelled: { bg: '#FFF8F8', color: '#E24B4A', border: '#FFCDD2' },
}

const emptyForm = {
  title: '', city: '', country: 'Россия', start_date: '', end_date: '',
  venue_name: '', description: '', status: 'planned',
}

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tourArtists, setTourArtists] = useState<Record<string, string[]>>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('tours')
      .select('*, tour_artists(artist_id, artists(full_name))')
      .order('start_date')
    setTours(data || [])
  }

  useEffect(() => {
    load()
    supabase.from('artists').select('*').order('full_name').then(({ data }) => setArtists(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (editingId) {
      await supabase.from('tours').update(form).eq('id', editingId)
    } else {
      await supabase.from('tours').insert(form)
    }
    setLoading(false)
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('tours').delete().eq('id', id)
    setDeleteConfirm(null)
    load()
  }

  const openEdit = (tour: any) => {
    setEditingId(tour.id)
    setForm({
      title: tour.title, city: tour.city, country: tour.country || 'Россия',
      start_date: tour.start_date, end_date: tour.end_date,
      venue_name: tour.venue_name || '', description: tour.description || '',
      status: tour.status || 'planned',
    })
    setShowForm(true)
  }

  const toggleArtist = async (tourId: string, artistId: string, assigned: boolean) => {
    if (assigned) {
      await supabase.from('tour_artists').delete().eq('tour_id', tourId).eq('artist_id', artistId)
    } else {
      await supabase.from('tour_artists').insert({ tour_id: tourId, artist_id: artistId })
    }
    load()
  }

  const formatDate = (d: string) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }

  const upcoming = tours.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  const past = tours.filter(t => t.status === 'completed' || t.status === 'cancelled')

  const TourCard = ({ tour }: { tour: any }) => {
    const s = STATUS_COLORS[tour.status] || STATUS_COLORS.planned
    const assignedArtists = (tour.tour_artists || []).map((ta: any) => ta.artists?.full_name).filter(Boolean)
    const isExpanded = expandedId === tour.id

    return (
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>✈️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>{tour.title}</div>
                <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 500 }}>
                  {STATUS_LABELS[tour.status] || tour.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                📍 {tour.city}{tour.country !== 'Россия' ? `, ${tour.country}` : ''}
                {tour.venue_name && <span style={{ color: '#888' }}> · {tour.venue_name}</span>}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                🗓 {formatDate(tour.start_date)} — {formatDate(tour.end_date)}
              </div>
              {assignedArtists.length > 0 && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  👥 {assignedArtists.join(', ')}
                </div>
              )}
              {tour.description && (
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{tour.description}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => setExpandedId(isExpanded ? null : tour.id)}
                style={{ border: '1px solid #DDD', background: isExpanded ? '#EEEDFE' : '#FFF', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#534AB7' }} title="Артисты">👥</button>
              <button onClick={() => openEdit(tour)}
                style={{ border: '1px solid #DDD', background: '#FFF', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#534AB7' }} title="Редактировать">✎</button>
              <button onClick={() => setDeleteConfirm(tour.id)}
                style={{ border: '1px solid #FFCDD2', background: '#FFF8F8', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#E24B4A' }} title="Удалить">✕</button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div style={{ borderTop: '1px solid #F0F0F5', padding: '14px 18px', background: '#FAFAFA' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 10 }}>Артисты в гастроли:</div>
            {artists.length === 0 ? (
              <div style={{ fontSize: 13, color: '#BBB' }}>Нет артистов</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {artists.map((artist) => {
                  const assigned = (tour.tour_artists || []).some((ta: any) => ta.artist_id === artist.id)
                  return (
                    <button key={artist.id} onClick={() => toggleArtist(tour.id, artist.id, assigned)}
                      style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${assigned ? '#1D9E75' : '#E0E0E0'}`, background: assigned ? '#F0FBF6' : '#FFF', color: assigned ? '#1D9E75' : '#555', fontSize: 12, cursor: 'pointer', fontWeight: assigned ? 600 : 400 }}>
                      {assigned ? '✓ ' : ''}{artist.full_name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif' }}>
      {!isMobile && <Sidebar />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EBEBF0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && <Link href="/" style={{ color: '#534AB7', textDecoration: 'none', fontSize: 20 }}>←</Link>}
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Гастроли и выезды</div>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
            style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            + Гастроли
          </button>
        </div>

        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {tours.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#BBB', padding: '64px 0', fontSize: 15 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
              Нет запланированных гастролей
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Предстоящие</div>
                  {upcoming.map(tour => <TourCard key={tour.id} tour={tour} />)}
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Прошедшие</div>
                  {past.map(tour => <TourCard key={tour.id} tour={tour} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{editingId ? 'Редактировать' : 'Новые гастроли'}</div>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Название *</label><input required style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Например: Гастроли в Москве" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={lbl}>Город *</label><input required style={inp} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Москва" /></div>
                <div><label style={lbl}>Страна</label><input style={inp} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Россия" /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Площадка</label><input style={inp} value={form.venue_name} onChange={e => setForm({ ...form, venue_name: e.target.value })} placeholder="Название театра или зала" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={lbl}>Начало *</label><input required type="date" style={inp} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><label style={lbl}>Конец *</label><input required type="date" style={inp} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Статус</label>
                <select style={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="planned">Запланировано</option>
                  <option value="confirmed">Подтверждено</option>
                  <option value="completed">Завершено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}><label style={lbl}>Описание</label><textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Необязательно" /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #DDD', background: '#FFF', fontSize: 14, cursor: 'pointer', color: '#555' }}>Отмена</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#534AB7', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 28, width: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>Удалить гастроли?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Это действие нельзя отменить</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #DDD', background: '#FFF', fontSize: 13, cursor: 'pointer' }}>Отмена</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#E24B4A', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
