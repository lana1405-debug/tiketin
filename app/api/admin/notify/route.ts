import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// API route untuk admin mengirim notifikasi ke user
// Menggunakan supabaseAdmin (service_role) untuk bypass RLS
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, title, message, type = 'info' } = body;

    if (!user_id || !title || !message) {
      return NextResponse.json(
        { error: 'user_id, title, dan message wajib diisi' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY tidak diset' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Gagal insert notifikasi via admin API:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Admin notify API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
