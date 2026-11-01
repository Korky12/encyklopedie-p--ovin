-- ====================================================================
-- Encyklopedie píčovin – Počáteční data (Seed)
-- ====================================================================

-- 1. Výchozí kategorie
INSERT INTO public.categories (id, name, slug, description)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Legendární incidenty', 'legendarni-incidenty', 'Největší průsery, výbuchy, požáry a události, o kterých se bude vyprávět ještě vnoučatům.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (id, name, slug, description)
VALUES
  ('c0000002-0000-0000-0000-000000000002', 'Ožralé nápady a sázky', 'ozrale-napady', 'Nápady, které v pátek ve 2 ráno zněly jako Nobelova cena za genialitu.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (id, name, slug, description)
VALUES
  ('c0000003-0000-0000-0000-000000000003', 'Místní hrdinové a postavy', 'mistni-hrdinove', 'Významné osobnosti party, vynálezci nesmyslů a držitelé bizarních rekordů.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (id, name, slug, description)
VALUES
  ('c0000004-0000-0000-0000-000000000004', 'Zlaté hlášky a moudra', 'zlaten-hlasky', 'Okřídlené věty pronesené těsně před katastrofou nebo při hlubokém filosofování v pajzlu.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (id, name, slug, description)
VALUES
  ('c0000005-0000-0000-0000-000000000005', 'Kulinářské katastrofy', 'kulinarske-katastrofy', 'Pokusy o vaření ze surovin, které se v lednici našly po půlnoci.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (id, name, slug, description)
VALUES
  ('c0000006-0000-0000-0000-000000000006', 'Kultovní místa a pajzly', 'kultovni-mista', 'Lokality historického významu – od hospod IV. cenové až po lavičku za trafem.')
ON CONFLICT (slug) DO NOTHING;

-- 2. Vzorový článek: Incident s balkonovým grilem
INSERT INTO public.articles (
    id, slug, title, summary, content, article_type, incident_date, incident_location, status
)
VALUES (
    'a0000001-0000-0000-0000-000000000001',
    'incident-s-balkonovym-grilem-2023',
    'Incident s balkonovým grilem (2023)',
    'Nešťastná událost z léta 2023, kdy se pokus o rychlé ugrilování klobásy zvrhnul v lokální zakouření celého sídliště a roztavení zahradního křesla.',
    '## Úvod\n**Incident s balkonovým grilem z roku 2023** představuje jeden z klíčových milníků v dějinách letních akcí naší party. Událost proběhla v sobotu 15. července okolo 21:30 SELČ a její následky jsou na fasádě domu patrné dodnes.\n\n## Předehra\nKolem osmé hodiny večerní padl v obývacím pokoji návrh: *„Přece si nebudeme objednávat pizzu za tři kila, když máme v mrazáku ty klobásy od babičky.“* Tato věta, v odborné literatuře často klasifikovaná jako katalyzátor neštěstí, vedla k vytažení jednorázového grilu.\n\nBrikety však odmítaly hořet kvůli vlhku ze sklepa. Vrchní velitel operace se proto rozhodl sáhnout po kanystru v předsíni, o kterém se mylně domníval, že obsahuje běžný tekutý podpalovač. Ve skutečnosti šlo o 96% technický líh.\n\n## Průběh incidentu\n1. **21:28** – Aplikace cca 300 ml technického lihu na chladné brikety.\n2. **21:29** – Škrtnutí zápalkou. Záblesk odfoukl plastové křeslo přímo nad plameny.\n3. **21:32** – Zásah minerálkou Mattoni a pivem Gambrinus.\n\n## Následky a škody\nZcela roztavené plastové křeslo z Bauhausu a absolutní kremace čtyř klobás.',
    'incident',
    '2023-07-15 21:30:00+02',
    'Balkón 3. patro, panelák C4',
    'published'
)
ON CONFLICT (slug) DO NOTHING;

-- Přiřazení kategorie
INSERT INTO public.article_categories (article_id, category_id)
VALUES (
    'a0000001-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- První revize pro tento článek
INSERT INTO public.article_revisions (
    article_id, revision_number, title, summary, content, article_type, incident_date, edit_summary
)
VALUES (
    'a0000001-0000-0000-0000-000000000001',
    1,
    'Incident s balkonovým grilem (2023)',
    'Nešťastná událost z léta 2023, kdy se pokus o rychlé ugrilování klobásy zvrhnul v lokální zakouření celého sídliště a roztavení zahradního křesla.',
    '## Úvod\n**Incident s balkonovým grilem z roku 2023** představuje jeden z klíčových milníků v dějinách letních akcí naší party. Událost proběhla v sobotu 15. července okolo 21:30 SELČ a její následky jsou na fasádě domu patrné dodnes.',
    'incident',
    '2023-07-15 21:30:00+02',
    'Založení článku podle pamětníků'
)
ON CONFLICT DO NOTHING;
