import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, formatDate, escapeHtml, sanitizeUrl, extractHeadings, renderWikiMarkdown, renderTocHtml } from '../assets/js/articles.js';
import { normalizeSearchTerm } from '../assets/js/search.js';

describe('Encyklopedie píčovin – Utility and Markdown tests', () => {

  it('slugify správně převádí české znaky s diakritikou na čisté URL', () => {
    assert.equal(slugify('Příliš žluťoučký kůň'), 'prilis-zlutoucky-kun');
    assert.equal(slugify('Incident s balkonovým grilem (2023)'), 'incident-s-balkonovym-grilem-2023');
    assert.equal(slugify('   ČESKÝ TEXT --- a mezery   '), 'cesky-text-a-mezery');
    assert.equal(slugify('Hláška: „To dáš v klidu, bráško!“'), 'hlaska-to-das-v-klidu-brasko');
  });

  it('escapeHtml chrání před vložením škodlivého HTML / XSS', () => {
    const raw = '<script>alert("hacked")</script>';
    const escaped = escapeHtml(raw);
    assert.equal(escaped, '&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;');
  });

  it('sanitizeUrl blokuje nebezpečné protokoly (javascript:, data:)', () => {
    assert.equal(sanitizeUrl('javascript:alert(1)'), '#neplatny-odkaz');
    assert.equal(sanitizeUrl('DATA:text/html;base64,...'), '#neplatny-odkaz');
    assert.equal(sanitizeUrl('https://example.com'), 'https://example.com');
    assert.equal(sanitizeUrl('article.html?slug=test'), 'article.html?slug=test');
  });

  it('extractHeadings správně parsuje nadpisy z Markdownu', () => {
    const md = `
## První sekce
Text odstavce.
### Podsekce 1.1
Další text.
## Druhá sekce
Poslední odstavec.
    `;
    const headings = extractHeadings(md);
    assert.equal(headings.length, 3);
    assert.equal(headings[0].title, 'První sekce');
    assert.equal(headings[0].level, 2);
    assert.equal(headings[1].title, 'Podsekce 1.1');
    assert.equal(headings[1].level, 3);
    assert.equal(headings[2].title, 'Druhá sekce');
  });

  it('renderTocHtml vytvoří strukturu obsahu Wikipedie', () => {
    const headings = [
      { id: 'prvni-sekce', title: 'První sekce', level: 2, number: 1 },
      { id: 'druha-sekce', title: 'Druhá sekce', level: 2, number: 2 }
    ];
    const html = renderTocHtml(headings);
    assert.ok(html.includes('id="toc"'));
    assert.ok(html.includes('První sekce'));
    assert.ok(html.includes('#prvni-sekce'));
    assert.ok(html.includes('id="toc-toggle-btn"'));
  });

  it('renderWikiMarkdown renderuje interní wiki odkazy i s detekcí chybějících článků', () => {
    const knownSlugs = new Set(['existujici-clanek']);
    const md = 'Toto je [[existujici-clanek|Existující článek]] a toto je [[neexistujici-clanek|Neznámý článek]].';
    const html = renderWikiMarkdown(md, knownSlugs);

    // Existující článek má třídu wiki-link a směřuje na článek
    assert.ok(html.includes('href="article.html?slug=existujici-clanek"'));
    assert.ok(html.includes('class="wiki-link"'));

    // Neexistující článek má červenou třídu wiki-link-new a směřuje na edit.html pro vytvoření
    assert.ok(html.includes('class="wiki-link wiki-link-new"'));
    assert.ok(html.includes('href="edit.html?slug=neexistujici-clanek'));
  });

  it('normalizeSearchTerm umožňuje vyhledávat bez ohledu na diakritiku a velikost písmen', () => {
    assert.equal(normalizeSearchTerm('Vóma'), 'voma');
    assert.equal(normalizeSearchTerm('BALKÓNOVÝM'), 'balkonovym');
    assert.equal(normalizeSearchTerm('pivo'), normalizeSearchTerm('PIVO'));
    assert.equal(normalizeSearchTerm('řeřicha'), 'rericha');
  });

  it('formatDate vrací české datum', () => {
    const formatted = formatDate('2023-07-15T21:30:00Z');
    assert.ok(formatted.includes('července') || formatted.includes('7.'));
    assert.ok(formatted.includes('2023'));
  });

});
