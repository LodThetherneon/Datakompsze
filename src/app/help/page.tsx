import { 
  LayoutDashboard, Database, FileText, FolderKanban, 
  Building2, Settings, ChevronRight, ShieldAlert,
  Users, UserCog, Trash2, UserPlus
} from 'lucide-react'
import Link from 'next/link'

const sections = [
  {
    id: 'iranyitopult',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: 'Irányítópult',
    description: 'Az Irányítópult a rendszer főoldala, átfogó képet ad az összes bekötött forrásról és azok állapotáról.',
    items: [
      {
        q: 'Mit jelent a Megfelelőségi szint?',
        a: 'A megfelelőségi szint megmutatja, hogy az összes rögzített adatkezelési folyamat hány százalékánál van érvényes, jóváhagyott dokumentáció. 100% azt jelenti, hogy minden adatkezelés szerepel a tájékoztatókban és nincs függőben lévő jóváhagyás.',
      },
      {
        q: 'Mit jelent a "Függőben" állapot?',
        a: 'Ha egy weboldal scannelése során új adatkezelési típus kerül felismerésre, amelyet még nem hagytak jóvá, az adott forrás "Függőben" állapotba kerül. Ilyenkor az Kezelt adattípusok oldalon kell az új elemeket áttekinteni és jóváhagyni.',
      },
      {
        q: 'Hogyan adhatok hozzá új weboldalt vagy rendszert?',
        a: 'Az Irányítópult jobb felső sarkában az "Új kapcsolat hozzáadása" gombra kattintva megjelenik egy párbeszédablak. Megadhatja a weboldal URL-jét, vagy belső (offline) rendszer esetén egy egyedi nevet.',
      },
      {
        q: 'Mit jelent az "Újraszkennelés" gomb?',
        a: 'A Gyorsművelet kártyán vagy a lista sorában az újraszkennelés indítja el a kiválasztott weboldal automatikus elemzését. A rendszer megvizsgálja az oldal sütihasználatát és adatkezelési elemeit, majd frissíti az adattípusok listáját.',
      },
      {
        q: 'Mit jelent az "Összes tájékoztató frissítése" gomb?',
        a: 'Ez a gomb egyszerre regenerálja az összes bekötött forráshoz tartozó adatkezelési tájékoztatót a legfrissebb adatok alapján. Akkor érdemes használni, ha több forrásban is változás történt.',
      },
    ],
  },
  {
    id: 'adattipusok',
    icon: Database,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Kezelt adattípusok',
    description: 'A Kezelt adattípusok oldal tartalmazza az összes rögzített adatkezelési folyamatot mind az automatikusan szkennelt, mind a manuálisan felvitt elemeket.',
    items: [
      {
        q: 'Mi a különbség a szkennelt és a manuális adattípus között?',
        a: 'A szkennelt (automatikus) adattípusokat a rendszer automatikusan felismeri a weboldal elemzése során például sütiket, nyomkövetőket, harmadik féltől származó szkripteket. A manuális adattípusokat Ön veszi fel kézzel, jellemzően belső rendszerekhez (pl. CRM, HR-szoftver), ahol az automatikus elemzés nem alkalmazható.',
      },
      {
        q: 'Hogyan vihetek fel manuálisan adattípust?',
        a: 'Az "Új adattípus felvitele" gombra kattintva megjelenik egy párbeszédablak. Ki kell választani a rendszert/weboldalt, az adattípus kategóriáját (pl. Elérhetőségek, Pénzügyi adatok), meg kell adni a konkrét kezelt adatot, az adatkezelés célját, és a megőrzési időt.',
      },
      {
        q: 'Mit jelent az "Elfogad" gomb egy adattípusnál?',
        a: 'Az automatikusan felismert, de még nem jóváhagyott adattípusok "Függőben" állapotban vannak. Az elfogadás azt jelzi, hogy Ön áttekintette és jóváhagyta az adott adatkezelési elemet ezután az bekerülhet a generált tájékoztatókba.',
      },
      {
        q: 'Mit jelent az "Összes elfogadása" gomb?',
        a: 'Egyszerre hagyja jóvá az összes függőben lévő adattípust. Csak akkor használja, ha már áttekintette a listát és minden elem helyesnek tűnik.',
      },
      {
        q: 'Hogyan szűrhetem az adattípusokat?',
        a: 'A lista felett szűrőket talál: szűrhet forrás szerint (melyik weboldal/rendszer), státusz szerint (összes / függőben / elfogadott), és adatforrás típusa szerint (szkennelt / manuális). A keresőmezőbe beírva az adattípus neve vagy kategóriája szerint is szűkíthet.',
      },
    ],
  },
  {
    id: 'nyilvantartas',
    icon: FolderKanban,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Folyamatnyilvántartás',
    description: 'A Folyamatnyilvántartás az adatkezelési tevékenységek részletes, strukturált nyilvántartása a GDPR 30. cikke szerinti kötelező dokumentáció.',
    items: [
      {
        q: 'Mire szolgál a folyamatnyilvántartás?',
        a: 'A GDPR 30. cikke kötelezővé teszi az adatkezelési tevékenységek nyilvántartását minden olyan szervezet számára, amely 250 főnél több munkavállalót foglalkoztat, vagy rendszeres, nagy kockázatú adatkezelést végez. Ez a nyilvántartás hatósági ellenőrzés esetén bemutatható.',
      },
      {
        q: 'Hogyan adhatok hozzá új folyamatot?',
        a: 'Az "Új folyamat rögzítése" gombra kattintva megjelenik egy kitöltendő párbeszédablak. Meg kell adni a folyamat nevét, célját, az érintett személyek körét, az adattípusokat, a jogalapot és a megőrzési időt.',
      },
      {
        q: 'Szerkeszthetek egy meglévő folyamatbejegyzést?',
        a: 'Igen, a lista bármely sorra kattintva módosíthatja a bejegyzést. A változtatások azonnal mentésre kerülnek.',
      },
    ],
  },
  {
    id: 'tajekoztatók',
    icon: FileText,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Tájékoztatók',
    description: 'A Tájékoztatók oldalon generálhatja, tekintheti meg és kezelheti az adatkezelési tájékoztatókat forrásonként külön-külön.',
    items: [
      {
        q: 'Hogyan generálhatok tájékoztatót?',
        a: 'A Tájékoztatók oldalon válassza ki a forrást (weboldalt vagy rendszert), majd kattintson a "Tájékoztató generálása" gombra. A rendszer az adott forráshoz rögzített összes jóváhagyott adattípus alapján automatikusan létrehozza a dokumentumot.',
      },
      {
        q: 'Mikor kell frissíteni a tájékoztatót?',
        a: 'Frissítés szükséges, ha: új adattípust adott hozzá, meglévőt módosított vagy törölt, az adatkezelés célja vagy jogalapja változott, illetve ha az automatikus scan új elemeket talált és azokat jóváhagyta.',
      },
      {
        q: 'Mit jelent a tájékoztató verziószáma?',
        a: 'Minden generáláskor a verziószám eggyel nő (pl. v1 → v2). Az Irányítópulton és a forráslistában mindig az aktuális verziószám látható. A korábbi verziók nem törlődnek, megőrzésre kerülnek.',
      },
      {
        q: 'Le tudom tölteni a tájékoztatót?',
        a: 'Igen, a generált tájékoztató DOCX formátumban letölthető a dokumentum nézetéből. A fájl közvetlenül beilleszthető weboldalra vagy elküldhető érintetteknek.',
      },
      {
        q: 'Előnézeti linket is generálhatok?',
        a: 'Igen, minden tájékoztatóhoz elérhető egy nyilvános előnézeti link, amelyet közvetlenül beilleszthet a weboldal láblécébe vagy sütikezelő rendszerébe.',
      },
    ],
  },
  {
    id: 'cegadatok',
    icon: Building2,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    title: 'Cégadatok',
    description: 'A Cégadatok oldalon adhatja meg szervezete alapadatait, amelyek automatikusan bekerülnek a generált tájékoztatókba.',
    items: [
      {
        q: 'Milyen adatokat kell megadni?',
        a: 'A legfontosabb adatok: cégnév, székhely, adószám, adatvédelmi tisztviselő neve és elérhetősége (ha van), kapcsolattartó e-mail cím. Ezek az adatok megjelennek minden generált tájékoztatóban az adatkezelő azonosítójaként.',
      },
      {
        q: 'Ha módosítom a cégadatokat, frissülnek a tájékoztatók is?',
        a: 'A cégadatok módosítása nem frissíti automatikusan a már generált tájékoztatókat. A változtatás után érdemes újragenerálni az érintett dokumentumokat a Tájékoztatók oldalon.',
      },
    ],
  },
  {
    id: 'beallitasok',
    icon: Settings,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    title: 'Beállítások',
    description: 'A Beállítások oldalon kezelheti előfizetését, megtekintheti a rendelkezésre álló csomagokat és a rendszer-kvótákat.',
    items: [
      {
        q: 'Mit jelent a rendszer-kvóta?',
        a: 'A kvóta azt jelzi, hogy az adott előfizetési csomagban hány weboldalt/rendszert lehet bekötni. A Free csomag 3 forrást, a Pro csomag 30 forrást engedélyez, a Max csomag korlátlan.',
      },
      {
        q: 'Hogyan válthatok csomagot?',
        a: 'A Beállítások oldalon a "Csomag bővítése" gombra, vagy a sidebar alján a kvóta kártyán a "Csomag bővítése" linkre kattintva érheti el az elérhető előfizetési lehetőségeket.',
      },
    ],
  },
  {
    id: 'adminpanel',
    icon: ShieldAlert,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    title: 'Admin panel',
    description: 'Az Admin panel kizárólag superadmin és admin jogosultságú felhasználók számára érhető el. Itt kezelheti a rendszer összes felhasználóját, szerepkörét és céghez rendelését.',
    items: [
      {
        q: 'Hogyan érhető el az Admin panel?',
        a: 'Az Admin panel a /admin útvonalon érhető el. Belépéshez külön admin bejelentkezés szükséges. Csak superadmin, admin és admin (olvasó) szerepkörű felhasználók férhetnek hozzá.',
      },
      {
        q: 'Milyen szerepkörök léteznek a rendszerben?',
        a: 'Superadmin: teljes hozzáférés, felhasználók és szerepkörök kezelése. Admin: felhasználók kezelése, de superadmin szerepkört nem oszthat. Admin (olvasó): csak megtekintési jog az admin panelben. Felhasználó: normál hozzáférés a saját cég adataihoz. Korlátozott felhasználó: csak olvasási jog.',
      },
      {
        q: 'Hogyan rendelhetek felhasználót céghez?',
        a: 'Az Admin panel táblázatában minden felhasználó sorában megjelenik egy "Cég" legördülő menü. Ebből kiválasztva a megfelelő céget, a felhasználó azonnal hozzáfér az adott cég adataihoz — újbóli bejelentkezés nélkül.',
      },
      {
        q: 'Hogyan hívhatok meg új felhasználót?',
        a: 'A "Felhasználó meghívása" gombra kattintva megadhatja az email címet és a kívánt szerepkört. A rendszer meghívó emailt küld, amellyel a felhasználó beállíthatja jelszavát és aktiválhatja fiókját.',
      },
      {
        q: 'Hogyan törölhetek felhasználót?',
        a: 'A táblázatban a felhasználó sorára húzva az egeret megjelenik a törlés ikon (kuka). Kattintás után egy megerősítő párbeszédablak jelenik meg. A törlés végleges és nem visszavonható.',
      },
      {
        q: 'Mit jelent az "Aktív" és "Meghívott" státusz?',
        a: '"Aktív" azt jelenti, hogy a felhasználó már megerősítette az email címét és bejelentkezett. "Meghívott" azt jelenti, hogy a meghívó el lett küldve, de a felhasználó még nem aktiválta a fiókját.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="w-full">

      {/* ── Fejléc ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-slate-400 font-medium mb-3">
            <Link href="/" className="hover:text-emerald-600 transition-colors">Irányítópult</Link>
            <ChevronRight size={14} />
            <span className="text-slate-600">Súgóközpont</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Súgóközpont</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            A rendszer összes funkciójának részletes leírása és útmutatója.
          </p>
        </div>
      </header>

      {/* ── Gyorsnavigáció ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 hover:border-emerald-200 hover:shadow-[0_4px_16px_rgba(16,185,129,0.08)] transition-all group"
            >
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <Icon size={15} className={s.color} />
              </div>
              <span className="text-[13px] font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">{s.title}</span>
            </a>
          )
        })}
      </div>

      {/* ── Szekciók ── */}
      <div className="space-y-14">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.id} id={section.id} className="scroll-mt-8">

              {/* Szekció fejléc */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={section.color} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{section.title}</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{section.description}</p>
                </div>
              </div>

              {/* Kérdés-válasz lista */}
              <div className="space-y-3">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all"
                  >
                    <details className="group">
                      <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none select-none">
                        <span className="text-[14px] font-semibold text-slate-800 leading-snug">{item.q}</span>
                        <ChevronRight
                          size={16}
                          className="text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-90"
                        />
                      </summary>
                      <div className="px-6 pb-5">
                        <div className="h-px bg-slate-100 mb-4" />
                        <p className="text-[14px] text-slate-600 leading-relaxed">{item.a}</p>
                      </div>
                    </details>
                  </div>
                ))}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}