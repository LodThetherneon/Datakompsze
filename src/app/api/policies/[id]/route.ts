import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: policy } = await supabase
    .from('policies')
    .select('content_html')
    .eq('id', id)
    .single();

  if (!policy) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(policy.content_html, {
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache'
  },
});
}