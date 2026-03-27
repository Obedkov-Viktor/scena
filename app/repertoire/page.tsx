'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/app/components/Sidebar'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  drama: 'Драма', comedy: 'Комедия', musical: 'Мюзикл',
  opera: 'Опера', ballet: 'Балет', children: 'Детский', other: 'Другое',
}
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  drama:    { bg: '#EEEDFE', color: '#3C3489' },
  comedy:   { bg: '#FFF0E0', color: '#8B4000' },
  musical:  { bg: '#E1F5EE', color: '#085041' },
  opera:    { bg: '#FCE8F3', color: '#7B1F5E' },
  ballet:   { bg: '#E8F4FC', color: '#0D4F7B' },
  children: { bg: '#FFFBE6', color: '#7A5C00' },
  other:    { bg: '#F5F5F5', color: '#555' },
}

const emptyForm = {
  title: '', type: 'drama', author: '', director: '',
  description: '', premiere_date: '', duration_minutes: '',
  age_rating: '12+', is_active: true,
}

export default function RepertoirePage() {
  const [plays, setPlays] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'archive'>('all')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('repertoire')
      .select('*, repertoire_artists(artist_id, role_in_play, artists(full_name))')
      .order('created_at', { ascending: false })
    setPlays(data || [])
    supabase.from('artists').select('*').order('full_name').then(({ data }) => setArtists(data || []))
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      premiere_date: form.premiere_date || null,
    }
    if (editingId) {
      await supabase.from('repertoire').update(payload).eq('id', editingId)
    } else {
      await supabase.from('repertoire').insert(payload)
    }
    setLoading(false); setShowForm(false); setEditingId(null); setForm(emptyForm); load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('repertoire').delete().eq('id', id)
    setDeleteConfirm(null); load()
  }

  const openEdit = (play: any) => {
    setEditingId(play.id)
    setForm({
      title: play.title, type: play.type || 'drama',
      author: play.author || '', director: play.director || '',
      description: play.description || '',
      premiere_date: play.premiere_date || '',
      duration_minutes: play.duration_minutes || '',
      age_rating: play.age_rating || '12+',
      is_active: play.is_active !== false,
    })
    setShowForm(true)
  }

  const toggleArtist = async (playId: string, artistId: string, assigned: boolean, roleInPlay = '') => {
    if (assigned) {
      await supabase.from('repertoire_artists').delete().eq('repertoire_id', playId).eq('artist_id', artistId)
    } else {
      await supabase.from('repertoire_artists').insert({ repertoire_id: playId, artist_id: artistId, role_in_play: roleInPlay })
    }
    load()
  }

  const filtered = plays.filter(p =>
    filterActive === 'all' ? true :
    filterActive === 'active' ? p.is_active :
    !p.is_active
  )

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F6FF', fontFamily: 'system-ui, sans-serif' }}>
      {!isMobile && <Sidebar />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EBEBF0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && <Link href="/" style={{ color: '#534AB7', textDecoration: 'none', fontSize: 20 }}>←</Link>}
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Репертуар</div>
          <div style={{ display: 'flex', gap: 4, background: '#F5F5FF', borderRadius: 8, padding: 3 }}>
            {([['all', 'Все'], ['active', 'Активные'], ['archive', 'Архив']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFilterActive(key)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: filterActive === key ? 500 : 400, background: filterActive === key ? '#534AB7' : 'transparent', color: filterActive === key ? '#FFFFFF' : '#888' }}>{label}</button>
            ))}
          </div>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
            style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            + Спектакль
          </button>
        </div>

        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Всего спектаклей', value: plays.length },
              { label: 'Активных', value: plays.filter(p => p.is_active).length },
              { label: 'В архиве', value: plays.filter(p => !p.is_active).length },
              { label: 'Жанров', value: new Set(plays.map(p => p.type)).size },
            ].map(s => (
              <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #EBEBF0', padding: '12px 16px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#534AB7' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #EBEBF0', padding: '64px 24px', textAlign: 'center', color: '#BBB', fontSize: 14 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
              Нет спектаклей. Нажмите «+ Спектакль» чтобы добавить.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {filtered.map(play => {
                const tc = TYPE_COLORS[play.type] || TYPE_COLORS.other
                const castList = (play.repertoire_artists || []).map((ra: any) => ra.artists?.full_name).filter(Boolean)
                const isExpanded = expandedId === play.id
                return (
                  <div key={play.id} style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #EBEBF0', overflow: 'hidden', opacity: play.is_active ? 1 : 0.65 }}>
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{play.title}</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: tc.bg, color: tc.color, fontWeight: 500 }}>
                              {TYPE_LABELS[play.type] || play.type}
                            </span>
                            {!play.is_active && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: '#F5F5F5', color: '#999' }}>Архив</span>}
                          </div>
                          {play.author && <div style={{ fontSize: 12, color: '#666' }}>Автор: {play.author}</div>}
                          {play.director && <div style={{ fontSize: 12, color: '#666' }}>Режиссёр: {play.director}</div>}
                          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                            {play.duration_minutes && <span style={{ fontSize: 11, color: '#888' }}>⏱ {play.duration_minutes} мин</span>}
                            {play.age_rating && <span style={{ fontSize: 11, color: '#888' }}>🔞 {play.age_rating}</span>}
                            {play.premiere_date && <span style={{ fontSize: 11, color: '#888' }}>🎬 {new Date(play.premiere_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                          </div>
                          {play.description && <div style={{ fontSize: 12, color: '#999', marginTop: 6, lineHeight: 1.4 }}>{play.description}</div>}
                          {castList.length > 0 && (
                            <div style={{ fontSize: 11, color: '#534AB7', marginTop: 6 }}>👥 {castList.join(', ')}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                          <button onClick={() => setExpandedId(isExpanded ? null : play.id)}
                            style={{ border: '1px solid #DDD', background: isExpanded ? '#EEEDFE' : '#FFF', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#534AB7' }} title="Состав">👥</button>
                          <button onClick={() => openEdit(play)}
                            style={{ border: '1px solid #DDD', background: '#FFF', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#534AB7' }} title="Редактировать">✎</button>
                          <button onClick={() => setDeleteConfirm(play.id)}
                            style={{ border: '1px solid #FFCDD2', background: '#FFF8F8', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#E24B4A' }} title="Удалить">✕</button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #F0F0F5', padding: '12px 18px', background: '#FAFAFA' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>Состав спектакля:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {artists.map(artist => {
                            const ra = (play.repertoire_artists || []).find((r: any) => r.artist_id === artist.id)
                            const assigned = !!ra
                            return (
                              <button key={artist.id} onClick={() => toggleArtist(play.id, artist.id, assigned)}
                                style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${assigned ? '#1D9E75' : '#E0E0E0'}`, background: assigned ? '#F0FBF6' : '#FFF', color: assigned ? '#1D9E75' : '#555', fontSize: 12, cursor: 'pointer', fontWeight: assigned ? 600 : 400 }}>
                                {assigned ? '✓ ' : ''}{artist.full_name}
                                {ra?.role_in_play ? ` (${ra.role_in_play})` : ''}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 28, width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{editingId ? 'Редактировать' : 'Новый спектакль'}</div>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Название *</label><input required style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Вишнёвый сад" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={lbl}>Жанр</label>
                  <select style={inp} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Возраст</label>
                  <select style={inp} value={form.age_rating} onChange={e => setForm({ ...form, age_rating: e.target.value })}>
                    {['0+', '6+', '12+', '16+', '18+'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Автор</label><input style={inp} value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="А. П. Чехов" /></div>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Режиссёр</label><input style={inp} value={form.director} onChange={e => setForm({ ...form, director: e.target.value })} placeholder="Иванов И. И." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={lbl}>Дата премьеры</label><input type="date" style={inp} value={form.premiere_date} onChange={e => setForm({ ...form, premiere_date: e.target.value })} /></div>
                <div><label style={lbl}>Длительность (мин)</label><input type="number" style={inp} value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} placeholder="120" /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Описание</label><textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Краткое описание спектакля" /></div>
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: 16, height: 16 }} />
                <label htmlFor="is_active" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>Активный (в репертуаре)</label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #DDD', background: '#FFF', fontSize: 14, cursor: 'pointer' }}>Отмена</button>
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
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>Удалить спектакль?</div>
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
