import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PolicyViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('id', id)
    .single();

  if (!policy) notFound();

  return (
    <div className="-m-6 lg:-m-12 xl:-mx-16">
      {/* Visszagomb sáv */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <Link
          href="/policies"
          className="text-[13px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
        >
          ← Vissza a tájékoztatókhoz
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
            v{policy.version}
          </span>
          <a
            href={`/api/policies/${id}/download`}
            className="text-[12px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
          >
            Letöltés
          </a>
        </div>
      </div>

      {/* A generált HTML tájékoztató */}
      <div
        className="w-full bg-white min-h-screen"
        dangerouslySetInnerHTML={{ __html: policy.content_html }}
      />
    </div>
  );
}