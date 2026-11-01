import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { saveArticle, getArticleBySlug, slugify } from '../assets/js/articles.js';

describe('Články a infobox operace', () => {
  it('saveArticle vytvoří článek s kompletním infoboxem a revizí v lokálním úložišti', async () => {
    // Simulace minimálního localStorage pro Node prostředí
    const memory = new Map();
    globalThis.localStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };

    const payload = {
      title: 'Testovací incident 2026',
      slug: 'testovaci-incident-2026',
      summary: 'Shrnutí testu',
      content: '## Průběh\nNějaký obsah.',
      article_type: 'incident',
      infobox: {
        type: 'Incident',
        data: [
          { label: 'Datum', value: '1. listopadu 2026' },
          { label: 'Místo', value: 'Zkušebna' }
        ]
      }
    };

    const saved = await saveArticle(payload, 'Testovací revize', 'Tester');
    assert.ok(saved);
    assert.equal(saved.slug, 'testovaci-incident-2026');

    const fetched = await getArticleBySlug('testovaci-incident-2026');
    assert.ok(fetched);
    assert.equal(fetched.title, 'Testovací incident 2026');
    assert.equal(fetched.infobox.type, 'Incident');
    assert.equal(fetched.infobox.data.length, 2);
    assert.equal(fetched.infobox.data[0].label, 'Datum');
  });
});
