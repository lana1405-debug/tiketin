import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const file = formData.get('file') as File;

    if (!id || !file) {
      return NextResponse.json({ error: 'ID dan file wajib diisi' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY tidak diset' },
        { status: 500 }
      );
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Convert File to ArrayBuffer then Buffer/Uint8Array for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to 'withdrawal_receipts' bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('withdrawal_receipts')
      .upload(filePath, buffer, {
        contentType: file.type,
        duplex: 'half'
      } as any);

    if (uploadError) {
      console.error('Upload error in API:', uploadError);
      return NextResponse.json({ error: 'Gagal mengupload file ke storage: ' + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('withdrawal_receipts')
      .getPublicUrl(filePath);

    // Update withdrawals status and receipt_url
    const { error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'completed',
        receipt_url: publicUrl
      })
      .eq('id', id);

    if (updateError) {
      console.error('DB update error in API:', updateError);
      return NextResponse.json({ error: 'Gagal mengupdate database: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, publicUrl });
  } catch (error: any) {
    console.error('Upload receipt API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
