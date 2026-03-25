import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { data, error } = await supabase
    .from('event_artists')
    .insert([{ event_id: body.event_id, artist_id: body.artist_id }])
    .select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { error } = await supabase
    .from('event_artists')
    .delete()
    .eq('event_id', body.event_id)
    .eq('artist_id', body.artist_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}