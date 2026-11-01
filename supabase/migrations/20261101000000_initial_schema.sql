-- ====================================================================
-- Encyklopedie píčovin – Inicializační migrace (Schéma, RLS, Funkce)
-- ====================================================================

-- 1. Typy a výčty (Enums)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE article_status AS ENUM ('published', 'hidden', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE article_type_enum AS ENUM ('person', 'incident', 'quote', 'place', 'general');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabulka profilů (vazba na auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_path TEXT,
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Pomocná bezpečnostní funkce: ověření zda je volající admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Pomocná bezpečnostní funkce: ověření zda je volající ověřený člen
CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
    );
$$;

-- Automatické založení profilu při registraci nového uživatele přes Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        'member'
    );
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Tabulka kategorií
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Tabulka článků
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    article_type article_type_enum NOT NULL DEFAULT 'general',
    incident_date TIMESTAMPTZ,
    incident_location TEXT,
    infobox_data JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status article_status NOT NULL DEFAULT 'published',
    views_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_incident_date ON public.articles(incident_date);

-- 5. Vazební tabulka článků a kategorií (M:N)
CREATE TABLE IF NOT EXISTS public.article_categories (
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

-- 6. Tabulka historie revizí článků
CREATE TABLE IF NOT EXISTS public.article_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    article_type article_type_enum NOT NULL DEFAULT 'general',
    incident_date TIMESTAMPTZ,
    editor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    edit_summary TEXT NOT NULL DEFAULT 'Úprava článku',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(article_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_revisions_article ON public.article_revisions(article_id, revision_number DESC);

-- 7. Tabulka komentářů a diskusí
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    status article_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON public.comments(article_id);

-- 8. Tabulka médií (ukládá metadata a cestu do Supabase Storage)
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status article_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Profily:
-- Veřejnost může číst display_name a avatar
CREATE POLICY "Profily jsou veřejně čitelné"
    ON public.profiles FOR SELECT
    USING (true);

-- Uživatel může upravit jen svůj vlastní profil, ale NESMÍ si sám změnit roli na admina
CREATE POLICY "Uživatel může aktualizovat svůj profil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
    );

-- Kategorie:
CREATE POLICY "Kategorie jsou veřejně čitelné"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Členové mohou přidávat kategorie"
    ON public.categories FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member());

-- Články:
CREATE POLICY "Veřejnost může číst publikované články"
    ON public.articles FOR SELECT
    USING (status = 'published' OR (auth.uid() IS NOT NULL AND (public.is_member() OR public.is_admin())));

CREATE POLICY "Přihlášení členové mohou vytvářet články"
    ON public.articles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member());

CREATE POLICY "Přihlášení členové mohou upravovat články"
    ON public.articles FOR UPDATE
    TO authenticated
    USING (public.is_member() OR public.is_admin())
    WITH CHECK (public.is_member() OR public.is_admin());

-- Revize:
CREATE POLICY "Revize jsou čitelné pro publikované články"
    ON public.article_revisions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.articles
            WHERE id = article_revisions.article_id AND status = 'published'
        ) OR public.is_member()
    );

CREATE POLICY "Členové mohou vytvářet revize"
    ON public.article_revisions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member());

-- Články - Kategorie:
CREATE POLICY "Přiřazení kategorií je veřejně čitelné"
    ON public.article_categories FOR SELECT
    USING (true);

CREATE POLICY "Členové mohou přiřazovat kategorie"
    ON public.article_categories FOR ALL
    TO authenticated
    USING (public.is_member())
    WITH CHECK (public.is_member());

-- Komentáře:
CREATE POLICY "Publikované komentáře jsou veřejně čitelné"
    ON public.comments FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Členové mohou psát komentáře"
    ON public.comments FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member() AND author_id = auth.uid());

CREATE POLICY "Autor nebo admin může upravovat komentář"
    ON public.comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() OR public.is_admin());

-- Média:
CREATE POLICY "Média jsou veřejně čitelná"
    ON public.media FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Členové mohou nahrávat média"
    ON public.media FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member());

-- ====================================================================
-- ATOMICKÉ RPC FUNKCE PRO UKLÁDÁNÍ A OBNOVU REVIZÍ
-- ====================================================================

-- Atomické uložení článku a vytvoření nové revize
CREATE OR REPLACE FUNCTION public.save_article_revision(
    p_slug TEXT,
    p_title TEXT,
    p_summary TEXT,
    p_content TEXT,
    p_article_type article_type_enum,
    p_incident_date TIMESTAMPTZ,
    p_incident_location TEXT,
    p_edit_summary TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_article_id UUID;
    v_next_rev INTEGER;
    v_result JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Nejste přihlášeni.';
    END IF;

    -- Zjistíme, zda článek již existuje podle slugu
    SELECT id INTO v_article_id FROM public.articles WHERE slug = p_slug;

    IF v_article_id IS NULL THEN
        -- Vytvoření nového článku
        INSERT INTO public.articles (
            slug, title, summary, content, article_type, incident_date, incident_location,
            created_by, updated_by, status
        )
        VALUES (
            p_slug, p_title, p_summary, p_content, p_article_type, p_incident_date, p_incident_location,
            v_user_id, v_user_id, 'published'
        )
        RETURNING id INTO v_article_id;

        v_next_rev := 1;
    ELSE
        -- Aktualizace existujícího článku
        UPDATE public.articles
        SET
            title = p_title,
            summary = p_summary,
            content = p_content,
            article_type = p_article_type,
            incident_date = p_incident_date,
            incident_location = p_incident_location,
            updated_by = v_user_id,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_article_id;

        -- Výpočet dalšího čísla revize
        SELECT COALESCE(MAX(revision_number), 0) + 1
        INTO v_next_rev
        FROM public.article_revisions
        WHERE article_id = v_article_id;
    END IF;

    -- Uložení záznamu do historie revizí
    INSERT INTO public.article_revisions (
        article_id, revision_number, title, summary, content, article_type, incident_date,
        editor_id, edit_summary
    )
    VALUES (
        v_article_id, v_next_rev, p_title, p_summary, p_content, p_article_type, p_incident_date,
        v_user_id, COALESCE(p_edit_summary, 'Úprava článku')
    );

    v_result := jsonb_build_object(
        'id', v_article_id,
        'slug', p_slug,
        'revision_number', v_next_rev
    );

    RETURN v_result;
END;
$$;

-- Obnova předchozí revize článku
CREATE OR REPLACE FUNCTION public.restore_article_revision(
    p_article_id UUID,
    p_revision_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_rev RECORD;
    v_next_rev INTEGER;
    v_slug TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Nejste přihlášeni.';
    END IF;

    -- Načteme cílovou revizi
    SELECT * INTO v_rev
    FROM public.article_revisions
    WHERE id = p_revision_id AND article_id = p_article_id;

    IF v_rev IS NULL THEN
        RAISE EXCEPTION 'Požadovaná revize nebyla nalezena.';
    END IF;

    -- Aktualizujeme článek snapshotem z dané revize
    UPDATE public.articles
    SET
        title = v_rev.title,
        summary = v_rev.summary,
        content = v_rev.content,
        article_type = v_rev.article_type,
        incident_date = v_rev.incident_date,
        updated_by = v_user_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_article_id
    RETURNING slug INTO v_slug;

    -- Vytvoříme novou revizi s informací o obnově
    SELECT COALESCE(MAX(revision_number), 0) + 1
    INTO v_next_rev
    FROM public.article_revisions
    WHERE article_id = p_article_id;

    INSERT INTO public.article_revisions (
        article_id, revision_number, title, summary, content, article_type, incident_date,
        editor_id, edit_summary
    )
    VALUES (
        p_article_id, v_next_rev, v_rev.title, v_rev.summary, v_rev.content, v_rev.article_type, v_rev.incident_date,
        v_user_id, format('Obnovena verze č. %s ze dne %s', v_rev.revision_number, v_rev.created_at::date)
    );

    RETURN jsonb_build_object('success', true, 'article_id', p_article_id, 'slug', v_slug, 'new_revision', v_next_rev);
END;
$$;
