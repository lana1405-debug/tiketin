import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, gross_amount, first_name, email, item_name } = body;

    // Panggil Midtrans
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY as string,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
    });

    let parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: gross_amount
      },
      customer_details: {
        first_name: first_name,
        email: email
      },
      item_details: [{
        id: "TKT-1",
        price: gross_amount,
        quantity: 1,
        name: item_name
      }]
    };

    const transaction = await snap.createTransaction(parameter);
    
    // Balikin token ke Frontend
    return NextResponse.json({ token: transaction.token });

  } catch (error: any) {
    console.error("Midtrans Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}