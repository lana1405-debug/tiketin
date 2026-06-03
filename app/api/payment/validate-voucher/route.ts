import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, event_id } = body;

    if (!code) {
      return NextResponse.json({ error: 'Kode voucher harus diisi' }, { status: 400 });
    }

    if (!event_id) {
      return NextResponse.json({ error: 'Event ID harus diisi' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;
    const codeUpper = code.toUpperCase().replace(/\s+/g, "");
    const { data: voucher, error } = await db
      .from('vouchers')
      .select('*')
      .eq('code', codeUpper)
      .single();

    if (error || !voucher) {
      return NextResponse.json({ error: 'KODE VOUCHER TIDAK VALID!' }, { status: 400 });
    }

    // Pastikan voucher diperuntukkan untuk event ini
    if (voucher.event_id && voucher.event_id !== event_id) {
      return NextResponse.json({ error: 'VOUCHER TIDAK DAPAT DIGUNAKAN UNTUK EVENT INI!' }, { status: 400 });
    }

    const now = new Date();
    const validFrom = new Date(voucher.valid_from);
    const validTo = new Date(voucher.valid_to);

    if (now < validFrom) {
      return NextResponse.json({ error: 'VOUCHER BELUM DAPAT DIGUNAKAN!' }, { status: 400 });
    }

    if (now > validTo) {
      return NextResponse.json({ error: 'VOUCHER SUDAH KEDALUWARSA!' }, { status: 400 });
    }

    if (voucher.max_uses !== null && voucher.uses_count >= voucher.max_uses) {
      return NextResponse.json({ error: 'KUOTA VOUCHER SUDAH HABIS!' }, { status: 400 });
    }

    return NextResponse.json({ success: true, voucher });

  } catch (error: any) {
    console.error('Validate Voucher Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
