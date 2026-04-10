import { createClient } from "@/utils/supabase/server";
import { SettingsForm } from "@/app/settings/settings-form";
import { saveCompanySettings } from "@/app/settings/actions";
import { Building2 } from "lucide-react";

export default async function CompanyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let company: any = null;
  if (user) {
    const { data } = await supabase
      .from("companies").select("*").eq("user_id", user.id).single();
    company = data;
  }

  return (
    <div className="max-w-3xl space-y-8 font-sans">
      <header className="pb-6 border-b border-slate-200/80">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Cégadatok</h1>
        <p className="text-[14px] text-slate-500 mt-2 font-medium">
          Az adatkezelési tájékoztatókhoz felhasznált vállalati adatok.
        </p>
      </header>

      <SettingsForm company={company} saveAction={saveCompanySettings} />
    </div>
  );
}