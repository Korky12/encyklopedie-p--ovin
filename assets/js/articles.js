/**
 * Logika pro správu článků, revizí, formátování a bezpečné vykreslování textu.
 */
import { supabase, isDemoMode, getLocalStore } from './supabase-client.js';

// Převod českého textu na bezpečný URL slug
export function slugify(text) {
  if (!text) return '';
  const czechMap = {
    'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e', 'í': 'i', 'ň': 'n',
    'ó': 'o', 'ř': 'r', 'š': 's', 'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z',
    'Á': 'a', 'Č': 'c', 'Ď': 'd', 'É': 'e', 'Ě': 'e', 'Í': 'i', 'Ň': 'n',
    'Ó': 'o', 'Ř': 'r', 'Š': 's', 'Ť': 't', 'Ú': 'u', 'Ů': 'u', 'Ý': 'y', 'Ž': 'z'
  };

  return text
    .split('')
    .map(char => czechMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Formátování českého data
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Ochrana před XSS (HTML escaping)
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Bezpečná sanitace odkazů (blokování javascript: a data:)
export function sanitizeUrl(url) {
  if (!url) return '#';
  const clean = url.trim();
  if (/^(javascript:|data:|vbscript:)/i.test(clean)) {
    return '#neplatny-odkaz';
  }
  return clean;
}

// Extrakce nadpisů pro obsah článku (Table of Contents)
export function extractHeadings(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const headings = [];
  let counter = 1;

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim().replace(/\*\*|\*|__/g, '');
      const id = slugify(title) || `sekce-${counter}`;
      headings.push({
        id,
        level,
        title,
        number: counter++
      });
    }
  }
  return headings;
}

// Vykreslení obsahu článku (Wikipedia TOC box)
export function renderTocHtml(headings) {
  if (!headings || headings.length < 2) return '';

  let html = `
  <div class="toc" id="toc" role="navigation" aria-labelledby="mw-toc-heading">
    <div class="toctitle" lang="cs" dir="ltr">
      <h2 id="mw-toc-heading">Obsah</h2>
      <button type="button" class="toc-toggle" id="toc-toggle-btn" aria-expanded="true">[skrýt]</button>
    </div>
    <ul id="toc-list">
  `;

  for (const h of headings) {
    const indentClass = h.level === 3 ? 'toc-sub' : (h.level === 4 ? 'toc-sub-sub' : '');
    html += `
      <li class="toclevel-${h.level - 1} ${indentClass}">
        <a href="#${escapeHtml(h.id)}">
          <span class="tocnumber">${h.number}</span>
          <span class="toctext">${escapeHtml(h.title)}</span>
        </a>
      </li>
    `;
  }

  html += `</ul></div>`;
  return html;
}

// Bezpečný render Wikipedie Markdownu s podporou interních wikilinků [[nazev-clanku|Zobrazený text]]
export function renderWikiMarkdown(markdown, knownSlugs = new Set()) {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  let result = [];
  let inList = false;
  let inOrderedList = false;
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Seznamy - odrážky
    if (/^\s*[-*]\s+(.+)/.test(line)) {
      if (!inList) {
        if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
        result.push('<ul>');
        inList = true;
      }
      const itemContent = line.replace(/^\s*[-*]\s+/, '');
      result.push(`<li>${parseInline(itemContent, knownSlugs)}</li>`);
      continue;
    } else if (inList) {
      result.push('</ul>');
      inList = false;
    }

    // Číslované seznamy
    if (/^\s*\d+\.\s+(.+)/.test(line)) {
      if (!inOrderedList) {
        if (inList) { result.push('</ul>'); inList = false; }
        result.push('<ol>');
        inOrderedList = true;
      }
      const itemContent = line.replace(/^\s*\d+\.\s+/, '');
      result.push(`<li>${parseInline(itemContent, knownSlugs)}</li>`);
      continue;
    } else if (inOrderedList) {
      result.push('</ol>');
      inOrderedList = false;
    }

    // Citace
    if (/^>\s*(.+)/.test(line)) {
      if (!inBlockquote) {
        result.push('<blockquote class="wiki-quote">');
        inBlockquote = true;
      }
      const quoteContent = line.replace(/^>\s*/, '');
      result.push(`<p>${parseInline(quoteContent, knownSlugs)}</p>`);
      continue;
    } else if (inBlockquote) {
      result.push('</blockquote>');
      inBlockquote = false;
    }

    // Nadpisy
    const h4 = line.match(/^####\s+(.+)$/);
    if (h4) {
      const headingText = h4[1].trim();
      const id = slugify(headingText);
      result.push(`<h4 id="${escapeHtml(id)}">${parseInline(headingText, knownSlugs)}</h4>`);
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      const headingText = h3[1].trim();
      const id = slugify(headingText);
      result.push(`<h3 id="${escapeHtml(id)}">${parseInline(headingText, knownSlugs)}</h3>`);
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const headingText = h2[1].trim();
      const id = slugify(headingText);
      result.push(`
        <h2 id="${escapeHtml(id)}" class="wiki-heading">
          <span class="mw-headline">${parseInline(headingText, knownSlugs)}</span>
          <a href="#${escapeHtml(id)}" class="heading-anchor" title="Trvalý odkaz na tuto sekci">§</a>
        </h2>
      `);
      continue;
    }

    // Prázdný řádek
    if (line.trim() === '') {
      continue;
    }

    // Běžný odstavec
    result.push(`<p>${parseInline(line, knownSlugs)}</p>`);
  }

  if (inList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');
  if (inBlockquote) result.push('</blockquote>');

  return result.join('\n');
}

// Pomocná funkce pro inline formátování (wikilinky, tučné písmo, kurzíva, externí odkazy)
export function parseInline(text, knownSlugs = new Set()) {
  let safe = escapeHtml(text);

  // 1. Interní wiki odkazy: [[slug-nebo-nazev]] nebo [[cilovy-slug|Zobrazený text]]
  safe = safe.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, label) => {
    const rawTarget = target.trim();
    const display = (label || rawTarget).trim();
    const targetSlug = slugify(rawTarget);

    const exists = knownSlugs.size === 0 || knownSlugs.has(targetSlug);
    if (exists) {
      return `<a href="article.html?slug=${encodeURIComponent(targetSlug)}" class="wiki-link" title="${escapeHtml(rawTarget)}">${escapeHtml(display)}</a>`;
    } else {
      return `<a href="edit.html?slug=${encodeURIComponent(targetSlug)}&title=${encodeURIComponent(rawTarget)}" class="wiki-link wiki-link-new" title="Článek „${escapeHtml(rawTarget)}“ dosud neexistuje. Klikněte pro jeho vytvoření.">${escapeHtml(display)}</a>`;
    }
  });

  // 2. Standardní markdown odkazy [text](url)
  safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    const safeUrl = sanitizeUrl(url);
    const isExternal = /^https?:\/\//i.test(safeUrl);
    return `<a href="${escapeHtml(safeUrl)}" ${isExternal ? 'target="_blank" rel="noopener noreferrer" class="external-link"' : 'class="wiki-link"'}>${linkText}</a>`;
  });

  // 3. Tučné písmo **text**
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 4. Kurzíva *text*
  safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 5. Kód `kod`
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');

  return safe;
}

// -------------------------------------------------------------
// Databázové / Úložné operace (Supabase s fallbackem na LocalStore)
// -------------------------------------------------------------

export async function getArticles() {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('articles')
      .select('*, profiles!created_by(display_name)')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Chyba při načítání článků:', error);
      return getLocalStore().getArticles();
    }
    return data;
  }

  return getLocalStore().getArticles().filter(a => a.status === 'published');
}

export async function getArticleBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = slugify(slug);

  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('articles')
      .select('*, profiles!created_by(display_name), article_categories(category_id, categories(name, slug))')
      .eq('slug', cleanSlug)
      .single();

    if (error) {
      console.warn('[Supabase] Článek nenalezen:', error.message);
      return getLocalStore().getArticles().find(a => a.slug === cleanSlug) || null;
    }
    if (data) {
      data.infobox = data.infobox_data || data.infobox || { type: data.article_type || 'Článek', data: [] };
    }
    return data;
  }

  const articles = getLocalStore().getArticles();
  return articles.find(a => a.slug === cleanSlug) || null;
}

export async function getCategories() {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (!error && data) return data;
  }
  return getLocalStore().getCategories();
}

export async function getRevisions(articleId) {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('article_revisions')
      .select('*, profiles!editor_id(display_name)')
      .eq('article_id', articleId)
      .order('revision_number', { ascending: false });
    if (!error && data) return data;
  }

  const revisions = getLocalStore().getRevisions();
  return revisions
    .filter(r => r.article_id === articleId)
    .sort((a, b) => b.revision_number - a.revision_number);
}

export async function getComments(articleId) {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles!author_id(display_name)')
      .eq('article_id', articleId)
      .eq('status', 'published')
      .order('created_at', { ascending: true });
    if (!error && data) return data;
  }

  const comments = getLocalStore().getComments();
  return comments.filter(c => c.article_id === articleId);
}

export async function addComment(articleId, body, authorName = 'Anonymní člen') {
  if (!body || !body.trim()) {
    throw new Error('Komentář nesmí být prázdný.');
  }

  if (!isDemoMode && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Pro přidání komentáře musíte být přihlášeni.');
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_id: articleId,
        author_id: user.id,
        body: body.trim(),
        status: 'published'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Demo režim
  const store = getLocalStore();
  const comments = store.getComments();
  const newComment = {
    id: 'com-' + Date.now(),
    article_id: articleId,
    author_name: authorName,
    body: body.trim(),
    created_at: new Date().toISOString()
  };
  comments.push(newComment);
  store.saveComments(comments);
  return newComment;
}

export async function saveArticle(articleData, editSummary = 'Úprava článku', editorName = 'Člen party') {
  const store = getLocalStore();
  const articles = store.getArticles();
  const revisions = store.getRevisions();

  const slug = slugify(articleData.slug || articleData.title);
  if (!slug) {
    throw new Error('Název článku nesmí být prázdný.');
  }

  if (!isDemoMode && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Pro uložení článku musíte být přihlášeni.');
    }

    const infoboxData = articleData.infobox || articleData.infobox_data || {
      type: articleData.article_type || 'Článek',
      image: '',
      image_caption: '',
      data: []
    };

    // Zavoláme bezpečnou RPC funkci nebo provedeme upsert
    const payload = {
      p_slug: slug,
      p_title: articleData.title,
      p_summary: articleData.summary || '',
      p_content: articleData.content || '',
      p_article_type: articleData.article_type || 'general',
      p_incident_date: articleData.incident_date || null,
      p_incident_location: articleData.incident_location || '',
      p_edit_summary: editSummary,
      p_infobox_data: infoboxData
    };

    let result = null;
    const { data, error } = await supabase.rpc('save_article_revision', payload);
    if (error) {
      // Pokud existující RPC funkce v Supabase ještě nemá parametr p_infobox_data, zkusíme bez něj
      delete payload.p_infobox_data;
      const { data: retryData, error: retryErr } = await supabase.rpc('save_article_revision', payload);
      if (retryErr) throw retryErr;
      result = retryData;
      // A infobox_data uložíme přímo do řádku článku
      if (result && result.id) {
        await supabase.from('articles').update({ infobox_data: infoboxData }).eq('id', result.id);
      }
    } else {
      result = data;
    }
    return result;
  }

  // Demo režim v localStorage
  const existingIndex = articles.findIndex(a => a.slug === slug || (articleData.id && a.id === articleData.id));
  const now = new Date().toISOString();
  let articleId = articleData.id;

  if (existingIndex >= 0) {
    const existing = articles[existingIndex];
    articleId = existing.id;
    articles[existingIndex] = {
      ...existing,
      title: articleData.title,
      summary: articleData.summary || '',
      content: articleData.content || '',
      article_type: articleData.article_type || 'general',
      incident_date: articleData.incident_date || null,
      incident_location: articleData.incident_location || '',
      infobox: articleData.infobox || existing.infobox,
      categories: articleData.categories || existing.categories || [],
      updated_at: now,
      updated_by: editorName
    };
  } else {
    articleId = 'art-' + Date.now();
    const newArticle = {
      id: articleId,
      slug: slug,
      title: articleData.title,
      summary: articleData.summary || '',
      content: articleData.content || '',
      article_type: articleData.article_type || 'general',
      incident_date: articleData.incident_date || null,
      incident_location: articleData.incident_location || '',
      status: 'published',
      created_at: now,
      updated_at: now,
      created_by: editorName,
      updated_by: editorName,
      views_count: 1,
      categories: articleData.categories || ['legendarni-incidenty'],
      infobox: articleData.infobox || {
        type: articleData.article_type || 'Článek',
        image: '',
        image_caption: '',
        data: []
      }
    };
    articles.push(newArticle);
  }

  // Vytvoření revize
  const articleRevisions = revisions.filter(r => r.article_id === articleId);
  const nextRevNum = (articleRevisions.length > 0 ? Math.max(...articleRevisions.map(r => r.revision_number)) : 0) + 1;

  const newRevision = {
    id: 'rev-' + Date.now(),
    article_id: articleId,
    revision_number: nextRevNum,
    title: articleData.title,
    summary: articleData.summary || '',
    content: articleData.content || '',
    editor_id: 'local-user',
    editor_name: editorName,
    edit_summary: editSummary,
    created_at: now
  };

  revisions.push(newRevision);

  store.saveArticles(articles);
  store.saveRevisions(revisions);

  return { id: articleId, slug: slug };
}

export async function restoreRevision(articleId, revisionId) {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase.rpc('restore_article_revision', {
      p_article_id: articleId,
      p_revision_id: revisionId
    });
    if (error) throw error;
    return data;
  }

  const store = getLocalStore();
  const revisions = store.getRevisions();
  const articles = store.getArticles();

  const targetRev = revisions.find(r => r.id === revisionId && r.article_id === articleId);
  if (!targetRev) {
    throw new Error('Revize nebyla nalezena.');
  }

  const articleIndex = articles.findIndex(a => a.id === articleId);
  if (articleIndex === -1) {
    throw new Error('Článek nebyl nalezen.');
  }

  articles[articleIndex].title = targetRev.title;
  articles[articleIndex].summary = targetRev.summary;
  articles[articleIndex].content = targetRev.content;
  articles[articleIndex].updated_at = new Date().toISOString();
  articles[articleIndex].updated_by = 'Obnoveno z revize #' + targetRev.revision_number;

  // Uložíme novou revizi dokumentující obnovu
  const nextRevNum = Math.max(...revisions.filter(r => r.article_id === articleId).map(r => r.revision_number)) + 1;
  revisions.push({
    id: 'rev-' + Date.now(),
    article_id: articleId,
    revision_number: nextRevNum,
    title: targetRev.title,
    summary: targetRev.summary,
    content: targetRev.content,
    editor_id: 'local-user',
    editor_name: 'Systém / Obnova',
    edit_summary: `Obnovena verze č. ${targetRev.revision_number} (${formatDateTime(targetRev.created_at)})`,
    created_at: new Date().toISOString()
  });

  store.saveArticles(articles);
  store.saveRevisions(revisions);
  return articles[articleIndex];
}
