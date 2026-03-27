'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    theaterName: '',
    adminName: '',
    email: '',
    password: '',
    confirm: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Этот email уже зарегистрирован'
        : authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('Ошибка регистрации. Попробуйте ещё раз.')
      setLoading(false)
      return
    }

    // 2. Create theater
    const { data: theater, error: theaterError } = await supabase
      .from('theaters')
      .insert({ name: form.theaterName })
      .select()
      .single()

    if (theaterError) {
      setError('Ошибка создания театра: ' + theaterError.message)
      setLoading(false)
      return
    }

    // 3. Link user to theater
    await supabase.from('user_theaters').insert({
      user_id: userId,
      theater_id: theater.id,
      role: 'admin',
    })

    // 4. Create artist profile for admin
    await supabase.from('artists').insert({
      full_name: form.adminName,
      email: form.email,
      role: 'Администратор',
      theater_id: theater.id,
    })

    setStep('success')
    setLoading(false)
  }

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#1E1756', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: 420, background: '#FFFFFF', borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1E1756', marginBottom: 8 }}>Добро пожаловать!</div>
          <div style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>
            Театр <strong>{form.theaterName}</strong> зарегистрирован.
          </div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 28, background: '#F7F6FF', borderRadius: 10, padding: '12px 16px' }}>
            Проверьте почту <strong>{form.email}</strong> — нужно подтвердить адрес перед входом.
          </div>
          <Link href="/login" style={{ display: 'block', padding: '12px', borderRadius: 10, background: '#534AB7', color: '#FFFFFF', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Войти в систему
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1E1756', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 16, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1E1756', letterSpacing: 2 }}>СЦЕНА</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>Регистрация театра</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>О театре</div>
          <Field label="Название театра" value={form.theaterName} onChange={set('theaterName')} placeholder="Театр мимики и жеста" required />

          <div style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 20 }}>Администратор</div>
          <Field label="Ваше имя" value={form.adminName} onChange={set('adminName')} placeholder="Иванов Иван Иванович" required />
          <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="director@theater.ru" required />
          <Field label="Пароль" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          <Field label="Повторите пароль" type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required />

          {error && (
            <div style={{ background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#534AB7', color: '#FFFFFF', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
            {loading ? 'Регистрируем...' : 'Зарегистрировать театр'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
          Уже есть аккаунт?{' '}
          <Link href="/login" style={{ color: '#534AB7', fontWeight: 500, textDecoration: 'none' }}>Войти</Link>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  type?: string
  required?: boolean
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}
