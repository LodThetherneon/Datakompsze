import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";

async function saveCompany(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("companies").upsert(
    {
      user_id: user.id,
      name: formData.get("name") as string,
      tax_number: formData.get("tax_number") as string,
      registration_number: formData.get("registration_number") as string,
      headquarters: formData.get("headquarters") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      dpo_name: formData.get("dpo_name") as string,
      dpo_email: formData.get("dpo_email") as string,
      hosting_provider_name: formData.get("hosting_provider_name") as string,
      hosting_provider_address: formData.get("hosting_provider_address") as string,
      hosting_provider_email: formData.get("hosting_provider_email") as string,
    },
    { onConflict: "user_id" }
  );

  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let company: any = null;
  if (user) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .single();
    company = data;
  }

  const Field = ({ label, name, placeholder, defaultValue }: {
    label: string; name: string; placeholder?: string; defaultValue?: string;
  }) => (
    <div>
      <label className="text-[13px] font-semibold text-slate-600 block mb-1.5">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[14px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <header className="pb-6 border-b border-slate-200/80">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Beállítások</h1>
        <p className="text-[14px] text-slate-500 mt-2 font-medium">
          Ezek az adatok bekerülnek a generált GDPR tájékoztatókba. Töltsd ki minél pontosabban.
        </p>
      </header>

      <form action={saveCompany} className="space-y-6">

        {/* CÉGES ADATOK */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="text-[15px] font-bold text-slate-800 pb-2 border-b border-slate-100">🏢 Adatkezelő cég adatai</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Cégnév *" name="name" placeholder="pl. Kovács Kft." defaultValue={company?.name} />
            <Field label="Adószám" name="tax_number" placeholder="pl. 12345678-2-02" defaultValue={company?.tax_number} />
            <Field label="Cégjegyzékszám" name="registration_number" placeholder="pl. 01-09-123456" defaultValue={company?.registration_number} />
            <Field label="E-mail cím" name="email" placeholder="pl. info@cegnev.hu" defaultValue={company?.email} />
            <Field label="Telefonszám" name="phone" placeholder="pl. +36 30 123 4567" defaultValue={company?.phone} />
            <Field label="Székhely" name="headquarters" placeholder="pl. 1234 Budapest, Fő utca 1." defaultValue={company?.headquarters} />
          </div>
        </section>

        {/* DPO ADATOK */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="text-[15px] font-bold text-slate-800 pb-2 border-b border-slate-100">👤 Adatvédelmi tisztviselő (DPO)</h2>
          <p className="text-[12px] text-slate-500">Ha nincs kinevezett DPO-d, hagyd üresen — a tájékoztató ezt automatikusan kezeli.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="DPO neve" name="dpo_name" placeholder="pl. Kiss János" defaultValue={company?.dpo_name} />
            <Field label="DPO e-mail" name="dpo_email" placeholder="pl. dpo@cegnev.hu" defaultValue={company?.dpo_email} />
          </div>
        </section>

        {/* TÁRHELY */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="text-[15px] font-bold text-slate-800 pb-2 border-b border-slate-100">🖥️ Tárhelyszolgáltató</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Szolgáltató neve" name="hosting_provider_name" placeholder="pl. Vercel Inc." defaultValue={company?.hosting_provider_name} />
            <Field label="Szolgáltató e-mail" name="hosting_provider_email" placeholder="pl. privacy@vercel.com" defaultValue={company?.hosting_provider_email} />
            <div className="md:col-span-2">
              <Field label="Szolgáltató címe" name="hosting_provider_address" placeholder="pl. 440 N Barranca Ave, Covina, CA 91723, USA" defaultValue={company?.hosting_provider_address} />
            </div>
          </div>
        </section>

        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 text-[14px] font-bold">
          Adatok mentése
        </Button>

      </form>
    </div>
  );
}