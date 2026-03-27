import { supabase } from '@/lib/supabase'
import PrintButton from './PrintButton'

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { year: yearStr, month: monthStr } = await searchParams
  const today = new Date()
  const year = yearStr ? parseInt(yearStr) : today.getFullYear()
  const month = monthStr ? parseInt(monthStr) : today.getMonth()

  const from = new Date(year, month, 1).toISOString()
  const to = new Date(year, month + 1, 0, 23, 59).toISOString()

  const { data: events } = await supabase
    .from('events')
    .select('*, venues(name), event_artists(artist_id, artists(full_name))')
    .gte('start_time', from)
    .lte('start_time', to)
    .order('start_time')

  const evList = events || []

  // Group events by day
  const byDay: Record<number, typeof evList> = {}
  for (const ev of evList) {
    const d = new Date(ev.start_time).getDate()
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(ev)
  }

  const typeLabel = (type: string) =>
    type === 'rehearsal' ? 'Репетиция' : type === 'performance' ? 'Спектакль' : 'Другое'

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const dayOfWeek = (day: number) => {
    const d = new Date(year, month, day)
    return DAYS_RU[(d.getDay() + 6) % 7]
  }

  const sortedDays = Object.keys(byDay).map(Number).sort((a, b) => a - b)

  return (
    <>
      <style>{`
        @media print {
          button { display: none !important; }
          body { margin: 0; }
          @page { margin: 15mm; size: A4; }
        }
        body { font-family: system-ui, sans-serif; color: #1a1a1a; background: white; }
      `}</style>
      <PrintButton />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 16, borderBottom: '2px solid #1E1756' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1E1756', letterSpacing: 1 }}>СЦЕНА</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Театр мимики и жеста (ТМЖ)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>Расписание</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{MONTHS_RU[month]} {year}</div>
          </div>
        </div>

        {evList.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '48px 0', fontSize: 15 }}>
            Нет событий в {MONTHS_RU[month]} {year}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1E1756', color: '#FFFFFF' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderRadius: '0' }}>Дата</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>День</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Событие</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Тип</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Время</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Площадка</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Артисты</th>
              </tr>
            </thead>
            <tbody>
              {sortedDays.map((day) =>
                byDay[day].map((ev, i) => (
                  <tr key={ev.id} style={{ background: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF', borderBottom: '1px solid #E0E0E0' }}>
                    {i === 0 ? (
                      <td rowSpan={byDay[day].length} style={{ padding: '10px 12px', fontWeight: 600, color: '#1E1756', verticalAlign: 'top', borderRight: '1px solid #E0E0E0' }}>
                        {day}
                      </td>
                    ) : null}
                    {i === 0 ? (
                      <td rowSpan={byDay[day].length} style={{ padding: '10px 12px', color: '#666', verticalAlign: 'top', borderRight: '1px solid #E0E0E0' }}>
                        {dayOfWeek(day)}
                      </td>
                    ) : null}
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{ev.title}</td>
                    <td style={{ padding: '10px 12px', color: ev.type === 'rehearsal' ? '#1D9E75' : '#534AB7' }}>
                      {typeLabel(ev.type)}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {formatTime(ev.start_time)}–{formatTime(ev.end_time)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#666' }}>
                      {ev.venues?.name || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#444', fontSize: 12 }}>
                      {ev.event_artists?.map((ea: any) => ea.artists?.full_name).filter(Boolean).join(', ') || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
          <span>Всего событий: {evList.length} · Спектаклей: {evList.filter(e => e.type === 'performance').length} · Репетиций: {evList.filter(e => e.type === 'rehearsal').length}</span>
          <span>scena-woad.vercel.app · {new Date().toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    </>
  )
}
