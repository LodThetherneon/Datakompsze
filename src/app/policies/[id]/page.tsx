import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PolicyViewPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!policy) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link href="/policies" className="text-[13px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
          ← Vissza a tájékoztatókhoz
        </Link>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
          v{policy.version}
        </span>
      </div>

      {/* A generált HTML tájékoztató megjelenítése */}
      <div
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        dangerouslySetInnerHTML={{ __html: policy.content_html }}
      />
    </div>
  );
}