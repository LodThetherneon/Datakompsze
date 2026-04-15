import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Server configuration error', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: policy, error } = await supabase
    .from('policies')
    .select('content_html, version')
    .eq('id', id)
    .single();

  if (error) {
    return new NextResponse('Database error: ' + error.message, { status: 500 });
  }

  if (!policy) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Csak a generált content_html-t adjuk vissza – saját fejléc/lábléc nélkül
  return new NextResponse(policy.content_html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}