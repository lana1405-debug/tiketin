import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ⚡ Tambahkan ekstraksi item_id dan quantity dari request frontend
    const { order_id, gross_amount, first_name, email, item_name, item_id, quantity = 1 } = body;

    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY as string,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
    });

    const roundedPrice = Math.round(gross_amount / quantity);
    const exactGrossAmount = roundedPrice * quantity;

    let parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: exactGrossAmount
      },
      customer_details: {
        first_name: first_name,
        email: email
      },
      item_details: [{
        id: item_id, // ⚡ Sekarang menggunakan ID dinamis
        price: roundedPrice, // ⚡ Harga satuan bulat agar validasi Midtrans lolos
        quantity: quantity, // ⚡ Kuantitas dinamis
        name: item_name
      }]
    };

    const transaction = await snap.createTransaction(parameter);
    
    return NextResponse.json({ token: transaction.token });

  } catch (error: any) {
    console.error("Midtrans Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}