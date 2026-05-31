import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, status_code, gross_amount, signature_key } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Verifikasi Signature Key secara lokal
    const serverKey = process.env.MIDTRANS_SERVER_KEY as string;
    const localSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (localSignature !== signature_key) {
      console.error(`Webhook: Invalid signature key for order ${order_id}`);
      return NextResponse.json({ error: 'Invalid signature key' }, { status: 403 });
    }

    // 2. Gunakan Midtrans Client untuk double-check status transaksi secara resmi
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: serverKey,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
    });

    const statusResponse = await snap.transaction.notification(body);
    const { transaction_status, fraud_status } = statusResponse;

    const isPaymentSuccess = 
      transaction_status === 'settlement' || 
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (!isPaymentSuccess) {
      return NextResponse.json({ 
        success: true, 
        message: `Webhook received. Payment is not successful (status: ${transaction_status})` 
      });
    }

    const db = supabaseAdmin!;

    // 3. Tarik data transaksi dari database
    const { data: txData, error: txError } = await db
      .from('transaksi')
      .select(`
        id,
        order_id,
        total_qty,
        total_bayar,
        event_id,
        category_id,
        status_pembayaran,
        user_id,
        ticket_categories:category_id (name)
      `)
      .eq('order_id', order_id)
      .single();

    if (txError || !txData) {
      console.error('Webhook: Error fetching transaction from database:', txError);
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // Jika transaksi sudah berstatus 'paid', kembalikan sukses
    if (txData.status_pembayaran === 'paid') {
      return NextResponse.json({ 
        success: true, 
        message: 'Transaksi sudah diproses sebelumnya' 
      });
    }

    // ⚡ DETEKSI TRANSAKSI BOOST EVENT
    const isBoostPayment = order_id.startsWith('BOOST-') || txData.category_id === null;

    if (isBoostPayment) {
      // 1. Update status transaksi menjadi paid
      const { error: updateTxError } = await db
        .from('transaksi')
        .update({ status_pembayaran: 'paid' })
        .eq('id', txData.id);

      if (updateTxError) {
        console.error('Webhook: Gagal memperbarui status transaksi boost:', updateTxError);
        throw new Error('Gagal memperbarui status transaksi boost');
      }

      // 2. Logika Aktivasi Boost di site_settings
      try {
        const boostedAt = new Date();
        const boostedUntil = new Date(boostedAt.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 hari aktif

        const { data: currentSetting } = await db
          .from("site_settings")
          .select("value")
          .eq("key", "boosted_events")
          .single();

        let currentList = [];
        if (currentSetting && Array.isArray(currentSetting.value)) {
          currentList = currentSetting.value.filter((b: any) => new Date(b.boosted_until) >= new Date());
        }

        if (!currentList.some((b: any) => b.event_id === txData.event_id)) {
          const newBoost = {
            event_id: txData.event_id,
            boosted_at: boostedAt.toISOString(),
            boosted_until: boostedUntil.toISOString(),
            price_paid: txData.total_bayar
          };
          const updatedList = [...currentList, newBoost];

          const { error: upsertError } = await db
            .from("site_settings")
            .upsert({ key: "boosted_events", value: updatedList });
            
          if (upsertError) throw upsertError;
        }

        // 3. Kirim Notifikasi ke EO
        const { data: eventData } = await db
          .from('events')
          .select('title')
          .eq('id', txData.event_id)
          .single();
        const eventTitle = eventData?.title || 'Event Anda';

        await db.from("notifications").insert({
          user_id: txData.user_id,
          title: "Event Boost Aktif! ⚡",
          message: `Pembayaran Rp ${Number(txData.total_bayar).toLocaleString('id-ID')} berhasil. Event "${eventTitle}" berhasil di-boost selama 3 hari.`,
          type: "success",
          is_read: false
        });

      } catch (boostError) {
        console.error('Webhook: Gagal mengaktifkan boost event:', boostError);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Pembayaran Boost berhasil diproses' 
      });
    }

    // 4. Update status transaksi menjadi paid
    const { error: updateTxError } = await db
      .from('transaksi')
      .update({ status_pembayaran: 'paid' })
      .eq('id', txData.id);

    if (updateTxError) {
      console.error('Webhook: Gagal memperbarui status transaksi:', updateTxError);
      throw new Error('Gagal memperbarui status transaksi');
    }

    // 4.5. Update uses_count voucher jika transaksi menggunakan voucher
    if (order_id && order_id.includes('-VCHR-')) {
      const voucherCode = order_id.split('-VCHR-')[1]?.toUpperCase();
      if (voucherCode) {
        try {
          const { data: voucherData } = await db
            .from('vouchers')
            .select('id, uses_count')
            .eq('code', voucherCode)
            .single();
          
          if (voucherData) {
            await db
              .from('vouchers')
              .update({ uses_count: (voucherData.uses_count || 0) + 1 })
              .eq('id', voucherData.id);
            console.log(`Webhook: Voucher ${voucherCode} uses_count incremented successfully.`);
          }
        } catch (vErr) {
          console.error('Webhook: Gagal mengupdate kuota voucher:', vErr);
        }
      }
    }

    // 5. Buat entri tiket baru di tabel tiket
    let seatCodes: string[] = [];
    if (order_id && order_id.includes('-SEAT-')) {
      const seatPart = order_id.split('-SEAT-')[1]?.split('-VCHR-')[0];
      if (seatPart) {
        seatCodes = seatPart.split('_');
      }
    }

    const ticketsToInsert = Array.from({ length: txData.total_qty }).map((_, idx) => ({
      transaksi_id: txData.id,
      event_id: txData.event_id,
      ticket_category_id: txData.category_id, 
      ticket_code: `TKT-${txData.order_id}-${idx}`, 
      seat_info: seatCodes[idx] 
        ? `${(txData.ticket_categories as any)?.name || 'REGULAR'} - ${seatCodes[idx]}`
        : ((txData.ticket_categories as any)?.name || 'REGULAR'), 
      status_checkin: false
    }));

    const { error: insertTicketsError } = await db
      .from('tiket')
      .insert(ticketsToInsert);

    if (insertTicketsError) {
      console.error('Webhook: Gagal memasukkan tiket:', insertTicketsError);
    }

    // 6. Jalankan RPC untuk mengurangi stok tiket
    const { error: stockError } = await db.rpc('decrement_ticket_stock', { 
      cat_id: txData.category_id, 
      qty: txData.total_qty 
    });

    if (stockError) {
      console.error('Webhook: Gagal mengurangi stok tiket:', stockError);
    }

    // 7. Berikan reward poin ke profil pengguna (50 poin per tiket)
    const earnedPoints = txData.total_qty * 50;
    const { data: profile, error: profileGetError } = await db
      .from('profiles')
      .select('points')
      .eq('id', txData.user_id)
      .single();

    if (!profileGetError && profile) {
      const newPoints = (profile.points || 0) + earnedPoints;
      const { error: profileUpdateError } = await db
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', txData.user_id);
      
      if (profileUpdateError) {
        console.error('Webhook: Gagal menambahkan poin pengguna:', profileUpdateError);
      }
    }

    // 8. Kirim notifikasi ke user
    try {
      const { data: eventData } = await db
        .from('events')
        .select('title')
        .eq('id', txData.event_id)
        .single();
      const eventTitle = eventData?.title || 'Event';

      await db.from("notifications").insert({
        user_id: txData.user_id,
        title: "Tiket Berhasil Dibeli! 🎫",
        message: `Pembelian ${txData.total_qty} tiket untuk event ${eventTitle} sukses. Selamat menikmati!`,
        type: "success",
        is_read: false
      });
    } catch (notifErr) {
      console.error('Webhook: Gagal mengirim notifikasi:', notifErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook diproses dengan sukses' 
    });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
