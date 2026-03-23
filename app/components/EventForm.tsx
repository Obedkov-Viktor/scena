'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function EventForm({ onSuccess }: { onSuccess: () => void }) {
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', type: 'performance',
    venue_id: '', start_time: '', end_time: '', description: ''
  })

  useEffect(() => {
    supabase.from('venues').select('*').then(({ data }) => setVenues(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setLoading(false)
    if (res.ok) {
      setForm({ title: '', type: 'performance', venue_id: '', start_time: '', end_time: '', description: '' })
      onSuccess()
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', marginTop: '4px',
    fontFamily: 'sans-serif', background: 'white', color: '#1a1a1a'
  }
  const lbl: React.CSSProperties = {
    fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '12px'
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'white', border: '1px solid #e0e0e0',
      borderRadius: '12px', padding: '1.5rem', maxWidth: '700px', marginBottom: '2rem'
    }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
        Новое событие
      </h2>

      <label style={lbl}>
        Название *
        <input style={inp} required value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Например: Чайка" />
      </label>

      <label style={lbl}>
        Тип
        <select style={inp} value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="performance">Спектакль</option>
          <option value="rehearsal">Репетиция</option>
          <option value="other">Другое</option>
        </select>
      </label>

      <label style={lbl}>
        Площадка
        <select style={inp} value={form.venue_id}
          onChange={e => setForm({ ...form, venue_id: e.target.value })}>
          <option value="">— не выбрана —</option>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <label style={lbl}>
          Начало *
          <input style={inp} type="datetime-local" required value={form.start_time}
            onChange={e => setForm({ ...form, start_time: e.target.value })} />
        </label>
        <label style={lbl}>
          Конец *
          <input style={inp} type="datetime-local" required value={form.end_time}
            onChange={e => setForm({ ...form, end_time: e.target.value })} />
        </label>
      </div>

      <label style={lbl}>
        Описание
        <textarea style={{ ...inp, height: '70px', resize: 'vertical' }} value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Необязательно" />
      </label>

      <button type="submit" disabled={loading} style={{
        background: '#534AB7', color: 'white', border: 'none',
        padding: '10px 24px', borderRadius: '8px', fontSize: '14px',
        fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1
      }}>
        {loading ? 'Сохраняем...' : '+ Добавить событие'}
      </button>
    </form>
  )
}