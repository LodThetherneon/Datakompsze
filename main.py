import time
import random
import csv
import re
import os
import logging
import threading
from urllib3.exceptions import ReadTimeoutError
from datetime import datetime
from seleniumbase import SB
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# Konstansok
TELEGRAM_BOT_TOKEN = "8040447072:AAGWZmgwOngx04TRdMw7FBTe_5WEKe0wZ9g"
TELEGRAM_CHAT_ID = "7749592073"
CSV_FILENAME = "ad_tracking.csv"
status_message_id = None
search_active = True
shutdown_flag = False

bekoszonesek_xd = [
    "Szevasz, haver! Hoztam pár hirdetést, amik jobban csillognak, mint egy frissen mosott Tesla.",
    "Yo, tesó! Ezek a hirdetések annyira ütnek, hogy még a szomszéd is felébredne rájuk.",
    "Hahó, főnök! Itt vannak az új ajánlatok – frissebbek, mint a reggeli kávéd.",
    "Csáó, király! Ezek a hirdetések jobban pörögnek, mint egy TikTok dance challenge.",
    "Hellóka, bajnok! Találtam néhány autót – olyan jók, hogy még Batman is megirigyelné őket.",
    "Szia, uram vagy asszonyom! Ezek a hirdetések annyira forrók, hogy az aszfalt is megolvadna alattuk.",
    "Na mi van, bátyuus? Hoztam pár ajánlatot – jobban gurulnak, mint egy downhill bringás.",
    "Szevasz, mester! Ezek a hirdetések annyira frissek, hogy még a kenyér is megirigyelné őket.",
    "Yo, kapitány! Itt vannak az új ajánlatok – remélem nem süllyedünk el velük!",
    "Hahó, haverom! Ezek a hirdetések jobban csapnak oda, mint egy Marvel cliffhanger.",
    "Csőváz, autóvadász! Találtam pár hirdetést – olyan ritkák, mint egy offline Gen Z tag.",
    "Üdvözlet, barátom! Ezek az ajánlatok annyira jók, hogy még Elon Musk is befektetne beléjük.",
    "Csáóka! Hoztam pár hirdetést – jobban pörögnek, mint egy Discord szerver drámája.",
    "Halihooo! Ezek az ajánlatok olyan vadak, hogy még Mad Max is megfontolná őket.",
    "Yo-yo-yo! Új hirdetések érkeztek – frissebbek, mint egy influenszer reggeli avokádós pirítósa.",
    "Hahóka! Ezek a hirdetések annyira ütősek, hogy még Chuck Norris is elismerően bólintana.",
    "Csá haver! Itt vannak az új ajánlatok – jobban csúsznak be, mint egy frissen aszfaltozott út.",
    "Üdvözletem! Ezek a hirdetések annyira jók, hogy még a Google sem talál rájuk alternatívát.",
    "Hahó főni! Hoztam pár autót – olyan menők, hogy még a kutyád is elgondolkodna rajtuk.",
    "Cső tesó! Ezek az ajánlatok annyira frissek, hogy még Drakula is megkóstolná őket.",
    "Szevasz bajnok! Itt vannak az új autók – jobban gurulnak, mint egy downhill versenyző.",
    "Yo haverom! Találtam pár autót – remélem nem utoljára látjuk őket!",
    "Csá mesterem! Ezek az ajánlatok annyira forrók, hogy még a pokol is hidegnek tűnik mellettük.",
    "Hahó kapitányom! Itt vannak az új autók – reméljük nem csak a sírkövünkre kerülnek fel!",
    "Szevasz bátyuus! Ezek az ajánlatok olyan frissek, hogy még az Excel táblázatod is feldobná tőlük magát!",
    "Yo fővezér! Itt van néhány autó – olyan vadak, mint egy Reddit AMA komment szekciója.",
    "Hahó királyom! Találtam pár autót – ezek jobban ütnek, mint egy Black Friday tömeg!",
    "Cső bajnokom! Hoztam pár hirdetést – ezek jobban trendelnek, mint egy új Spotify playlist!",
    "Üdvözlet uram! Ezek az autók olyan menők, hogy még az Instagram filterek sem tudják elhomályosítani őket.",
    "Hellóka barátom! Itt van néhány ajánlat – olyan jók, hogy még Thanos is megbecsülné őket!",
    "Szia bátyuus! Ezek a hirdetések annyira menők, hogy akár egy sci-fi filmben is szerepelhetnének.",
    "Mizu haver? Hoztam pár új autót – jobban pörögnek mint a legújabb TikTok trendek!",
    "Csá tesóm! Ezek az ajánlatok forróbbak ...mint egy nyári napfényben sülő pizza!",
    "Yo főnököm! Találtam néhány hirdetést – ezek jobban csillognak mint egy frissen mosott Ferrari!",
    "Üdvözletem kedves barátom! Itt van néhány ajánlat – ezek annyira jók hogy akár Oscar-díjat is nyerhetnének!",
    "Helló barátom! Itt van néhány ajánlat – annyira jók, hogy akár egy Netflix sorozatot is ihlethetnek!",
    "Na mi van haver? Hoztam neked pár új autót – ezek annyira menők, hogy még a kormány is irigykedne rájuk!",
    "Szevasz mesterem! Ezek a hirdetések frissebbek ...mint egy reggel kávé előtt!",
    "Hahó haverom! Itt van néhány ajánlat – annyira ütősök mint Chuck Norris első filmjei!",
    "Csőváz barátom! Találtam néhány új autót – ezek jobban pörögnek mint a legújabb TikTok kihívások!",
    "Kapitányom! Hoztam neked néhány új autót - ezek annyira menők hogy még James Bond is irigykedne rájuk!",
    "Hellóka haverom! Itt vannak az új ajánlatok - frissebbek mint egy reggel kávé előtt!",
    "Mizu? Hozzám jöttek az új hirdetések - ezek jobban csillognak mint egy frissen mosott Tesla!",
    "Yo tesóm! Találtam néhány új autót - ezek annyira vadak mint egy Mad Max jelenet!",
    "Hahó bátyuus! Hozzám jöttek az új ajánlatok - jobban pörögnek mint egy TikTok dance challenge!",
    "Csá barátom! Hoztam neked pár új autót - ezek annyira jók hogy akár Thanos is megbecsülné őket!",
    "Szia mesterem! Hozzám jöttek az új hirdetések - frissebbek mint egy reggel kávé előtt!",
    "Üdvözletem kedves barátom! Itt vannak az új ajánlatok - jobban csillognak mint a legújabb iPhone!",
    "Mizu? Hozzám jöttek az új hirdetések - ezek annyira menők hogy akár Oscar-díjat is nyerhetnének!",
    "Szevasz, főni! Hoztam pár hirdetést – olyan jók, hogy még a NAV is lecsapna rájuk.",
    "Yo, haver! Ezek az autók annyira menők, hogy még a szomszéd is feljelentene érte.",
    "Hahó, tesóm! Találtam pár ajánlatot – olyan ritkák, mint egy offline influenszer.",
    "Csáó, bátyuus! Ezek a hirdetések jobban gurulnak, mint a pénzed egy kaszinóban.",
    "Hellóka, bajnok! Hoztam pár autót – olyan forrók, hogy még a pokol is hűvösnek tűnik mellettük.",
    "Szia, uram! Ezek az ajánlatok annyira ütősek, hogy még Chuck Norris is megirigyelné őket.",
    "Na mi van, haver? Itt vannak az új hirdetések – frissebbek, mint a gyereked első TikTok videója.",
    "Szevasz, mester! Ezek az autók olyan vadak, hogy még Mad Max is könyörögne értük.",
    "Yo, kapitány! Hoztam pár ajánlatot – olyan jók, hogy még Elon Musk is befektetne beléjük.",
    "Hahó haverom! Ezek az autók jobban csillognak, mint a szomszéd új medencéje.",
    "Csőváz, autóvadász! Itt vannak az új ajánlatok – olyan frissek, hogy még a kenyér is megirigyelné őket.",
    "Üdvözlet, barátom! Ezek az autók annyira menők, hogy még Batman is lecserélné a Batmobilt.",
    "Csáóka! Találtam pár autót – olyan ritkák, mint egy Gen Z tag analóg órával.",
    "Halihooo! Hoztam néhány hirdetést – olyan ütősek, hogy még a kormány is cenzúrázni akarná őket.",
    "Yo-yo-yo! Ezek az autók annyira frissek, hogy még a reggeli kávéd sem tudja felülmúlni őket.",
    "Hahóka! Itt vannak az új ajánlatok – jobban pörögnek, mint egy influenszer drámája az Instán.",
    "Csá haver! Ezek az autók annyira vadak, hogy még Drakula is megfontolná őket éjszakai járgánynak.",
    "Üdvözletem! Hoztam pár hirdetést – olyan jók, hogy még a Google sem talál rá alternatívát.",
    "Hahó főnököm! Ezek az autók annyira menők, hogy még a kutyád is elgondolkodna rajtuk.",
    "Cső tesóm! Találtam néhány ajánlatot – jobban gurulnak, mint a pénzed egy Black Friday vásáron.",
    "Szevasz bajnok! Itt vannak az új autók – olyan gyorsak, hogy még a fénysebesség is irigykedik rájuk.",
    "Yo haverom! Hoztam pár hirdetést – ezek jobban ütnek, mint egy hétfő reggeli meeting.",
    "Csá mesterem! Ezek az autók annyira forrók, hogy még Sátán is légkondit szereltetne beléjük.",
    "Hahó kapitányom! Itt vannak az új ajánlatok – reméljük nem csak álmaidban látod őket!",
    "Szevasz bátyuus! Ezek az autók annyira frissek, hogy még a szomszéd fűje sem zöldebb náluk!",
    "Yo fővezér! Találtam pár hirdetést – ezek jobban ütnek, mint egy apokalipszis előtti leértékelés.",
    "Hahó királyom! Hoztam pár autót – olyan ritkák, mint egy offline influenszer selfie nélkül.",
    "Cső bajnokom! Ezek az ajánlatok annyira menők, hogy még Thanos is megtartaná őket emlékbe!",
    "Üdv vezérlő! Hoztam néhány autót – olyan vadak, hogy még Mad Max is megfontolná őket versenyautónak!",
    "Hellóka barátom! Itt vannak az új ajánlatok – olyan jók, hogy még Oscar-díjat is nyerhetnének!",
    "Szia bátyuus! Ezek az autók annyira menők, hogy akár egy sci-fi filmben is szerepelhetnének!",
    "Mizu haver? Hoztam pár új hirdetést – jobban pörögnek mint Elon Musk Twitter-fiókja!",
    "Csá tesóm! Találtam néhány autót – ezek jobban csillognak mint egy influenszer karácsonyi dekorációja!",
    "Yo főnököm! Itt vannak az új ajánlatok – olyan forrók, hogy még Hawaii sem tudna versenyezni velük!",
    "Üdvözletem kedves barátom! Hoztam néhány hirdetést – ezek jobban trendelnek mint egy TikTok dance challenge!",
    "Helló barátom! Itt vannak az új ajánlatok – annyira jók, hogy akár Netflix sorozatot ihletnének!",
    "Hahó, te gravitációs hulladék! Hoztam pár hirdetést, amik jobban csillognak, mint a multiverzum összes csillaga együttvéve.",
    "Yo, Morty! Vagy várj… te nem Morty vagy. Mindegy, itt vannak az autók, amik jobban gurulnak, mint egy dimenzióugró portál.",
    "Szevasz, kis szénalapú életforma! Ezek az ajánlatok olyan forrók, hogy még a nap is elbújna szégyenében.",
    "Na mi van, te DNS-mutáció? Hoztam pár autót – ezek annyira jók, hogy még a Rickek Tanácsa is megirigyelné őket.",
    "Csáó, te kvantumhullám-zavar! Ezek az autók gyorsabbak, mint ahogy a valóság szétesik körülötted.",
    "Hellóka, te kozmikus selejt! Itt vannak az új ajánlatok – frissebbek, mint egy párhuzamos univerzum első másodpercei.",
    "Yo-yo-yo, te oxigénpazarló! Hoztam pár hirdetést – ezek jobban pörögnek, mint egy részeg Rick a portálpisztollyal.",
    "Hahóka, te genetikai baleset! Ezek az autók annyira ütősek, hogy még az idő is visszafordulna értük.",
    "Csőváz, te interdimenzionális lúzer! Ezek az ajánlatok jobban csillognak, mint egy alternatív valóságban létező arany Rick.",
    "Üdvözlet, te szánalmas húskupac! Ezek az autók olyan ritkák, hogy még Schrödinger macskája is elismerően dorombolna.",
    "Na mi van, te tér-idő hulladék? Hoztam pár hirdetést – ezek jobban gurulnak, mint a multiverzum legjobb gördeszkása.",
    "Szevasz, te molekulák véletlen együttese! Ezek az autók annyira durvák, hogy még egy fekete lyuk is beszippantaná őket.",
    "Yo haverom! Ezek az ajánlatok annyira jók, hogy még a nihilizmus sem tudná elrontani őket.",
    "Csáóka, te kozmikus hiba! Ezek az autók gyorsabbak, mint ahogy Jerry feladja az életét.",
    "Halihooo, te szánalmas dimenzióturista! Itt vannak az új ajánlatok – frissebbek, mint egy párhuzamos univerzum első reggele.",
    "Yo főnököm! Ezek az autók annyira menők, hogy még Plútó is bolygónak érezné magát mellettük.",
    "Hahó haverom! Ezek az ajánlatok olyan vadak, hogy még Madárszemély is megfontolná őket csatagépként.",
    "Csá haver! Hoztam pár autót – ezek annyira ütősek, hogy még Morty is abbahagyná a nyafogást miattuk.",
    "Üdvözletem, te kvantummechanikai kísérlet mellékterméke! Ezek az autók olyan jók, hogy még Einstein is tapsolna nekik.",
    "Hahó főni! Itt vannak az új ajánlatok – frissebbek, mint amikor először feltaláltam a portálpisztolyt.",
    "Cső tesóm! Ezek az autók olyan durvák, hogy még a Galaktikus Föderáció is betiltaná őket.",
    "Szevasz bajnok! Hoztam pár hirdetést – ezek annyira gyorsak, hogy még a fénysebesség is irigykedne rájuk.",
    "Yo haverom! Találtam néhány autót – ezek jobban ütnek, mint amikor Jerry megpróbál okos lenni.",
    "Csá mesterem! Ezek az ajánlatok annyira forrók, hogy még Sátán is légkondit szereltetne beléjük.",
    "Hahó kapitányom! Itt vannak az új autók – reméljük nem csak álmaidban látod őket!",
    "Szevasz bátyuus! Ezek az autók annyira frissek, hogy még a szomszéd fűje sem zöldebb náluk!",
    "Yo fővezér! Találtam pár hirdetést – ezek jobban ütnek, mint egy apokalipszis előtti leértékelés.",
    "Hahó királyom! Hoztam pár autót – olyan ritkák, mint egy offline influenszer selfie nélkül.",
    "Cső bajnokom! Ezek az ajánlatok annyira menők... hogy Thanos megtartaná!"
]

class RequestFilter(logging.Filter):
    def filter(self, record):
        msg = record.getMessage()
        return not ("Read timed out" in msg and "HTTPConnectionPool" in msg and record.levelno < logging.ERROR)


# Logger konfigurálása
logging.getLogger("urllib3").addFilter(RequestFilter())


# CSV kezelés
def initialize_csv():
    """CSV fájl inicializálása ha nem létezik"""
    if not os.path.exists(CSV_FILENAME):
        with open(CSV_FILENAME, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Ad Code", "First Seen", "Last Seen"])


def load_existing_ads():
    """Meglévő hirdetések betöltése CSV-ből dátumokkal"""
    initialize_csv()
    existing_ads = {}
    if os.path.exists(CSV_FILENAME):
        with open(CSV_FILENAME, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            if "First Seen" not in reader.fieldnames or "Last Seen" not in reader.fieldnames:
                raise ValueError("A CSV fájl nem tartalmazza az elvárt oszlopokat: 'First Seen', 'Last Seen'")
            for row in reader:
                existing_ads[row["Ad Code"]] = {
                    "first_seen": row["First Seen"],
                    "last_seen": row["Last Seen"]
                }
    return existing_ads



def update_csv(current_ads):
    """CSV frissítése törlésekkel és új elemekkel"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    updated_ads = {}

    # Meglévő adatok betöltése
    existing_ads = load_existing_ads()

    # Frissített adatok összeállítása
    for ad_code in current_ads:
        if ad_code in existing_ads:
            updated_ads[ad_code] = existing_ads[ad_code]
            updated_ads[ad_code]["last_seen"] = now
        else:
            updated_ads[ad_code] = {"first_seen": now, "last_seen": now}

    # CSV teljes újraírása
    with open(CSV_FILENAME, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["Ad Code", "First Seen", "Last Seen"])
        for ad_code, dates in updated_ads.items():
            writer.writerow([ad_code, dates["first_seen"], dates["last_seen"]])

    return set(updated_ads.keys())


def send_telegram_message(message):
    """Üzenet küldése Telegramra timeout kezeléssel"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {"chat_id": TELEGRAM_CHAT_ID, "text": message}
        response = requests.post(url, data=data, timeout=10)
        return response.json()
    except ReadTimeoutError as e:
        if "HTTPConnectionPool" in str(e):
            return
        raise


def edit_telegram_message(message_id, new_text):
    """Telegram üzenet szerkesztése."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/editMessageText"
    data = {
        "chat_id": TELEGRAM_CHAT_ID,
        "message_id": message_id,
        "text": new_text
    }
    response = requests.post(url, data=data)
    return response.json()

def delete_telegram_message(message_id):
    """Telegram üzenet törlése."""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteMessage"
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "message_id": message_id
        }
        response = requests.post(url, data=data, timeout=10)
        return response.json()
    except Exception as e:
        print(f"Hiba az üzenet törlésekor: {str(e)}")
        return None

def get_total_results(sb):
    """Összes találat számának kinyerése szóközök kezelésével"""
    try:
        result_text = sb.get_text('span.hidden-xs', timeout=10)
        if "Találati lista" in result_text:
            # Szám kinyerése reguláris kifejezéssel
            numbers = re.findall(r'\d+', result_text.split("(")[1])
            total_str = ''.join(numbers)  # Szóközök eltávolítása
            return int(total_str)
    except Exception as e:
        print(f"Hiba a találatok számának lekérésénél: {str(e)}")
    return 0



def process_page(sb, ads):
    """Gyorsított oldalfeldolgozás"""
    try:
        # Dinamikus várakozás a konténerre
        container = WebDriverWait(sb.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#w45"))
        )

        # Batch feldolgozás
        rows = container.find_elements(By.CSS_SELECTOR, ".row.talalati-sor")
        for row in rows:
            try:
                code = row.find_element(By.CSS_SELECTOR, ".talalatisor-hirkod").text.split(": ")[1][:-1]
                ads.add(code.strip())
            except Exception as e:
                print(f"⚠️ Hiba kód kinyerésénél: {str(e)}")

    except TimeoutError:
        print("⌛ Időtúllépés az oldal betöltésekor")
        sb.driver.refresh()
        process_page(sb, ads)


def handle_telegram_commands():
    global search_active, shutdown_flag
    last_update_id = 0

    while not shutdown_flag:
        try:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
            params = {"offset": last_update_id + 1}  # Fontos: +1 a következő üzenethez
            response = requests.get(url, params=params).json()

            if "result" in response:
                for update in response["result"]:
                    # Szűrjük a saját üzeneteinket
                    if update.get("message", {}).get("from", {}).get("id") == TELEGRAM_CHAT_ID:
                        text = update["message"]["text"].strip()

                        if text == "/stop":
                            search_active = False
                            send_telegram_message("⏸️ Keresés szüneteltetve! Újraindítás: /start")

                        elif text == "/start":
                            search_active = True
                            send_telegram_message("▶️ Keresés folytatódik!")

                        elif text == "/kill":
                            shutdown_flag = True
                            send_telegram_message("💀 Program leállítás...")
                            raise SystemExit

                        last_update_id = update["update_id"]

        except Exception as e:
            if not shutdown_flag:
                print(f"Parancskezelő hiba: {e}")

        time.sleep(1)


def bypass_cloudflare(sb, url):
    """Cloudflare és sütik kezelése egyetlen lapon"""
    attempt = 0
    max_attempts = 3
    sb.driver.set_page_load_timeout(45)

    while attempt < max_attempts:
        try:
            sb.uc_open_with_reconnect(url, reconnect_time=3)

            # Süti elfogadás előtti várakozás
            WebDriverWait(sb.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.didomi-popup-container"))
            )

            # Süti elfogadás
            click_success = sb.driver.execute_script("""
                const accept = document.querySelector(
                    'button#didomi-notice-agree-button, ' +
                    'button[aria-label^="Elfogadás"], ' +
                    'button.didomi-dismiss-button'
                );
                if (accept) {
                    accept.click();
                    return true;
                }
                return false;
            """)

            if not click_success:
                raise Exception("Süti gomb nem található")

            # Várakozás a sütik teljes feldolgozására
            WebDriverWait(sb.driver, 10).until(
                EC.invisibility_of_element_located((By.CSS_SELECTOR, "div.didomi-popup-container"))
            )
            sb.sleep(2)  # Extra biztonsági várakozás

            # Ellenőrzés, hogy tényleg sikerült-e
            if sb.is_element_visible("div.didomi-popup-container"):
                raise Exception("Süti popup még mindig látható")

            print("Süti kezelés sikeres")
            return sb

        except Exception as e:
            attempt += 1
            print(f"⚠️ Süti hiba ({attempt}/{max_attempts}): {str(e)}")
            sb.save_screenshot(f"cookie_error_{attempt}.png")
            if attempt >= max_attempts:
                raise
            sb.sleep(3)


def fetch_ads(sb):
    """Hirdetéskódok gyűjtése párhuzamos oldalbetöltéssel"""
    ads = set()
    base_url = sb.get_current_url().split('?')[0]
    main_window = sb.driver.current_window_handle

    # Első oldal feldolgozása
    process_page(sb, ads)

    # Oldalszám meghatározása
    total_results = get_total_results(sb)
    print("Összes hirdetés: ",total_results)
    if total_results == 0:
        return ads

    total_pages = (total_results + 99) // 100

    for page in range(2, total_pages + 1):
        try:
            # Következő oldal előzetes betöltése új lapon
            sb.driver.execute_script(f"window.open('{base_url}/page{page}');")
            new_window = [w for w in sb.driver.window_handles if w != main_window][-1]

            # Aktuális oldal feldolgozása
            process_page(sb, ads)
            print("Lapozás a következő oldalra: ", page)

            # Váltás az új lapra
            sb.driver.switch_to.window(new_window)

            # Régi lap bezárása
            if len(sb.driver.window_handles) > 1:
                sb.driver.switch_to.window(main_window)
                sb.driver.close()
                sb.driver.switch_to.window(new_window)
                main_window = new_window

        except Exception as e:
            print(f"⚠️ Hiba a(z) {page}. oldalon: {str(e)}")
            sb.save_screenshot(f"page_{page}_error.png")
            break
    try:
        process_page(sb, ads)
    except Exception as e:
        print(f"⚠️ Hiba az utolsó oldal feldolgozásánál: {str(e)}")
        sb.save_screenshot("last_page_error.png")
    return ads


def main():
    global search_active, shutdown_flag, status_message_id
    base_url = "https://www.hasznaltauto.hu/talalatilista/PCOJKWGJR3NTQEH5C7PSOMFVPBIY4M3IEDAKJEKTVYBG3MOVNQWTISG2HV3JA747EJS5TD5STBHPVUQEVNMMXK2XIXFLZWDORMP2MYCJWFULQFNV2KJD7C6T4IZ63MLCMEXKEE7NTEP234S3LGY6A3NI7BGPXG3CWFJSO2MFWWF47O4CLVKV7JNOQQK6NRBLNYXE5MV43I65C5WLOXM4TXWZLUKYW7HJ7YLFGOP7Z5W23CYFLPPBL4TCEGHLUDEMKSKEHET7LJS4XWY7TPJXKBVLELEXF5RJ3HOHLEZRMQFLJZ5NFXP3R3UO3YN7T5X7FGEJU26654SW7JIJCSDLAEUHC5XVKPZDUMYHMQUL6ZKVQNJD3YLAXSSCDEHWCON2BFKG46FKE77GN6I3D6QGPS3C6FBKSEOCL4VHLXLDW66QDHEHJWD4F4YAVQLONWC24N6KIHTG55WTHLO635DL6XANBUYH26Z5NPKX7F4VXB5E3SGB7ZUKZ2X6SXDH5U5KKNLKV7SLGWEFP7WU64X47U6EUV45FQYZ3HLU7MVVIIR65TTMWUX7PL2426SFB3SV36F32VK6RGJB65PYA45C47YK4AP3KP3WUK3RRROWEHJZ6G3RCADF3LZ4BCG2U3RM564G46BJNGBRGWR7UQT3I5ZAHXV27S3ELT7PJRR3KWE3N5OHVZ3KYPA4ZWNWR76AR2R5P2F65RCROHHVSVF4PU5ETGZ7DPATWFWDBEKCFQHTMPTWH5DP3J2HZHWYX3DZN4XFFKYLG5MJLXDB5R5NHHTY3PZDNFES2MLZUPOWG3OTQK3GIXBZRID2UXARQEJHNI2W5R5DITOGJOOMD6SNADMNORR2YBKHNM37EWT6KDLKLHEPFEHRYGLSUZ2TEJSNNNPYO5CYM5XJ2DPL3SR3CHVGDN23RM6HIZ5ZJTS7NSAMXEPZZWVKNJDJ2LYUTTWHKYMPCKBCSYOWSVXT73GOXQHOCDT3KCVPUKXYKPTKISCKKV54IL4YB2HIPA64USWRNLIVPYRCQI5BD4UE3KN2AAKGZV2Z5VXKIEOFVX2OYSRD4G2RA7BZOVCVJ6B6VQJUBBBKHBEVGLTDE5ZGCCC2PCEOPORTUXS3VZUVETYOJ2S4DWMEYBWJJ3WPASHD2CLKWNHJNSS4FRX462EEOA3GEJYMUVEJI5YXFOT6VX3J6A2YOPX6XK5HKHYNN5YVDZPVZR6XV6OBJI3QEFREONLVCEB3QXPASCRFTC7KTO7V6VA5VUTJS5WBEJWKSLIFNU2KY47U45F6CNWQSDOBUAQRQNAEQODPB2Y42YVSI3HGLAY4BQZ4HZV7BEWAHKCXL5QYZEJLYLGBRNPW6YF5YWZUCSTIRHOV2XYLEOUZPT6SFLLZGE5WUCUGZORJOE263V5FX5QMEQWVM4Y2TBLKLRZZOND5LMI6X4H4UYTPJCI2ZH2WQTFRHOJO6RUWE54TCNLHSO4EGKOWH2Q76O3ONGAJ3SZ5H7YL3NGT72NFOCL3MXR54CU2I2ES2P5S6ZF5LUDK5KX7RMWWIL2GKK7XUI32EPGQ3URAFWSTY66MXHRMSVKJ4WWMJSVVB7BYBNS736WOZ67SWD6NCOX56W33TA7TYEMGJBGF4OIH6UXPIFECPGOQOO6VN7MJTUIJGPMQY4DLP2QOPRFIRJECPQ6YUKXQQ6X2LINHQZPDNBEYHUO7UWPJS6JWLKSHK7S7M4U6Y37PNMDA7DXEXZGHC6YD5KV7WGVWCM4JVAZHOCKEAYBJPJNMGGSNMKIJABYESBAX4OPOQMM4QI2FBAYGBCBAAOXTTGCBKQQZUHGMM6QIGFWB2MFNIV7YXSBUIUSIAQBGMYBGQORQYI4DNWGAAEOGRKQCPLAO2LTBN4OP4FFA56NXSMLUX3YFLZ5QNLWSFEB5GCA3CFZEYGEZRFKUJYFQ2JUYIGLZQREAQOWCQJWI74AUZMC5WWB2ASKGDUZA6EYJGSA3EBSZA3KYO4SHGAXLPE5CBFDADSIMDBWHTHANAP4SM6LKKGISDSKLCZMQ2QIC2Q7W4LM4Q7GAO3BUDQEQILQCXUQE3AUATZUNBFRI23ZB7QOMM6WYCDLZXXT7Z34Y7G5A4HLPGSDBFGI5ZEIQGDNSJARG2IBVDQ4GZQROQBZDO27ESMAREREKIMNQYXTQSOT7VVQP3AULBIFYQXCBKCYVTMFQLBALNHIW2C6RK576DMRHHZKD7IDQYRPM23Z5CYG3E7ZVOURQGEREHZPDU2NUKFGJQYZQ2PECI3SELAC56BV5Z6FRSL7OGIXXS4AHEKEZBUK4WPAPJZSFMB6URZOFXQJFDIMSBWEZ3CGTCQRDDFR4GBZLD25TAUAHWOGXAPNYJCYEZ46PRWAKIEACXZVWNSIQMUY4NDSVYXFSHUTLAGHSH53K6DRMFSYR56GMR47S73KJQ7M5GRJNJAR6W6D26XX7NGGUC7EEZD6MXGEBJP7SXHTIYXA73DHEP6IBY7QDMJN7OOP3H7TG3LR5"

    # Hibanaplózás konfigurálása
    logging.getLogger("urllib3").addFilter(RequestFilter())

    # Parancskezelő indítása
    command_thread = threading.Thread(target=handle_telegram_commands, daemon=True)
    command_thread.start()

    try:
        with SB(uc=True, headless=False) as sb:
            bypass_cloudflare(sb, base_url)

            sb.uc_open_with_reconnect(base_url, 3)

            stored_ads = load_existing_ads()  # Dictionary betöltése

            if not stored_ads:
                current_ads = fetch_ads(sb)
                update_csv(current_ads)
                send_telegram_message(f"🔰 Adatbázis inicializálva: {len(current_ads)} hirdetés")

                # Kezdeti státuszüzenet küldése
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                status_text = f"ℹ️ Legutóbbi frissítés: {current_time}\n✅ Aktív hirdetések: {len(current_ads)}"
                response = send_telegram_message(status_text)
                status_message_id = response.get("result", {}).get("message_id")
            else:
                send_telegram_message(f"🚀 Program aktív! Alapállapot: {len(stored_ads)} hirdetés")

                # Kezdeti státuszüzenet küldése
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                status_text = f"ℹ️ Legutóbbi frissítés: {current_time}\n✅ Aktív hirdetések: {len(stored_ads)}"
                response = send_telegram_message(status_text)
                status_message_id = response.get("result", {}).get("message_id")

            while not shutdown_flag:
                if not search_active:
                    print("🔴 Keresés szüneteltetve...")
                    time.sleep(10)
                    continue

                time.sleep(3) # Keresési gyakoriság beállítása másodpercben

                # Külön try-except blokkba helyezzük a kritikus részt
                try:
                    sb.uc_open_with_reconnect(base_url, 3)
                    current_ads = fetch_ads(sb)
                    stored_ads = load_existing_ads()  # Friss adatok betöltése

                    new_ads = current_ads - stored_ads.keys()
                    deleted_ads = stored_ads.keys() - current_ads

                    # Ha új hirdetés van, töröljük a státuszüzenetet, küldjük az új hirdetéseket
                    if new_ads:
                        # Töröljük a régi státuszüzenetet, ha van
                        if status_message_id:
                            delete_telegram_message(status_message_id)
                            status_message_id = None

                        # Küldjük az új hirdetéseket
                        send_telegram_message(random.choice(bekoszonesek_xd))
                        for ad in new_ads:
                            send_telegram_message(f"https://hasznaltauto.hu/{ad}")

                        # Küldjünk új státuszüzenetet
                        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        status_text = f"ℹ️ Legutóbbi frissítés: {current_time}\n✅ Aktív hirdetések: {len(current_ads)}"
                        response = send_telegram_message(status_text)
                        status_message_id = response.get("result", {}).get("message_id")
                    else:
                        # Csak frissítsük a meglévő státuszüzenetet
                        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        status_text = f"ℹ️ Legutóbbi frissítés: {current_time}\n✅ Aktív hirdetések: {len(current_ads)}"

                        if status_message_id:
                            edit_telegram_message(status_message_id, status_text)
                        else:
                            response = send_telegram_message(status_text)
                            status_message_id = response.get("result", {}).get("message_id")

                    # CSV teljes frissítése
                    update_csv(current_ads)

                except Exception as e:
                    error_msg = str(e)
                    # Ha HTTPConnectionPool timeout hiba történik, dobjuk tovább
                    if "HTTPConnectionPool" in error_msg and "Read timed out" in error_msg:
                        print(f"⚠️ HTTPConnectionPool timeout: {error_msg}")
                        raise  # Ez a kivétel eljut a külső try-except blokkig
                    else:
                        # Egyéb hibák esetén csak jelezzük, és folytassuk
                        print(f"❌ Hiba a keresés során: {error_msg}")

    except SystemExit:
        raise
    except Exception as e:
        if not shutdown_flag:
            error_msg = f"❌ Kritikus hiba: {str(e)}"
            print(error_msg)
            # Ne küldjünk Telegram üzeneteket a HTTPConnectionPool hibákról
            if "HTTPConnectionPool" not in error_msg or "Read timed out" not in error_msg:
                send_telegram_message(error_msg)
            # A HTTPConnectionPool hibákat a külső blokkban kezeljük
            raise


if __name__ == "__main__":
    restart_delay = 10
    while not shutdown_flag:
        try:
            main()
        except SystemExit:
            send_telegram_message("💀 Program leállt! Manuális újraindítás szükséges.")
            break
        except KeyboardInterrupt:
            send_telegram_message("🚨 Kézi leállítás!")
            break
        except Exception as e:
            error_msg = str(e)
            # Ha HTTPConnectionPool timeout hiba, akkor csak logoljuk, ne küldjünk üzenetet
            if "HTTPConnectionPool" in error_msg and "Read timed out" in error_msg:
                print(f"⚡ Újraindítás {restart_delay}s múlva... HTTPConnectionPool timeout hiba")
            else:
                print(f"⚡ Újraindítás {restart_delay}s múlva... Hiba: {e}")
                # Csak nem-timeout hibákról küldjünk értesítést
                send_telegram_message(f"⚠️ Hiba történt, újraindítás... Hiba: {e}")
            time.sleep(restart_delay)
