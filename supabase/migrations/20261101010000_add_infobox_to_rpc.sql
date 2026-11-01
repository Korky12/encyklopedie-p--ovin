-- ====================================================================
-- Migrace: Podpora infobox_data v atomické RPC funkci save_article_revision
-- ====================================================================

CREATE OR REPLACE FUNCTION public.save_article_revision(
    p_slug TEXT,
    p_title TEXT,
    p_summary TEXT,
    p_content TEXT,
    p_article_type article_type_enum,
    p_incident_date TIMESTAMPTZ,
    p_incident_location TEXT,
    p_edit_summary TEXT,
    p_infobox_data JSONB DEFAULT '{}'::jsonb
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
            infobox_data, created_by, updated_by, status
        )
        VALUES (
            p_slug, p_title, p_summary, p_content, p_article_type, p_incident_date, p_incident_location,
            COALESCE(p_infobox_data, '{}'::jsonb), v_user_id, v_user_id, 'published'
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
            infobox_data = COALESCE(p_infobox_data, '{}'::jsonb),
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
