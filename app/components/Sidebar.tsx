'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function PrintLink() {
  const now = new Date()
  const href = `/print?year=${now.getFullYear()}&month=${now.getMonth()}`
  return (
    <Link href={href} target="_blank" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ fontSize: 12, color: '#9B96D4', padding: '6px 0', cursor: 'pointer' }}>
        🖨 Печать расписания
      </div>
    </Link>
  )
}

const NAV = [
  { label: 'Расписание',  href: '/' },
  { label: 'Репертуар',   href: '/repertoire' },
  { label: 'Артисты',     href: '/artists' },
  { label: 'Гастроли',    href: '/tours' },
  { label: 'Площадки',    href: '/venues' },
  { label: 'Отчёты',      href: '/reports' },
]

const MOBILE_NAV = [
  { label: 'Расписание', href: '/',          icon: '📅' },
  { label: 'Артисты',    href: '/artists',   icon: '👥' },
  { label: 'Гастроли',   href: '/tours',     icon: '✈️' },
  { label: 'Отчёты',     href: '/reports',   icon: '📊' },
]

export function Sidebar({ theaterName }: { theaterName?: string }) {
  const path = usePathname()
  return (
    <div style={{ width: 220, background: '#1E1756', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2D2580' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', letterSpacing: 1 }}>СЦЕНА</div>
        <div style={{ fontSize: 11, color: '#9B96D4', marginTop: 4 }}>Система управления</div>
      </div>
      {NAV.map(item => {
        const active = item.href === '/' ? path === '/' : path.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '11px 20px', fontSize: 13, cursor: 'pointer', marginTop: 2, color: active ? '#FFFFFF' : '#9B96D4', background: active ? '#2D2580' : 'transparent', borderLeft: active ? '3px solid #7F77DD' : '3px solid transparent', fontWeight: active ? 500 : 400 }}>
              {item.label}
            </div>
          </Link>
        )
      })}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '12px 20px', borderTop: '1px solid #2D2580' }}>
        <PrintLink />
      </div>
      <div style={{ padding: '12px 20px', fontSize: 12, color: '#9B96D4', borderTop: '1px solid #2D2580' }}>
        <div style={{ fontWeight: 500, color: '#FFFFFF' }}>{theaterName || 'Театр'}</div>
        <div style={{ marginTop: 2 }}>Администратор</div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
          style={{ marginTop: 8, fontSize: 11, color: '#9B96D4', background: 'none', border: '1px solid #2D2580', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', width: '100%' }}>
          Выйти
        </button>
      </div>
    </div>
  )
}

export function MobileNav() {
  const path = usePathname()
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1E1756', display: 'flex', padding: '10px 0 16px', zIndex: 100 }}>
      {MOBILE_NAV.map(item => {
        const active = item.href === '/' ? path === '/' : path.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{item.icon}</div>
              <div style={{ fontSize: 10, color: active ? '#FFFFFF' : '#9B96D4', marginTop: 2, fontWeight: active ? 600 : 400 }}>{item.label}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
