# AGENTS.md — Encyklopedie píčovin

## 1. Cíl projektu

Vytvoř webovou encyklopedii hodně podobnou na Wikipedii pro kamarádskou partu s názvem **Encyklopedie píčovin**. Má fungovat podobně jako klasická Wikipedie: články, obsah článku, kategorie, interní odkazy, vyhledávání a historie revizí. Obsah, názvosloví a humor budou vlastní.

Výchozí jazyk je čeština. Tón obsahu může být vulgární, absurdní a kamarádský. Rozhraní ale musí zůstat přehledné, konzistentní a dobře použitelné.

### Zásady

- Nejdřív prozkoumej aktuální stav repozitáře a teprve potom navrhuj nebo měň soubory.

- Web MUSÍ vypadat jako Wikipedie

- Projekt začíná od nuly, ale nevytvářej zbytečně složitou architekturu.

- Neimplementuj jen maketu: funkce musí být propojené s reálnými daty, pokud vyžadují databázi.

- Nevymýšlej tajné klíče, přístupové údaje ani existující konfiguraci.

- Po každé významnější změně spusť dostupné kontroly a oprav chyby.

- Pokud je nutné rozhodnout o drobnosti, zvol jednoduchou a bezpečnou variantu a pokračuj. Ptej se jen při skutečně zásadní nejasnosti.

- Nikdy netvrď, že test, build, migrace nebo nasazení proběhly, pokud nebyly skutečně spuštěny a ověřeny.

## 2. Technologie a architektura

### Doporučený stack

- Frontend: sémantické HTML, CSS a vanilla JavaScript (ES modules). Jednoduché, aby se v tom vyznal i začítečník v HTML a CSS

- Frontend: sémantické HTML, CSS a vanilla JavaScript (ES modules).

- Backend: Node.js (server.js) poskytuje statické soubory i bezpečné /api/... endpointy; server načítá proměnné prostředí přes dotenv.

- Databáze a autentizace: Supabase (PostgreSQL, Auth, případně Storage). Supabase je hlavní a autoritativní databáze pro články, metadata, uživatele, role, komentáře a revize.

- GitHub API: každý vytvořený nebo upravený článek se po úspěšném uložení do Supabase synchronizuje také jako Markdown soubor do content/articles/<slug>.md. GitHub slouží jako verzovaná kopie obsahu a doplňková historie commitů; nenahrazuje Supabase jako hlavní databázi.

- Hosting: aplikace běží jako Node.js služba na Renderu. GitHub je repozitář zdrojového kódu a úložiště Markdown kopií článků, nikoli hosting backendu.

- Cloudflare Pages, Workers, D1 ani R2 nejsou součástí aktuální architektury. Nepřidávej je zpět bez výslovného požadavku uživatele.

- Supabase URL a veřejný publishable/anon klíč dodává uživatel pro frontendovou konfiguraci assets/js/config.js. Skutečné tajné klíče nikdy nezapisuj do repozitáře.

- GitHub token a ostatní serverová tajemství patří pouze do lokální .env a do bezpečných Environment Variables na Renderu. Nikdy je neposílej do prohlížeče ani do odpovědí API.

- Supabase je externí služba; její projekt, URL a klíče musí dodat uživatel. Nezapisuj žádné skutečné tajné klíče do repozitáře.

- Použij Supabase JS klienta přes oficiální způsob instalace odpovídající zvolenému hostingu. Nevkládej neověřené CDN adresy nebo verze; ověř dokumentaci, pokud je dostupná.

### Důležité omezení

Node.js backend je jediná vrstva, která smí komunikovat s GitHub API pomocí tokenu. Frontend nikdy nesmí znát ani obdržet GITHUB_TOKEN. Každý chráněný endpoint musí ověřit Supabase access token a oprávnění uživatele; samotné skrytí tlačítka ve frontendové aplikaci nestačí. Supabase RLS zůstává povinné pro tabulky přístupné z klienta. Veřejný Supabase publishable/anon klíč může být ve assets/js/config.js, pokud jsou správně nastavená RLS pravidla. service_role a secret klíče nikdy nesmí být v klientském kódu.

### Struktura projektu

Udržuj jednoduchou a srozumitelnou strukturu, například:

```text

/

├── index.html

├── article.html

├── category.html

├── profile.html

├── timeline.html

├── login.html

├── admin.html

├── assets/

│   ├── css/

│   │   ├── base.css

│   │   ├── layout.css

│   │   └── components.css

│   ├── js/

│   │   ├── config.example.js

│   │   ├── supabase-client.js

│   │   ├── auth.js

│   │   ├── articles.js

│   │   ├── search.js

│   │   └── ui.js

│   └── images/

├── server.js

├── content/

│   └── articles/              # Markdown kopie článků v GitHubu

├── .env.example

├── supabase/

│   ├── migrations/

│   └── seed.sql

├── tests/

├── .gitignore

├── README.md

└── AGENTS.md

```

Tuto strukturu ber jako návrh, nikoli důvod přepisovat existující fungující soubory. Vyhni se obřímu jedinému JavaScriptu a duplikování logiky.

### Aktuální pravidla ukládání a synchronizace
1. Při vytvoření nebo úpravě článku nejprve bezpečně ulož hlavní záznam a revizi do Supabase.
2. Po úspěšném uložení do Supabase zavolej serverový endpoint, který synchronizuje Markdown do GitHubu. Frontend nesmí volat GitHub API přímo.
3. Cílová cesta je content/articles/<slug>.md v repozitáři Korky12/encyklopedie-p--ovin. Používej branch master, pokud ji uživatel nebo aktuální konfigurace výslovně nezmění. Všechny tyto hodnoty musí být nastavitelné přes proměnné prostředí (GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, GITHUB_CONTENT_DIR), ne natvrdo v kódu.
4. Pokud složka content/articles ještě neexistuje, GitHub Contents API ji vytvoří automaticky při prvním zápisu souboru; nevytvářej prázdnou složku samostatným krokem.
5. GitHub token načítej výhradně na serveru z GITHUB_TOKEN. Ověř, že token má Contents: Read and write pro cílový repozitář. Token nikdy neloguj, nevracej v API odpovědi a nevkládej do klientských souborů.
6. Supabase zůstává zdrojem pravdy. Pokud se Supabase zápis povede, ale GitHub synchronizace selže, nesmí aplikace tvrdit, že vše proběhlo bez chyby. Zobraz jasný stav „uloženo v Supabase, synchronizace na GitHub selhala“ a nabídni bezpečné opakování synchronizace. Neprováděj duplicitní revizi jen kvůli opakování GitHub synchronizace.
7. U editace aktualizuj existující Markdown soubor pomocí aktuálního SHA z GitHub API; při souběžné změně neprováděj slepé přepsání, ale vrať srozumitelnou chybu konfliktu.
8. Zachovej konzistenci slugů a Markdown serializace mezi Supabase a GitHubem. Ošetři diakritiku, speciální znaky, kategorie, infobox i obsah článku.
9. Pokud GITHUB_TOKEN chybí, aplikace nesmí potichu přepnout do lokálního ukládání a tvářit se, že synchronizace proběhla. Lokální fallback může sloužit pouze pro vývoj a musí být jasně označen.
10. Historie revizí v Supabase zůstává autoritativní a obnovitelná. GitHub commit historie je doplňková kopie, nikoli náhrada tabulky article_revisions.
## 3. Vzhled a UX

Vizuálně se inspiruj rozložením Wikipedie, nikoli kopírováním jejího loga nebo vydáváním projektu za oficiální Wikipedii.

### Základní vzhled

- Bílé nebo téměř bílé pozadí, tmavý text, jemné šedé okraje a tradiční modré odkazy.

- Jednoduchá čitelná typografie, dobrá šířka textového sloupce a dostatek prostoru pro dlouhé články.

- Hlavička s názvem „Encyklopedie píčovin“, vyhledáváním a navigací.

- Na desktopu boční navigace nebo obsah článku; na mobilu přehledné sbalené menu.

- Stránka článku má název, krátký úvod, obsah s odkazy na nadpisy, hlavní text, kategorie, související články a informaci o poslední změně.

- Vhodně použij infoboxy pro osoby, místa nebo incidenty.

- Responzivní design bez horizontálního přetékání na mobilu.

- Zajisti viditelné stavy hover, focus, načítání, prázdného výsledku a chyby.

- Přístupnost: sémantické HTML, popisky formulářů, ovládání klávesnicí, viditelný focus a dostatečný kontrast.

- Nepřeháněj animace. Respektuj `prefers-reduced-motion`.

- Žádné emoji, vzhled by měl být ultra-čistý jako wikipedie

### Vlastní identita

- Humor a vulgarity patří hlavně do obsahu, názvů kategorií a drobných mikrotextů.

- Rozhraní má působit jako skutečná encyklopedie, ne jako chaotický meme dashboard.

- Nepoužívej oficiální logo Wikipedie ani její ochranné prvky tak, aby vznikl dojem oficiálního projektu.

## 4. Funkční požadavky

### Veřejné funkce

- Domovská stránka s vyhledáváním, doporučenými/novými články, kategoriemi a náhodným článkem.

- Veřejné čtení článků bez nutnosti přihlášení.

- Vyhledávání podle názvu a obsahu; ošetři prázdné dotazy a žádné výsledky.

- Interní odkazy mezi články, související články a stránky kategorií.

- Profily osob, záznamy incidentů, hlášky/citáty, místa a média.

- Časová osa incidentů s řazením podle data.

- Historie verzí článků a možnost porovnat základní metadata verzí.

- Komentáře, pokud jsou povolené, s možností nahlásit nevhodný obsah.

- Hodnocení/štítky mohou být zábavné, ale nesmí bez souhlasu zveřejňovat citlivé osobní údaje ani vytvářet skutečně škodlivé profily.

### Úpravy a moderace

- Články mohou upravovat přihlášení uživatelé z party.

- Každá změna článku vytvoří novou revizi v Supabase s autorem, časem a shrnutím změny.
- Každý nový nebo upravený článek se po uložení do Supabase synchronizuje do content/articles/<slug>.md přes serverový backend a GitHub API.
- UI musí rozlišovat úspěšné uložení v Supabase od úspěšné synchronizace na GitHub; částečný neúspěch nesmí být skrytý.

- Uživatelé nesmí běžně mazat historii revizí ani měnit role sami sobě.

- Zajisti možnost obnovit předchozí revizi.

- Mazání článků má být soft delete nebo administrátorská akce s potvrzením; nemaž databázové záznamy bez možnosti obnovy.

- Vytvoř role `member` a `admin`. Admin může spravovat uživatele, skrývat obsah a řešit nahlášení.

- Veřejné komentování bez účtu nezapínej, pokud nebude doplněna ochrana proti spamu.

## 5. Databázový návrh

Navrhni a verzuj SQL migrace ve složce `supabase/migrations/`. Používej cizí klíče, indexy, časová razítka a omezení konzistence.

Základní tabulky:

### `profiles`

- `id` UUID, primární klíč a vazba na `auth.users.id`

- `display_name`

- `avatar_path` volitelně

- `role` (`member` nebo `admin`), výchozí `member`

- `created_at`

- Uživatel si nesmí sám změnit roli na admina.

### `articles`

- `id` UUID

- `slug` unikátní a vhodný do URL

- `title`

- `summary`

- `content` (zvolený bezpečný formát, např. Markdown)

- `article_type` (`person`, `incident`, `quote`, `place`, `general`)

- `created_by`, `updated_by` vazby na profily

- `created_at`, `updated_at`

- `status` (např. `published`, `hidden`, `deleted`)

- volitelná pole pro datum incidentu a další typově specifická metadata; nepřidávej desítky nepoužívaných sloupců.

### `article_revisions`

- `id` UUID

- `article_id`

- `revision_number`

- `title`, `summary`, `content` a další potřebná pole kopírovaná jako snapshot

- `editor_id`

- `edit_summary`

- `created_at`

- unikátní kombinace `article_id` + `revision_number`

### `categories`

- `id`, `name`, `slug`, `description`, `created_at`

### `article_categories`

- `article_id`, `category_id`

- složený primární klíč

### `comments`

- `id`, `article_id`, `author_id`, `body`, `created_at`, `updated_at`, `status`

- Komentáře musí být validované a moderovatelné.

### `article_ratings` (jen pokud se potvrdí konkrétní význam hodnocení)

- `article_id`, `user_id`, `rating` nebo definovaný štítek

- Omez jednu aktivní hodnotu na uživatele a článek.

- Nedefinuj neurčité skóre osob bez jasných pravidel a moderace.

### `media`

- `id`, `article_id`, `storage_path`, `alt_text`, `caption`, `uploaded_by`, `created_at`, `status`

- Ukládej cestu k souboru, nikoli neomezené binární soubory do tabulky.

### `article_links` (volitelné)

- `source_article_id`, `target_article_id`

- Použij, pokud se interní odkazy nedají spolehlivě odvozovat z obsahu.

### Bezpečnost databáze

- Zapni RLS na všech tabulkách přístupných z klienta.

- Veřejnost může číst jen publikované články, veřejné profily v minimálním rozsahu a schválená média.

- Zápis článků, revizí a komentářů vyžaduje ověřenou identitu.

- Role ověřuj pomocí důvěryhodných databázových pravidel/funkcí, ne podle hodnoty poslané klientem.

- Členové nesmí zapisovat do tabulek správy uživatelů ani měnit role.

- Změna článku a vytvoření revize mají proběhnout atomicky přes databázovou funkci/RPC nebo jiný bezpečný transakční postup.

- Migrace musí být opakovatelné tam, kde je to rozumné, a nesmí obsahovat reálná tajemství.

## 6. Přihlášení a přístup

- Použij Supabase Auth, preferuj e-mailový magic link nebo e-mail/heslo podle jednoduchosti implementace.

- Veřejné čtení nevyžaduje účet.

- Registrace členů musí být omezená: preferuj pozvánky nebo administrátorské schvalování. Nenechávej otevřenou registraci, pokud by tím mohl editovat kdokoli z internetu.

- Chyby přihlášení zobrazuj srozumitelně, ale neodhaluj citlivé interní detaily.

- Přihlašovací stav kontroluj při načtení stránky i při změně relace.

- Odhlášení musí zneplatnit klientskou relaci.

- Nikdy nepovažuj skrytí tlačítka v UI za bezpečnostní opatření; oprávnění musí vynucovat RLS/databáze.

## 7. Bezpečnost a soukromí

- Nikdy nevkládej `service_role` klíč, hesla, tokeny ani jiné tajné údaje do HTML, JavaScriptu, GitHubu nebo logů.

- Vytvoř `config.example.js` s jasně označenými zástupnými hodnotami a přidej skutečný lokální konfigurační soubor do `.gitignore`.

- Validuj vstupy v klientu i na důvěryhodné databázové vrstvě.

- Bezpečně vykresluj uživatelský obsah. Nepoužívej `innerHTML` pro neověřený text. Pokud se používá Markdown, použij udržovanou knihovnu a bezpečné sanitizování HTML; zakázat nebezpečné HTML a `javascript:` odkazy.

- Omez velikost, typ a počet uploadovaných souborů. Použij privátní nebo veřejné Storage buckety podle potřeby a správné Storage policies.

- Přidej ochranu proti spamu a omezení četnosti, pokud to zvolená platforma umožní.

- Nezveřejňuj adresy, telefonní čísla, přihlašovací údaje, zdravotní údaje ani jiné citlivé informace kamarádů bez jejich souhlasu.

- U osobních profilů a fotografií počítej s tím, že jde o reálné lidi. Umožni nahlášení a odstranění citlivého nebo škodlivého obsahu.

- Neimplementuj doxxing, veřejné zveřejňování soukromých tajemství ani funkce určené k obtěžování.

- Chyby loguj bez hesel, tokenů a zbytečných osobních údajů.

## 8. Obsah, URL a vyhledávání

- URL článků musí být stabilní a čitelné, například `article.html?slug=nejaka-picovina`, pokud hosting nepodporuje přepis URL.

- Slug vytvářej z názvu bezpečným a deterministickým způsobem; při kolizi nabídni unikátní variantu.

- Při přejmenování článku zachovej ID článku a ošetři staré odkazy.

- Interní odkazy nesmí rozbít stránku, pokud cílový článek neexistuje; nabídni vytvoření článku pouze oprávněným uživatelům.

- Vyhledávání musí být použitelné na mobilu a ovladatelné klávesnicí.

- U dlouhých článků vytvoř automatický obsah z nadpisů.

- Zachovej diakritiku při hledání, pokud možno podporuj i hledání bez diakritiky.

## 9. Média a časová osa

- Obrázky mají mít alternativní text a popisek.

- Ukládej metadata a soubory do Supabase Storage s pravidly přístupu.

- Časová osa zobrazuje pouze publikované incidenty s platným datem, řadí je chronologicky a umožňuje přejít na článek.

- Pokud není datum přesné, umožni uvést přibližné datum a jasně ho tak označ.

- Nepředstírej, že média nebo data existují, pokud nejsou v databázi.

## 10. Výkon a kompatibilita

- Web musí fungovat na aktuálních verzích Safari, Chrome, Firefox a Edge a na mobilních obrazovkách.

- Minimalizuj závislosti a nepřidávej framework bez důvodu.

- Neposílej zbytečně všechny články a média při každém načtení; používej stránkování nebo limity.

- Přidej stav načítání, prázdné stavy a srozumitelné chybové hlášky.

- Nezávislé části odděluj do modulů a opakovanou logiku nevkládej do více souborů.

## 11. Testování a kontrola kvality

Před dokončením změny:

1. Zkontroluj upravené soubory a `git diff`.

2. Spusť dostupné lint/test/build příkazy; pokud žádné nejsou, navrhni nejmenší rozumnou sadu.

3. Otestuj veřejné čtení bez přihlášení.

4. Otestuj přihlášení, odhlášení a zamítnutí neoprávněných akcí.

5. Ověř RLS pro anonymního návštěvníka, člena a admina.

6. Otestuj vytvoření článku, editaci, vznik revize a obnovu starší verze.
6a. Otestuj, že vytvoření i editace článku vytvoří/aktualizují content/articles/<slug>.md v GitHubu.
6b. Otestuj chybné a chybějící GitHub credentials, nedostatečná oprávnění, konflikt SHA a opakování synchronizace bez vytvoření duplicitní revize.

7. Otestuj vyhledávání, interní odkazy, kategorie, komentáře, média a časovou osu.

8. Otestuj mobilní rozložení, klávesnici, formuláře a chybové stavy.

9. Zkontroluj, že v repozitáři nejsou tajné klíče ani testovací osobní údaje.

10. Pokud něco nelze ověřit bez přístupů nebo konfigurace, výslovně to uveď.

Nevytvářej falešné testovací výsledky ani netvrď, že RLS funguje jen proto, že je v SQL souboru.

## 12. Dokumentace a práce s Git

- `README.md` musí obsahovat účel projektu, požadavky, spuštění lokálně, nastavení Supabase, aplikování migrací, konfiguraci hostingu a známá omezení.

- Přidej `.env.example` nebo `config.example.js` pouze se zástupnými hodnotami.

- `.gitignore` musí ignorovat lokální tajné konfigurace, závislosti, build výstupy a systémové soubory.

- Piš malé, srozumitelné změny; nepřepisuj nesouvisející části projektu.

- Nepouštěj destruktivní příkazy, nemaž data a nenasazuj produkční změny bez výslovného souhlasu uživatele.

- Před přidáním závislosti vysvětli její účel, pokud není zřejmý.

- Dokumentaci udržuj aktuální s implementací.

## 13. Doporučené pořadí implementace

1. Prozkoumej repozitář, shrň plán a založ základní HTML/CSS/JS strukturu.

2. Vytvoř responzivní vzhled domovské stránky a vzorové stránky článku s neosobními demo daty.

3. Navrhni databázové schéma a SQL migrace včetně RLS; ověř pravidla.

4. Připoj Supabase konfiguraci bez tajných klíčů v repozitáři.

5. Implementuj veřejné čtení, kategorie a vyhledávání.

6. Přidej autentizaci a omezenou registraci členů.
6a. Otestuj, že vytvoření i editace článku vytvoří/aktualizují content/articles/<slug>.md v GitHubu.
6b. Otestuj chybné a chybějící GitHub credentials, nedostatečná oprávnění, konflikt SHA a opakování synchronizace bez vytvoření duplicitní revize.

7. Implementuj tvorbu/editaci článků, revize a obnovu historie.

8. Přidej profily, incidenty, citáty, místa, komentáře, média a časovou osu.

9. Přidej správu a moderaci, přístupnost, chybové stavy a testy.

10. Připrav README a postup bezplatného nasazení. Produkční nasazení proveď až po souhlasu uživatele.

Po každé etapě stručně sděl, co bylo vytvořeno, jaké testy byly skutečně spuštěny a co je potřeba nakonfigurovat ručně.

## 14. Kritéria dokončení

Projekt není hotový, dokud:

- veřejný návštěvník může procházet a vyhledávat publikované články;

- oprávněný člen může vytvořit a upravit článek;

- každá úprava vytváří obnovitelnou revizi;

- role a oprávnění jsou vynucené databází/RLS;

- fungují interní odkazy, kategorie a časová osa;

- formuláře, komentáře a média mají validaci a bezpečné chybové stavy;

- rozhraní je responzivní a přístupné;

- README vysvětluje lokální spuštění, konfiguraci a nasazení;

- ověřené testy a zbývající omezení jsou jasně popsány.