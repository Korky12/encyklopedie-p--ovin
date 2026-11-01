# Encyklopedie píčovin

Webová encyklopedie věrně stylizovaná podle **Wikipedie**, určená pro kamarádskou partu k zaznamenávání největších průserů, historek, hlášek, kulinářských experimentů a místních legend.

Projekt je vytvořen z čistého sémantického HTML5, moderního CSS3 a vanilla JavaScriptu (ES moduly) tak, aby byl snadno srozumitelný i pro začátečníky. Funguje ihned po stažení v režimu náhledu i bez externích služeb a zároveň podporuje plnou integraci se **Supabase** (PostgreSQL, Auth, RLS, Storage).

---

## Hlavní funkce

- **Vzhled a chování Wikipedie:** Čistý Vector skin s charakteristickým levým panelem, záložkami (*Článek*, *Diskuse*, *Číst*, *Editovat*, *Zobrazit historii*), rámečkem obsahu (`#toc`), infoboxy s daty incidentů a spodní lištou kategorií. Ultra-čistý vzhled bez emoji.
- **Interní wikilinky:** Podpora odkazů `[[nazev-clanku]]` nebo `[[cilovy-slug|Zobrazený text]]`. Odkazy na existující hesla jsou modré; odkazy na dosud neexistující hesla jsou červené a jedním klikem vedou k jejich vytvoření.
- **Historie verzí a obnova:** Každá editace vytvoří novou revizi se jménem autora a shrnutím změny. Kteroukoliv starší verzi lze kdykoliv zobrazit nebo jedním klikem obnovit.
- **Interaktivní časová osa:** Chronologický přehled všech zdokumentovaných incidentů s filtrováním podle roku a místa.
- **Rychlé vyhledávání:** Okamžitý našeptávač s ovládáním klávesnicí (šipky, Enter, Escape) i dedikovaná stránka výsledků s tolerancí české diakritiky.
- **Komentáře a diskuse:** Možnost přidávat svědectví a vzpomínky k jednotlivým článkům.
- **Bezpečnost databáze a RLS:** Veřejnost může číst publikovaná hesla; zápis, úpravy a komentáře jsou chráněny Row Level Security pravidly. Administrátor má k dispozici panel pro soft-delete a moderaci.
- **Připraveno k okamžitému vyzkoušení (Demo mód):** Pokud ještě nemáte vytvořený projekt na Supabase, aplikace automaticky naběhne s ukázkovými daty a umožní vám v horní žluté liště přepínat role (*Anonymní čtenář*, *Člen party*, *Administrátor*).

---

## Struktura projektu

```text
encyklopedie-picovin/
├── index.html                 # Hlavní strana encyklopedie (portál)
├── article.html               # Stránka článku (infobox, TOC, text, diskuse)
├── edit.html                  # Editor hesel s živým náhledem a revizemi
├── history.html               # Historie revizí a obnova verzí
├── category.html              # Prohlížení kategorií a abecední index hesel
├── timeline.html              # Časová osa incidentů
├── search.html                # Výsledky vyhledávání
├── login.html                 # Přihlášení (e-mail + heslo / Magic Link)
├── profile.html               # Uživatelský profil a přehled vlastních editací
├── admin.html                 # Moderace článků a správa pro administrátory
├── server.js                  # Lokální dev server (zero-dependency)
├── package.json               # Skripty pro spuštění a testování
├── assets/
│   ├── css/
│   │   ├── base.css           # Proměnné, typografie a reset
│   │   ├── layout.css         # Wikipedie záhlaví, sidebar a responzivita
│   │   └── components.css     # Infobox, TOC, kategorie, karty a časová osa
│   ├── js/
│   │   ├── config.example.js  # Vzor pro konfiguraci Supabase
│   │   ├── supabase-client.js # Klient Supabase s fallbackem na lokální úložiště
│   │   ├── articles.js        # Zpracování hesel, revize, Markdown parser a TOC
│   │   ├── search.js          # Vyhledávání s podporou diakritiky a našeptávač
│   │   ├── auth.js            # Autentizace a správa rolí (member / admin)
│   │   ├── demo-data.js       # Vzorová data pro offline provoz
│   │   └── ui.js              # Inicializace navigace, menu a přepínače rolí
│   └── images/
│       └── logo.svg           # Logo Encyklopedie píčovin
├── supabase/
│   ├── migrations/
│   │   └── 20261101000000_initial_schema.sql  # SQL schéma, RLS politiky a RPC
│   └── seed.sql               # Výchozí kategorie a ukázkový článek
├── tests/
│   ├── unit.test.js           # Testy slugifikace, HTML sanitizace a markdownu
│   └── migration.test.js      # Kontrola SQL migrací a RLS politik
├── .gitignore
├── README.md
└── AGENTS.md
```

---

## Rychlé spuštění lokálně

K běhu nepotřebujete žádné externí knihovny ani instalaci přes `npm install` – vše funguje na čistém Node.js.

1. **Spusťte lokální server:**
   ```bash
   npm start
   ```
   Server naběhne na adrese [http://localhost:3000](http://localhost:3000).

2. **Spusťte automatizované testy:**
   ```bash
   npm test
   ```

---

## Nastavení Supabase databáze

Pokud chcete data sdílet online s kamarády, založte si bezplatný projekt na [supabase.com](https://supabase.com).

### 1. Aplikování databázové migrace
1. V administraci Supabase přejděte do **SQL Editoru**.
2. Otevřete a zkopírujte obsah souboru `supabase/migrations/20261101000000_initial_schema.sql` a klikněte na **Run**.
3. Následně zkopírujte a spusťte obsah souboru `supabase/seed.sql` pro naplnění výchozích kategorií.

### 2. Konfigurace klienta
1. V kořenové složce projektu zkopírujte `assets/js/config.example.js` jako `assets/js/config.js`:
   ```bash
   cp assets/js/config.example.js assets/js/config.js
   ```
2. V administraci Supabase přejděte do **Project Settings -> API**.
3. Do souboru `assets/js/config.js` vložte:
   ```javascript
   export const SUPABASE_CONFIG = {
     url: 'https://VAS-PROJEKT.supabase.co',
     anonKey: 'VAS_VEREJNY_ANON_KLIC',
     fallbackToDemoData: true
   };
   ```
   > **DŮLEŽITÉ UPOZORNĚNÍ:** Nikdy do kódu nevkládejte `service_role` klíč! Používejte výhradně veřejný `anon` klíč. Soubor `assets/js/config.js` je v `.gitignore`.

---

## Bezplatné nasazení (Hosting)

Projekt tvoří čistě statické soubory, které lze zdarma nasadit na:

### Možnost A: Cloudflare Pages (Doporučeno)
1. Přihlaste se na [dash.cloudflare.com](https://dash.cloudflare.com) a přejděte do **Workers & Pages -> Create application -> Pages**.
2. Propojte svůj GitHub repozitář `Korky12/encyklopedie-p--ovin`.
3. Nastavení buildu:
   - **Framework preset:** `None`
   - **Build command:** *ponechte prázdné*
   - **Build output directory:** `/` (kořen repozitáře)
4. Klikněte na **Save and Deploy**. Web bude okamžitě dostupný na rychlé globální CDN s HTTPS.

### Možnost B: GitHub Pages
1. V repozitáři na GitHubu otevřete **Settings -> Pages**.
2. V sekci **Build and deployment** zvolte **Source: Deploy from a branch**.
3. Vyberte větev `master` (nebo `main`) a složku `/ (root)`.
4. Uložte.

---

## Pravidla a soukromí

- Obsah encyklopedie má sloužit pro pobavení party. V souladu s `AGENTS.md` **nesmí** žádné heslo obsahovat citlivé soukromé údaje (telefonní čísla, adresy, rodná čísla ani přístupová hesla).
- Pokud kterýkoliv člen party požádá o skrytí či úpravu svého profilu či zmínky, administrátor provede úpravu nebo heslo soft-deletuje.
