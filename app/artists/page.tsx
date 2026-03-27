'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const emptyForm = { full_name: '', role: '', phone: '', email: '', avatar_url: '' }

export default function Artists() {
  const [artists, setArtists] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
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
    setForm({ full_name: a.full_name, role: a.role || '', phone: a.phone || '', email: a.email || '', avatar_url: a.avatar_url || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let avatar_url = form.avatar_url
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { data: uploaded } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (uploaded) {
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(uploaded.path)
        avatar_url = pub.publicUrl
      }
    }
    const payload = { ...form, avatar_url }
    if (editingId) {
      await supabase.from('artists').update(payload).eq('id', editingId)
    } else {
      await supabase.from('artists').insert([payload])
    }
    setLoading(false); setShowForm(false); setEditingId(null); setForm(emptyForm); setAvatarFile(null); load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('artists').delete().eq('id', id)
    setDeleteConfirm(null)
    if (selected === id) setSelected(null)
    load()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }

  const selectedArtist = artists.find(a => a.id === selected)
  const selEvents = selected ? artistEvents(selected) : []
  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['#534AB7', '#1D9E75', '#D85A30', '#BA7517', '#185FA5']
  const colorFor = (i: number) => colors[i % colors.length]

  const ArtistList = () => (
    <div style={{ background: '#FFFFFF', borderRadius: isMobile ? 0 : 12, border: isMobile ? 'none' : '1px solid #EBEBF0', overflow: 'hidden' }}>
      {artists.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#BBB', fontSize: 14 }}>Нет артистов. Нажмите + Артист.</div>
      ) : artists.map((artist, i) => {
        const pct = loadPct(artist.id)
        const isSelected = selected === artist.id
        return (
          <div key={artist.id} onClick={() => setSelected(isSelected ? null : artist.id)}
            style={{ padding: '14px 16px', borderBottom: '1px solid #F5F5F5', cursor: 'pointer', background: isSelected ? '#F5F3FF' : '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: colorFor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#FFFFFF', flexShrink: 0, overflow: 'hidden' }}>
                {artist.avatar_url ? <img src={artist.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(artist.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{artist.full_name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{artist.role || 'Роль не указана'}</div>
                <div style={{ marginTop: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 3 }}>
                    <span>Занятость</span>
                    <span style={{ fontWeight: 500, color: pct > 80 ? '#E24B4A' : pct > 60 ? '#BA7517' : '#1D9E75' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#F0F0F5', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#E24B4A' : pct > 60 ? '#EF9F27' : '#1D9E75', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={ev => { ev.stopPropagation(); openEdit(artist) }}
                  style={{ border: '1px solid #DDD', background: '#FFF', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#534AB7' }}>✎</button>
                <button onClick={ev => { ev.stopPropagation(); setDeleteConfirm(artist.id) }}
                  style={{ border: '1px solid #FFCDD2', background: '#FFF8F8', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#E24B4A' }}>✕</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const ArtistDetail = () => !selectedArtist ? (
    <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #EBEBF0', padding: 40, textAlign: 'center', color: '#BBB', fontSize: 13 }}>
      Нажмите на артиста чтобы увидеть детали
    </div>
  ) : (
    <div style={{ background: '#FFFFFF', borderRadius: isMobile ? 0 : 12, border: isMobile ? 'none' : '1px solid #EBEBF0', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #F0F0F5', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: colorFor(artists.indexOf(selectedArtist)), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: '0 auto 12px', overflow: 'hidden' }}>
          {selectedArtist.avatar_url ? <img src={selectedArtist.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(selectedArtist.full_name)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 17, color: '#1a1a2e' }}>{selectedArtist.full_name}</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{selectedArtist.role || 'Роль не указана'}</div>
        {selectedArtist.email && <div style={{ fontSize: 13, color: '#534AB7', marginTop: 6 }}>{selectedArtist.email}</div>}
        {selectedArtist.phone && <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{selectedArtist.phone}</div>}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ближайшие события</div>
        {selEvents.length === 0 ? (
          <div style={{ fontSize: 13, color: '#BBB', textAlign: 'center', padding: '16px 0' }}>Нет назначенных событий</div>
        ) : selEvents.slice(0, 6).map(ev => (
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
      <div style={{ background: '#FFFFFF', borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '24px 20px 32px' : 28, width: isMobile ? '100%' : 440, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{editingId ? 'Редактировать артиста' : 'Новый артист'}</div>
          <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {[
            { label: 'Полное имя *', key: 'full_name', placeholder: 'Иванова Мария Сергеевна' },
            { label: 'Роль / должность', key: 'role', placeholder: 'Ведущая актриса' },
            { label: 'Телефон', key: 'phone', placeholder: '+7 (999) 000-00-00' },
            { label: 'Email', key: 'email', placeholder: 'artist@theatre.ru' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={lbl}>{f.label}</label>
              <input required={f.key === 'full_name'} value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} style={inp} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Фото</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {(avatarFile || form.avatar_url) && (
                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #E0E0E0' }}>
                  <img src={avatarFile ? URL.createObjectURL(avatarFile) : form.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <label style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: '1.5px dashed #D0CDFF', background: '#F8F7FF', cursor: 'pointer', fontSize: 13, color: '#534AB7', textAlign: 'center', display: 'block' }}>
                {avatarFile ? avatarFile.name : '+ Выбрать фото'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
              </label>
              {avatarFile && <button type="button" onClick={() => setAvatarFile(null)} style={{ border: 'none', background: 'none', color: '#E24B4A', cursor: 'pointer', fontSize: 18 }}>×</button>}
            </div>
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
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>Удалить артиста?</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Это действие нельзя отменить</div>
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
          <button onClick={openNew} style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Артист</button>
        </div>

        <div style={{ background: '#FFFFFF', padding: '12px 16px', borderBottom: '1px solid #EBEBF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>Артисты</div>
          <div style={{ fontSize: 12, color: '#888' }}>Всего: {artists.length}</div>
        </div>

        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#534AB7', fontWeight: 500 }}>
              ← Назад к списку
            </button>
            <ArtistDetail />
          </div>
        ) : (
          <ArtistList />
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
                <div style={{ fontSize: 10, color: item.href === '/artists' ? '#FFFFFF' : '#9B96D4', marginTop: 2, fontWeight: item.href === '/artists' ? 600 : 400 }}>{item.label}</div>
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
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>Артисты</div>
          <button onClick={openNew} style={{ background: '#534AB7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Артист</button>
        </div>
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, maxWidth: 1100 }}>
            <ArtistList />
            <ArtistDetail />
          </div>
        </div>
      </div>

      <FormModal />
      <DeleteModal />
    </div>
  )
}