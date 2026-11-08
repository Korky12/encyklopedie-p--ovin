import test from 'node:test';
import assert from 'node:assert';
import { parseMarkdownFile, serializeMarkdownFile, writeMarkdownArticle } from '../server.js';

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

test('Node.js Server API – GitHub synchronizace článků', async (t) => {
  const originalFetch = globalThis.fetch;

  t.afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  await t.test('selže s jasnou chybou, pokud chybí GitHub konfigurace (žádný tichý fallback)', async () => {
    const customConfig = {
      githubToken: '',
      githubOwner: '',
      githubRepo: '',
      articlesDir: 'content/articles'
    };

    await assert.rejects(
      async () => {
        await writeMarkdownArticle('test-slug', { title: 'Test' }, 'Obsah', 'Commit', { display_name: 'Tester' }, customConfig);
      },
      /GitHub synchronizace není nakonfigurována/
    );
  });

  await t.test('úspěšně vytvoří nový článek na GitHubu s branch master', async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      // 1. Zjištění existence (404 Not Found)
      if (options.method === undefined || options.method === 'GET') {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found'
        };
      }
      // 2. PUT commit
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body);
        assert.strictEqual(body.branch, 'master');
        assert.ok(body.content);
        assert.strictEqual(body.sha, undefined);
        return {
          ok: true,
          status: 201,
          json: async () => ({ content: { sha: 'commit-sha-123' } })
        };
      }
      throw new Error('Unexpected call: ' + url);
    };

    const customConfig = {
      githubToken: 'fake-token',
      githubOwner: 'Korky12',
      githubRepo: 'encyklopedie-p--ovin',
      githubBranch: 'master',
      articlesDir: 'content/articles'
    };

    const res = await writeMarkdownArticle(
      'novy-clanek',
      { title: 'Nový článek' },
      '## Obsah',
      'Přidán článek',
      { display_name: 'Tester', email: 'tester@test.local' },
      customConfig
    );

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.sha, 'commit-sha-123');
    assert.strictEqual(calls.length, 2);
    assert.match(calls[0].url, /ref=master/);
  });

  await t.test('úspěšně aktualizuje existující článek na GitHubu s existujícím SHA', async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      // 1. Zjištění existence (200 OK s existujícím sha)
      if (options.method === undefined || options.method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ sha: 'existing-blob-sha-456' })
        };
      }
      // 2. PUT commit
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body);
        assert.strictEqual(body.branch, 'master');
        assert.strictEqual(body.sha, 'existing-blob-sha-456');
        return {
          ok: true,
          status: 200,
          json: async () => ({ commit: { sha: 'updated-commit-sha-789' } })
        };
      }
      throw new Error('Unexpected call: ' + url);
    };

    const customConfig = {
      githubToken: 'fake-token',
      githubOwner: 'Korky12',
      githubRepo: 'encyklopedie-p--ovin',
      githubBranch: 'master',
      articlesDir: 'content/articles'
    };

    const res = await writeMarkdownArticle(
      'existujici-clanek',
      { title: 'Existující článek' },
      '## Upravený obsah',
      'Úprava článku',
      { display_name: 'Editor' },
      customConfig
    );

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.sha, 'updated-commit-sha-789');
  });

  await t.test('vyhodí srozumitelnou chybu konfliktu při statusu 409', async () => {
    globalThis.fetch = async (url, options) => {
      if (options.method === undefined || options.method === 'GET') {
        return { ok: true, status: 200, json: async () => ({ sha: 'old-sha' }) };
      }
      if (options.method === 'PUT') {
        return {
          ok: false,
          status: 409,
          text: async () => '{"message": "is at a different commit"}'
        };
      }
    };

    const customConfig = {
      githubToken: 'fake-token',
      githubOwner: 'Korky12',
      githubRepo: 'encyklopedie-p--ovin',
      githubBranch: 'master',
      articlesDir: 'content/articles'
    };

    await assert.rejects(
      async () => {
        await writeMarkdownArticle(
          'konflikt-clanek',
          { title: 'Konflikt' },
          'Obsah',
          'Úprava',
          { display_name: 'Editor' },
          customConfig
        );
      },
      /Konflikt při zápisu na GitHub \(409\)/
    );
  });
});
