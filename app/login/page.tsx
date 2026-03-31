'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Неверный email или пароль')
      setLoading(false)
    } else {
      // Check if this email belongs to an artist (case-insensitive)
      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .ilike('email', data.user?.email ?? '')
        .maybeSingle()
      router.push(artist ? '/my' : '/')
      router.refresh()
    }
  }

    return (
    <div style={{ minHeight: '100vh', background: '#1E1756', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 400, background: '#FFFFFF', borderRadius: 16, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1E1756', letterSpacing: 2 }}>СЦЕНА</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>Система управления театром</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }}>Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@scena.ru"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }}>Пароль</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {error && (
            <div style={{ background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#534AB7', color: '#FFFFFF', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
          Нет аккаунта?{' '}
          <a href="/register" style={{ color: '#534AB7', fontWeight: 500, textDecoration: 'none' }}>Зарегистрировать театр</a>
        </div>
      </div>
    </div>
  )
}