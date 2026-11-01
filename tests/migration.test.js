import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Supabase SQL Migrace a RLS validace', () => {
  const migrationPath = path.join(__dirname, '../supabase/migrations/20261101000000_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  it('migrační soubor existuje a není prázdný', () => {
    assert.ok(sql.length > 500);
  });

  it('obsahuje aktivaci Row Level Security (RLS) pro všechny klíčové tabulky', () => {
    const requiredTables = [
      'profiles',
      'articles',
      'article_revisions',
      'categories',
      'article_categories',
      'comments',
      'media'
    ];

    for (const table of requiredTables) {
      const rlsStatement = `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
      assert.ok(
        sql.includes(rlsStatement),
        `Chybí zapnutí RLS pro tabulku ${table}`
      );
    }
  });

  it('obsahuje atomické funkce pro revize a obnovu', () => {
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.save_article_revision'));
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.restore_article_revision'));
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.is_admin()'));
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.is_member()'));
  });

  it('neobsahuje žádná citlivá tajemství ani service_role klíče', () => {
    assert.ok(!sql.includes('service_role'));
    assert.ok(!sql.includes('eyJhbGci'));
    assert.ok(!sql.includes('sbp_'));
  });
});
