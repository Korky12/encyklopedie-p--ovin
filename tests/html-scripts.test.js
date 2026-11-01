import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('HTML a JavaScript syntax validace', () => {
  const htmlFiles = [
    'index.html',
    'article.html',
    'edit.html',
    'history.html',
    'category.html',
    'timeline.html',
    'search.html',
    'login.html',
    'profile.html',
    'admin.html'
  ];

  for (const file of htmlFiles) {
    it(`soubor ${file} obsahuje skripty bez syntaktických chyb`, async () => {
      const filePath = path.join(__dirname, '..', file);
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.matchAll(/<script(?:\s+type="module")?>([\s\S]*?)<\/script>/gi);

      for (const match of matches) {
        let scriptCode = match[1].trim();
        if (!scriptCode) continue;

        // Nahradíme importy za komentář pro čisté ověření syntaxe zbytku těla
        const codeForSyntaxCheck = scriptCode
          .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import')
          .replace(/await\s+/g, '');

        assert.doesNotThrow(() => {
          new Function(codeForSyntaxCheck);
        }, `Syntaktická chyba ve skriptu souboru ${file}`);
      }
    });
  }
});
