import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PoliciesPage() {
  return (
    <div className="p-8 lg:p-10 font-sans space-y-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Adatkezelési Tájékoztatók</h1>
          <p className="text-gray-600 mt-2">
            Naprakész és korábbi verziók, letöltéssel és beágyazó kóddal. A DataKomp automatikusan verziózza a módosításokat.
          </p>
        </div>
        <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
          Új tájékoztató generálása
        </Button>
      </header>

      {/* AKTUÁLIS TÁJÉKOZTATÓK */}
      <section className="space-y-4">
        {/* 1. Webshop tájékoztató */}
        <Card className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Webshop adatkezelési tájékoztató</CardTitle>
              <CardDescription>
                Fő értékesítési oldal – vásárlók, regisztrált felhasználók és hírlevél-feliratkozók adatai.
              </CardDescription>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div className="font-semibold text-gray-700">Aktuális verzió</div>
              <div>v1.4 – 2026. 04. 08. 21:15</div>
              <div className="mt-1 text-green-600 font-semibold">Naprakész</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div><span className="font-semibold">Formátumok:</span> HTML beágyazó kód, PDF, DOCX</div>
                <div>
                  <span className="font-semibold">Érintett rendszerek:</span>{" "}
                  Webshop, Google Analytics, Mailchimp, Facebook Pixel
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button size="sm">PDF letöltése</Button>
                <Button size="sm" variant="outline">DOCX letöltése</Button>
                <Button size="sm" variant="outline">Beágyazó kód másolása</Button>
              </div>
            </div>

            {/* Verziótörténet ehhez a tájékoztatóhoz */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Verziótörténet
                </span>
                <span className="text-xs text-gray-500">
                  A korábbi tájékoztatók tartalma jogvita esetén visszakereshető.
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs md:text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Verzió</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Érvényesség időszaka</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Változás oka</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Művelet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-100/70 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-800">v1.4</td>
                      <td className="px-3 py-2 text-gray-700">2026. 04. 08. – jelenleg is érvényes</td>
                      <td className="px-3 py-2 text-gray-700">Új hírlevél űrlap + sütikezelés pontosítása</td>
                      <td className="px-3 py-2 text-right">
                        <button className="text-blue-600 hover:underline">Megnyitás / Letöltés</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-100/70 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-800">v1.3</td>
                      <td className="px-3 py-2 text-gray-700">2025. 11. 10. – 2026. 04. 08.</td>
                      <td className="px-3 py-2 text-gray-700">Google Analytics 4 átállás</td>
                      <td className="px-3 py-2 text-right">
                        <button className="text-blue-600 hover:underline">Megnyitás / Letöltés</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-100/70 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-800">v1.2</td>
                      <td className="px-3 py-2 text-gray-700">2024. 05. 01. – 2025. 11. 10.</td>
                      <td className="px-3 py-2 text-gray-700">ÁSZF változás + cookie-sáv bevezetése</td>
                      <td className="px-3 py-2 text-right">
                        <button className="text-blue-600 hover:underline">Megnyitás / Letöltés</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Blog / tartalom oldal tájékoztató */}
        <Card className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Blog / Tartalommarketing oldal tájékoztató</CardTitle>
              <CardDescription>
                Cookie-k, analitika és kapcsolati űrlapok által kezelt adatok.
              </CardDescription>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div className="font-semibold text-gray-700">Aktuális verzió</div>
              <div>v0.9 – 2025. 11. 02. 18:40</div>
              <div className="mt-1 text-yellow-700 font-semibold">Felülvizsgálat javasolt</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div><span className="font-semibold">Formátumok:</span> HTML beágyazó kód, PDF</div>
                <div><span className="font-semibold">Érintett rendszerek:</span> Blog, Google Analytics</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button size="sm">PDF letöltése</Button>
                <Button size="sm" variant="outline">Beágyazó kód másolása</Button>
              </div>
            </div>

            {/* Rövid verziótörténet ehhez is */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Verziótörténet
              </span>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center justify-between">
                  <span>v0.9 – 2025. 11. 02. – Aktuális változat</span>
                  <button className="text-blue-600 hover:underline">Megnyitás</button>
                </li>
                <li className="flex items-center justify-between">
                  <span>v0.8 – 2024. 03. 01. – Első generált verzió</span>
                  <button className="text-blue-600 hover:underline">Megnyitás</button>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}