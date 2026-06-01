import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import midtransClient from 'midtrans-client';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Authenticate: coba Authorization header dulu, fallback ke cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const db = supabaseAdmin!;
    let user = null;

    if (token) {
      const { data: { user: verifiedUser }, error: verifyError } = await db.auth.getUser(token);
      if (!verifyError && verifiedUser) {
        user = verifiedUser;
      }
    }

    // Fallback: cookie-based session
    if (!user) {
      const cookieStore = await cookies();
      const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore if called from a Server Component
              }
            },
          },
        }
      );
      const { data: { user: cookieUser } } = await supabaseClient.auth.getUser();
      user = cookieUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Ambil data transaksi
    const { data: tx, error: txError } = await db
      .from('transaksi')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (txError || !tx) {
      console.error(`Invoice API: Error fetching transaction ${orderId}:`, txError);
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // 3. Cek otorisasi — hanya pemilik transaksi atau admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    if (tx.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Ambil detail event, kategori, dan profil pembeli
    const { data: event } = await db.from('events').select('*').eq('id', tx.event_id).single();
    const { data: category } = await db.from('ticket_categories').select('*').eq('id', tx.category_id).single();
    const { data: buyerProfile } = await db.from('profiles').select('full_name, email').eq('id', tx.user_id).single();

    // 5. Ekstrak kode voucher dari Order ID (e.g. INV-123456-VCHR-PROMO10)
    let voucherCode = null;
    if (orderId.includes('-VCHR-')) {
      const parts = orderId.split('-VCHR-');
      if (parts[1]) {
        voucherCode = parts[1].split('-')[0].toUpperCase();
      }
    }

    // 6. Query Midtrans untuk mendapatkan transaction_id & metode pembayaran
    let midtransTxId = '-';
    let paymentMethod = 'FREE_BYPASS';
    let transactionTime = tx.created_at;

    if (tx.total_bayar > 0) {
      try {
        const snap = new midtransClient.Snap({
          isProduction: false,
          serverKey: process.env.MIDTRANS_SERVER_KEY as string,
          clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
        });

        const statusResponse = await snap.transaction.status(orderId);
        midtransTxId = statusResponse.transaction_id || '-';
        paymentMethod = statusResponse.payment_type
          ? statusResponse.payment_type.toUpperCase().replace(/_/g, ' ')
          : 'MIDTRANS_GATEWAY';
        transactionTime = statusResponse.transaction_time || tx.created_at;
      } catch (midtransError: any) {
        console.warn(`Invoice API: Midtrans query failed for ${orderId}:`, midtransError.message);
        midtransTxId = `TXN-${orderId.slice(-8).toUpperCase()}`;
        paymentMethod = 'MIDTRANS_SANDBOX';
        transactionTime = tx.created_at;
      }
    }

    // 7. Hitung billing breakdown — FORMULA HARUS SAMA PERSIS DENGAN CHECKOUT PAGE
    //
    //   Checkout: totalBayar = afterDiscount + round(afterDiscount * 0.11) + 2500
    //   Dimana:   afterDiscount = (harga_satuan * qty) - diskon_voucher
    //
    //   Reverse dari total_bayar:
    //     afterDiscount + PPN + 2500 = total_bayar
    //     afterDiscount * 1.11 = total_bayar - 2500
    //     afterDiscount = round((total_bayar - 2500) / 1.11)
    //     PPN = total_bayar - 2500 - afterDiscount
    //
    //   Diskon = originalSubtotal - afterDiscount  (jika > 0)

    const categoryPrice = category ? category.price : 0;
    const originalSubtotal = categoryPrice * tx.total_qty;

    let platformFee = 0;
    let afterDiscount = 0;
    let calculatedTax = 0;
    let calculatedDiscount = 0;

    if (tx.total_bayar > 0) {
      platformFee = 2500;
      afterDiscount = Math.round((tx.total_bayar - platformFee) / 1.11);
      calculatedTax = tx.total_bayar - platformFee - afterDiscount;
      calculatedDiscount = Math.max(0, originalSubtotal - afterDiscount);
    } else {
      // Tiket gratis: diskon = seluruh harga asli, fee = 0
      calculatedDiscount = originalSubtotal;
    }

    return NextResponse.json({
      success: true,
      invoice: {
        order_id: tx.order_id,
        created_at: tx.created_at,
        status_pembayaran: tx.status_pembayaran,
        midtrans_transaction_id: midtransTxId,
        payment_method: paymentMethod,
        transaction_time: transactionTime,
        buyer: {
          name: buyerProfile?.full_name || 'Guest',
          email: buyerProfile?.email || '-'
        },
        event: {
          title: event?.title || 'Unknown Event',
          date: event?.date || '-',
          location: event?.location || '-',
          image_url: event?.image_url || null,
          category: event?.category || 'EVENT'
        },
        ticket: {
          category_name: category?.name || 'General Admission',
          qty: tx.total_qty,
          price: categoryPrice
        },
        breakdown: {
          original_subtotal: originalSubtotal,  // harga asli sebelum diskon (price * qty)
          discount: calculatedDiscount,           // potongan voucher
          after_discount: afterDiscount,          // subtotal setelah diskon, sebelum PPN
          tax: calculatedTax,                     // PPN 11% dari after_discount
          platform_fee: platformFee,              // biaya layanan platform
          voucher_code: voucherCode,
          total_bayar: tx.total_bayar             // GRAND TOTAL = after_discount + tax + platform_fee
        }
      }
    });

  } catch (error: any) {
    console.error('Invoice API Router Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
