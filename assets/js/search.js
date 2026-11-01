/**
 * Modul vyhledávání s podporou diakritiky i vyhledávání bez ní,
 * našeptávačem a ovládáním z klávesnice.
 */
import { getArticles } from './articles.js';

// Normalizace textu pro porovnání bez diakritiky a mezer
export function normalizeSearchTerm(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Vyhledá v článcích podle titulku, shrnutí i celého obsahu.
 * Výsledky jsou řazeny podle relevance:
 * 1. Shoda v titulku (nejvyšší priorita)
 * 2. Shoda ve shrnutí
 * 3. Shoda v těle článku
 */
export async function searchArticles(query) {
  const term = normalizeSearchTerm(query);
  if (!term || term.length < 2) return [];

  const articles = await getArticles();
  const results = [];

  for (const article of articles) {
    const titleNorm = normalizeSearchTerm(article.title);
    const summaryNorm = normalizeSearchTerm(article.summary || '');
    const contentNorm = normalizeSearchTerm(article.content || '');

    let score = 0;
    let matchType = '';

    if (titleNorm === term) {
      score += 100;
      matchType = 'přesný název';
    } else if (titleNorm.startsWith(term)) {
      score += 50;
      matchType = 'název začíná dotazem';
    } else if (titleNorm.includes(term)) {
      score += 30;
      matchType = 'shoda v názvu';
    }

    if (summaryNorm.includes(term)) {
      score += 15;
      if (!matchType) matchType = 've shrnutí';
    }

    if (contentNorm.includes(term)) {
      score += 5;
      if (!matchType) matchType = 'v textu';
    }

    if (score > 0) {
      // Vytvoříme úryvek (snippet) s kontextem
      let snippet = article.summary || '';
      if (!snippet && article.content) {
        const rawContent = article.content.replace(/[#*`_\[\]()]/g, ' ');
        const index = normalizeSearchTerm(rawContent).indexOf(term);
        if (index >= 0) {
          const start = Math.max(0, index - 40);
          const end = Math.min(rawContent.length, index + 100);
          snippet = (start > 0 ? '...' : '') + rawContent.slice(start, end).trim() + '...';
        } else {
          snippet = rawContent.slice(0, 120) + '...';
        }
      }

      results.push({
        article,
        score,
        matchType,
        snippet
      });
    }
  }

  // Seřadit sestupně podle skóre
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Inicializace interaktivního našeptávače pro vyhledávací pole
 */
export function initSearchBox(inputElement, dropdownElement) {
  if (!inputElement || !dropdownElement) return;

  let activeIndex = -1;
  let currentResults = [];
  let debounceTimeout = null;

  function closeDropdown() {
    dropdownElement.innerHTML = '';
    dropdownElement.classList.add('hidden');
    activeIndex = -1;
    currentResults = [];
  }

  inputElement.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value;

    if (query.trim().length < 2) {
      closeDropdown();
      return;
    }

    debounceTimeout = setTimeout(async () => {
      currentResults = await searchArticles(query);
      activeIndex = -1;

      if (currentResults.length === 0) {
        dropdownElement.innerHTML = `
          <div class="search-suggestion-item no-result">
            <em>Žádný článek nenalezen.</em>
            <a href="edit.html?title=${encodeURIComponent(query)}" class="search-create-link">
              Vytvořit článek „${escapeText(query)}“
            </a>
          </div>
        `;
        dropdownElement.classList.remove('hidden');
        return;
      }

      const topResults = currentResults.slice(0, 6);
      dropdownElement.innerHTML = topResults.map((res, i) => `
        <a href="article.html?slug=${encodeURIComponent(res.article.slug)}" class="search-suggestion-item" data-index="${i}">
          <div class="suggestion-title">${escapeText(res.article.title)}</div>
          <div class="suggestion-meta">${escapeText(res.snippet || res.article.summary || '')}</div>
        </a>
      `).join('') + `
        <a href="search.html?q=${encodeURIComponent(query)}" class="search-suggestion-all">
          Zobrazit všechny výsledky pro „${escapeText(query)}“ →
        </a>
      `;

      dropdownElement.classList.remove('hidden');
    }, 150);
  });

  inputElement.addEventListener('keydown', (e) => {
    const items = dropdownElement.querySelectorAll('.search-suggestion-item:not(.no-result)');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActive(items);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        items[activeIndex].click();
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  function updateActive(items) {
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Zavřít při kliku mimo vyhledávač
  document.addEventListener('click', (e) => {
    if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
      closeDropdown();
    }
  });
}

function escapeText(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}
