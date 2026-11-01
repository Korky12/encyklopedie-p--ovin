/**
 * Vzorová demo data pro Encyklopedii píčovin.
 * Slouží pro okamžité offline zobrazení a vývoj před připojením živé Supabase databáze.
 */

export const INITIAL_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'Legendární incidenty',
    slug: 'legendarni-incidenty',
    description: 'Největší průsery, výbuchy, požáry a události, o kterých se bude vyprávět ještě vnoučatům.'
  },
  {
    id: 'cat-2',
    name: 'Ožralé nápady a sázky',
    slug: 'ozrale-napady',
    description: 'Nápady, které v pátek ve 2 ráno zněly jako Nobelova cena za genialitu.'
  },
  {
    id: 'cat-3',
    name: 'Místní hrdinové a postavy',
    slug: 'mistni-hrdinove',
    description: 'Významné osobnosti party, vynálezci nesmyslů a držitelé bizarních rekordů.'
  },
  {
    id: 'cat-4',
    name: 'Zlaté hlášky a moudra',
    slug: 'zlaten-hlasky',
    description: 'Okřídlené věty pronesené těsně před katastrofou nebo při hlubokém filosofování v pajzlu.'
  },
  {
    id: 'cat-5',
    name: 'Kulinářské katastrofy',
    slug: 'kulinarske-katastrofy',
    description: 'Pokusy o vaření ze surovin, které se v lednici našly po půlnoci.'
  },
  {
    id: 'cat-6',
    name: 'Kultovní místa a pajzly',
    slug: 'kultovni-mista',
    description: 'Lokality historického významu – od hospod IV. cenové až po lavičku za trafem.'
  }
];

export const INITIAL_ARTICLES = [
  {
    id: 'art-1',
    slug: 'incident-s-balkonovym-grilem-2023',
    title: 'Incident s balkonovým grilem (2023)',
    summary: 'Nešťastná událost z léta 2023, kdy se pokus o rychlé ugrilování klobásy zvrhnul v lokální zakouření celého sídliště a roztavení zahradního křesla.',
    article_type: 'incident',
    incident_date: '2023-07-15T21:30:00Z',
    incident_location: 'Balkón 3. patro, panelák C4',
    status: 'published',
    created_at: '2023-07-16T10:15:00Z',
    updated_at: '2024-03-10T18:42:00Z',
    created_by: 'Kuba',
    updated_by: 'Vóma',
    views_count: 1337,
    categories: ['legendarni-incidenty', 'kulinarske-katastrofy'],
    infobox: {
      type: 'Incident',
      image: '',
      image_caption: 'Rekonstrukce ohořelého balkónu',
      data: [
        { label: 'Datum', value: '15. července 2023, 21:30' },
        { label: 'Místo', value: 'Balkón 3. patro, panelák C4' },
        { label: 'Typ události', value: 'Nekontrolovaný ohňostroj klobás' },
        { label: 'Příčina', value: 'Použití technického lihu jako podpalovače' },
        { label: 'Oběti', value: '1 plastové křeslo z Bauhausu, 4 klobásy' },
        { label: 'Finanční škoda', value: '850 Kč (křeslo) + 120 Kč (uzenina)' },
        { label: 'Status vyšetřování', value: 'Uzavřeno jako „příště radši objednáme pizzu“' }
      ]
    },
    content: `## Úvod
**Incident s balkonovým grilem z roku 2023** představuje jeden z klíčových milníků v dějinách letních akcí naší party. Událost proběhla v sobotu 15. července okolo 21:30 SELČ a její následky jsou na fasádě domu patrné dodnes.

## Předehra
Kolem osmé hodiny večerní padl v obývacím pokoji návrh: *„Přece si nebudeme objednávat pizzu za tři kila, když máme v mrazáku ty klobásy od babičky.“* Tato věta, v odborné literatuře často klasifikovaná jako katalyzátor neštěstí (viz článek [[to-das-v-klidu-brasko]]), vedla k vytažení jednorázového grilu zakoupeného před třemi lety ve slevě za 49 Kč.

Brikety však odmítaly hořet běžným způsobem kvůli skladování ve vlhkém sklepě. Vrchní velitel operace se proto rozhodl sáhnout po kanystru v předsíni, o kterém se mylně domníval, že obsahuje běžný tekutý podpalovač. Ve skutečnosti šlo o 96% technický líh určený k čištění motoru.

## Průběh incidentu
1. **21:28** – Aplikace cca 300 ml technického lihu přímo na chladné brikety.
2. **21:29** – Škrtnutí zápalkou. Výsledek popsal svědek slovy: *„Záblesk jak při testu vodíkové pumy na atolu Bikini.“*
3. **21:30** – Tlaková vlna odfoukla plastové křeslo přímo nad plameny.
4. **21:32** – Zahájeno hašení pomocí dvou lahví minerálky Mattoni a zbytku vlažného piva Gambrinus.
5. **21:35** – Soused z horního patra začal volat policii v domnění, že v domě explodovala laboratoř pervitinu.

## Důsledky a škody
- **Materiální škody:** Zcela roztavené zahradní křeslo, začernalá zeď balkónu v ploše 2,4 m² a absolutní kremace čtyř klobás, které získaly konzistenci i chuť antracitového uhlí.
- **Zdravotní následky:** Ohořelé obočí hlavního aktéra, které dorůstalo přibližně tři měsíce.
- **Kulturní dopad:** Na všech dalších akcích byl zaveden přísný zákaz vstupu s otevřeným ohněm do okruhu 5 metrů od jakéhokoliv balkónu.

## Související články
- [[mistr-tomas-voma]] – Hlavní podezřelý a držitel zápalky
- [[to-das-v-klidu-brasko]] – Poslední slova pronesená před škrtnutím
- [[hospoda-u-zlomene-pipy]] – Místo, kde se celá akce plánovala`
  },
  {
    id: 'art-2',
    slug: 'mistr-tomas-voma',
    title: 'Mistr Tomáš „Vóma“',
    summary: 'Teoretický fyzik hospodského stolu, objevitel tzv. Vómovy konstanty opilosti a neúspěšný konstruktér automatického otvíráku lahví.',
    article_type: 'person',
    incident_date: null,
    incident_location: 'Hospoda U Zlomené pípy',
    status: 'published',
    created_at: '2023-08-01T12:00:00Z',
    updated_at: '2024-02-14T20:10:00Z',
    created_by: 'Admin',
    updated_by: 'Kuba',
    views_count: 2480,
    categories: ['mistni-hrdinove', 'zlaten-hlasky'],
    infobox: {
      type: 'Osoba / Hrdina',
      image: '',
      image_caption: 'Vóma při přednášce o termodynamice piva',
      data: [
        { label: 'Celé jméno', value: 'Tomáš V. (Vóma)' },
        { label: 'Titul', value: 'Doktor hospodských věd (honoris causa)' },
        { label: 'Hlavní objev', value: 'Vómova konstanta (K = 7 piv)' },
        { label: 'Oblíbený nápoj', value: 'Tuzemák s kofolou, pivo ležák' },
        { label: 'Nejznámější výrok', value: '„Kluci, mám nápad za milion!“' },
        { label: 'Stav', value: 'Živý, ale občas nedostupný po 22:00' }
      ]
    },
    content: `## Životopis
**Tomáš „Vóma“** (* 1997) je ústřední postavou mnoha historických epizod party. Po maturitě se rozhodl věnovat aplikovanému pivnímu bádání a konstrukci zlepšováků, které zpravidla končí zásahem pohotovosti nebo elektrikářů.

## Vědecké objevy
### Vómova konstanta
Definována jako přesné množství alkoholu v krvi (odpovídající přibližně 7 dvanáctkám), při kterém se jedinec začne domnívat, že:
1. Umí plynně španělsky,
2. Přeskočí nákupní vozík bez dotyku,
3. Dokáže vyhrát debatu o geopolitice s kýmkoliv u vedlejšího stolu.

### Automatický otvírák z roku 2022
Vóma sestrojil ze staré tiskárny a gumiček zařízení na otevírání korunkových uzávěrů. Při premiérové demonstraci v [[hospoda-u-zlomene-pipy]] přístroj vystřelil zátku rychlostí 90 km/h do stropního svítidla, které se roztříštilo do talíře s utopencem.

## Hlášky
- *„Kluci, tohle je stoprocentně bezpečný, to mám spočítaný.“*
- *„Dejte mi ještě pět minut a ten motor naskočí sám.“*
- *„Já nepiju, já jenom hydratuju mozek před strategickým tahem.“*`
  },
  {
    id: 'art-3',
    slug: 'hospoda-u-zlomene-pipy',
    title: 'Hospoda U Zlomené pípy',
    summary: 'Kultovní zařízení IV. cenové skupiny, kde se podle dochovaných kronik zrodila většina nápadů a katastrof popsaných v této encyklopedii.',
    article_type: 'place',
    incident_date: null,
    incident_location: 'Dolní Náměstí 14',
    status: 'published',
    created_at: '2023-08-10T15:20:00Z',
    updated_at: '2024-01-20T11:00:00Z',
    created_by: 'Kuba',
    updated_by: 'Kuba',
    views_count: 915,
    categories: ['kultovni-mista'],
    infobox: {
      type: 'Lokalita',
      image: '',
      image_caption: 'Vstup do lokálu v mlžném oparu',
      data: [
        { label: 'Adresa', value: 'Dolní Náměstí 14' },
        { label: 'Cenová skupina', value: 'IV. (oficiálně), V. (pocitově)' },
        { label: 'Výčepní', value: 'Pan Zdeněk (nekompromisní)' },
        { label: 'Specialita podniku', value: 'Utopenec s cibulí a respektem' },
        { label: 'Stav toalet', value: 'Kdo nevstoupil, neuvěří' }
      ]
    },
    content: `## Historie a význam
**Hospoda U Zlomené pípy** představuje parlament a generální štáb party. Podle neověřených údajů zde byla sepsána většina plánů na letní výpravy, sázky a podnikatelské záměry, z nichž 99,8 % skončilo krachem ještě před zavírací hodinou.

## Architektura
Interiér je vyveden v pozdním normalizačním dřevotřískovém slohu s dominantní pachovou stopou nakládaného hermelínu a čisticího prostředku Savo. Stůl číslo 4 v rohu u jukeboxu je neoficiálně rezervován pro naši partu od roku 2018.

## Pravidla podniku
1. Pan Zdeněk má vždycky pravdu.
2. Pokud pan Zdeněk nemá pravdu, platí pravidlo č. 1 a pivo dostanete až za půl hodiny.
3. Karta se nebere, hotovost je král.
4. Jukebox přijímá pouze dvacetikoruny a písničky od Michala Davida se pouští na vlastní nebezpečí.`
  },
  {
    id: 'art-4',
    slug: 'to-das-v-klidu-brasko',
    title: '„To dáš v klidu, bráško“',
    summary: 'Historická poslední slova pronesená před 87 % zdokumentovaných zranění, pokut, roztržených kalhot a pádů ze zídky.',
    article_type: 'quote',
    incident_date: null,
    incident_location: 'Univerzální výskyt',
    status: 'published',
    created_at: '2023-09-02T18:00:00Z',
    updated_at: '2024-02-01T09:30:00Z',
    created_by: 'Vóma',
    updated_by: 'Admin',
    views_count: 3120,
    categories: ['zlaten-hlasky', 'legendarni-incidenty'],
    infobox: {
      type: 'Zlatá hláška',
      image: '',
      image_caption: '',
      data: [
        { label: 'Fráze', value: '„To dáš v klidu, bráško“' },
        { label: 'Alternativní verze', value: '„Koukej na tohle“, „Věř mi“' },
        { label: 'Úmrtnost nápadu', value: '94,2 %' },
        { label: 'Typická reakce', value: 'Zavolání záchranky nebo smích' }
      ]
    },
    content: `## Jazykový rozbor
Věta **„To dáš v klidu, bráško“** plní v kamarádské komunikaci roli falešného uklidnění. Foneticky působí přátelsky, avšak pragmaticky představuje výzvu k sebezničujícímu chování.

## Statistika incidentů
Z průzkumu provedeného mezi členy party vyplývá:
- 42 % případů vedlo k natržení textilu.
- 28 % případů skončilo v kaluži nebo rybníku.
- 19 % vedlo k pokutě od městské policie.
- 11 % skončilo úspěchem, o kterém se však nikdo nedozvěděl, protože zrovna nikdo nenatáčel.`
  },
  {
    id: 'art-5',
    slug: 'syrove-monstrum-ze-mikrovlnky',
    title: 'Sýrové monstrum ze mikrovlnky',
    summary: 'Kulinářský experiment sestávající ze šesti druhů prošlých sýrů, který vytvořil hmotu schopnou odolat i průmyslovému ředidlu a zničil talíř za 200 Kč.',
    article_type: 'incident',
    incident_date: '2024-01-08T02:15:00Z',
    incident_location: 'Kuchyň na privátě',
    status: 'published',
    created_at: '2024-01-08T11:00:00Z',
    updated_at: '2024-01-08T11:00:00Z',
    created_by: 'Kuba',
    updated_by: 'Kuba',
    views_count: 840,
    categories: ['kulinarske-katastrofy', 'legendarni-incidenty'],
    infobox: {
      type: 'Kulinářský incident',
      image: '',
      image_caption: '',
      data: [
        { label: 'Datum', value: '8. ledna 2024, 02:15' },
        { label: 'Místo', value: 'Kuchyň na privátě' },
        { label: 'Složení', value: 'Eidam 30%, niva, hermelín, tavený sýr, parmezán, gouda' },
        { label: 'Doba ohřevu', value: '7 minut na plný výkon (900 W)' },
        { label: 'Výsledek', value: 'Polymerní pryskyřice' }
      ]
    },
    content: `## Popis události
V noci z neděle na pondělí po návratu z akce dostali přítomní členové nezvladatelný hlad. Vzhledem k absenci pečiva bylo rozhodnuto roztavit všechny nalezené zbytky sýrů na jednom hlubokém talíři.

Nastavený čas 7 minut při 900 W proměnil směs v neprůstřelnou hmotu barvy starého linolea. Po zchladnutí hmota srostla s porcelánem na molekulární úrovni. Talíř musel být slavnostně pohřben do směsného odpadu.`
  }
];

export const INITIAL_REVISIONS = [
  {
    id: 'rev-1-1',
    article_id: 'art-1',
    revision_number: 1,
    title: 'Incident s balkonovým grilem (2023)',
    summary: 'První verze popisu balkónového požáru.',
    content: `## Úvod\nKuba s Vómou grilovali na balkóně a málem vyhořel barák.\n\n## Průběh\nPolili to lihem a bouchlo to. Křeslo shořelo na uhel.`,
    editor_id: 'user-kuba',
    editor_name: 'Kuba',
    edit_summary: 'Založení článku po vystřízlivění',
    created_at: '2023-07-16T10:15:00Z'
  },
  {
    id: 'rev-1-2',
    article_id: 'art-1',
    revision_number: 2,
    title: 'Incident s balkonovým grilem (2023)',
    summary: 'Nešťastná událost z léta 2023, kdy se pokus o rychlé ugrilování klobásy zvrhnul v lokální zakouření celého sídliště a roztavení zahradního křesla.',
    content: INITIAL_ARTICLES[0].content,
    editor_id: 'user-voma',
    editor_name: 'Vóma',
    edit_summary: 'Doplnění detailů o technickém lihu a výslechu u souseda',
    created_at: '2024-03-10T18:42:00Z'
  }
];

export const INITIAL_COMMENTS = [
  {
    id: 'com-1',
    article_id: 'art-1',
    author_name: 'Soused z 4. patra',
    body: 'Dodnes mám ten kouř v záclonách, vy hovada! Ale klobásy voněly slušně.',
    created_at: '2023-07-17T14:20:00Z'
  },
  {
    id: 'com-2',
    article_id: 'art-1',
    author_name: 'Vóma',
    body: 'Příště vezmeme brikety z benzínky, tyhle byly prostě navlhlý, moje chyba to nebyla.',
    created_at: '2023-07-17T19:05:00Z'
  }
];
