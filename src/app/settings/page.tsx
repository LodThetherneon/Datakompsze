import { createClient } from "@/utils/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let company: any = null;
  if (user) {
    const { data } = await supabase
      .from("companies").select("*").eq("user_id", user.id).single();
    company = data;
  }

  return (
    <div className="max-w-4xl space-y-10 font-sans">

      <header className="pb-6 border-b border-slate-200/80">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Beállítások</h1>
        <p className="text-[14px] text-slate-500 mt-2 font-medium">
          Hamarosan...
        </p>
      </header>

    </div>
  );
}