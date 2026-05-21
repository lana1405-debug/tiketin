import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Inisialisasi Midtrans Snap Client
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY as string,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
    });

    // 2. Query status ke API Midtrans
    let midtransResponse;
    try {
      midtransResponse = await snap.transaction.status(order_id);
    } catch (midtransError: any) {
      console.error(`Midtrans status check failed for order ${order_id}:`, midtransError);
      return NextResponse.json({ error: `Midtrans status query failed: ${midtransError.message}` }, { status: 500 });
    }

    const { transaction_status, fraud_status } = midtransResponse;
    
    // Status sukses jika settlement atau capture dengan fraud_status = accept
    const isPaymentSuccess = 
      transaction_status === 'settlement' || 
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (!isPaymentSuccess) {
      return NextResponse.json({ 
        success: false, 
        message: `Status pembayaran belum sukses. Status saat ini: ${transaction_status}` 
      });
    }

    // 3. Ambil data transaksi dari Supabase
    const { data: txData, error: txError } = await supabase
      .from('transaksi')
      .select(`
        id,
        order_id,
        total_qty,
        event_id,
        category_id,
        status_pembayaran,
        user_id,
        ticket_categories:category_id (name)
      `)
      .eq('order_id', order_id)
      .single();

    if (txError || !txData) {
      console.error('Error fetching transaction from database:', txError);
      return NextResponse.json({ error: 'Transaksi tidak ditemukan di database' }, { status: 404 });
    }

    // Jika transaksi sudah lunas, langsung return success agar tidak duplikat tiket/poin
    if (txData.status_pembayaran === 'paid') {
      return NextResponse.json({ 
        success: true, 
        message: 'Transaksi sudah diproses sebelumnya (Lunas)' 
      });
    }

    // 4. Update status transaksi menjadi paid
    const { error: updateTxError } = await supabase
      .from('transaksi')
      .update({ status_pembayaran: 'paid' })
      .eq('id', txData.id);

    if (updateTxError) {
      console.error('Gagal memperbarui status transaksi:', updateTxError);
      throw new Error('Gagal memperbarui status transaksi di database');
    }

    // 4.5. Update uses_count voucher jika transaksi menggunakan voucher
    if (order_id && order_id.includes('-VCHR-')) {
      const voucherCode = order_id.split('-VCHR-')[1]?.toUpperCase();
      if (voucherCode) {
        try {
          const { data: voucherData } = await supabase
            .from('vouchers')
            .select('id, uses_count')
            .eq('code', voucherCode)
            .single();
          
          if (voucherData) {
            await supabase
              .from('vouchers')
              .update({ uses_count: (voucherData.uses_count || 0) + 1 })
              .eq('id', voucherData.id);
            console.log(`Voucher ${voucherCode} uses_count incremented successfully.`);
          }
        } catch (vErr) {
          console.error('Gagal mengupdate kuota voucher:', vErr);
        }
      }
    }

    // 5. Buat entri tiket baru di tabel tiket
    const ticketsToInsert = Array.from({ length: txData.total_qty }).map((_, idx) => ({
      transaksi_id: txData.id,
      event_id: txData.event_id,
      ticket_category_id: txData.category_id, 
      ticket_code: `TKT-${txData.order_id}-${idx}`, 
      seat_info: (txData.ticket_categories as any)?.name || 'REGULAR', 
      status_checkin: false
    }));

    const { error: insertTicketsError } = await supabase
      .from('tiket')
      .insert(ticketsToInsert);

    if (insertTicketsError) {
      console.error('Gagal memasukkan tiket:', insertTicketsError);
      // Log error, tapi kita lanjutkan untuk memotong stok & memberi poin untuk mitigasi kegagalan
    }

    // 6. Jalankan RPC untuk mengurangi stok tiket secara aman
    const { error: stockError } = await supabase.rpc('decrement_ticket_stock', { 
      cat_id: txData.category_id, 
      qty: txData.total_qty 
    });

    if (stockError) {
      console.error('Gagal mengurangi stok tiket:', stockError);
    }

    // 7. Berikan reward poin ke profil pengguna (50 poin per tiket)
    const earnedPoints = txData.total_qty * 50;
    const { data: profile, error: profileGetError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', txData.user_id)
      .single();

    if (!profileGetError && profile) {
      const newPoints = (profile.points || 0) + earnedPoints;
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', txData.user_id);
      
      if (profileUpdateError) {
        console.error('Gagal menambahkan poin pengguna:', profileUpdateError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Transaksi berhasil disinkronisasi dan diverifikasi lunas.' 
    });

  } catch (error: any) {
    console.error('API Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
