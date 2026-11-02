import test from 'node:test';
import assert from 'node:assert';
import { parseMarkdownFile, serializeMarkdownFile } from '../server.js';

test('Node.js Server API – Markdown serializer and parser', async (t) => {
  await t.test('správně serializuje a deserializuje článek s Front Matter', () => {
    const metadata = {
      title: 'Incident s balkonem',
      article_type: 'incident',
      categories: ['incidenty', 'alkohol']
    };
    const content = '# Nadpis\n\nText článku plný bizáru.';

    const serialized = serializeMarkdownFile(metadata, content);
    assert.match(serialized, /^---\n/);
    assert.match(serialized, /title: Incident s balkonem/);
    assert.match(serialized, /categories: \["incidenty","alkohol"\]/);
    assert.match(serialized, /Text článku plný bizáru\./);

    const parsed = parseMarkdownFile(serialized);
    assert.strictEqual(parsed.metadata.title, 'Incident s balkonem');
    assert.strictEqual(parsed.metadata.article_type, 'incident');
    assert.deepStrictEqual(parsed.metadata.categories, ['incidenty', 'alkohol']);
    assert.strictEqual(parsed.content.trim(), content.trim());
  });

  await t.test('bezpečně parsuje soubor bez Front Matter', () => {
    const plain = '# Pouze markdown obsah';
    const parsed = parseMarkdownFile(plain);
    assert.deepStrictEqual(parsed.metadata, {});
    assert.strictEqual(parsed.content, plain);
  });
});
