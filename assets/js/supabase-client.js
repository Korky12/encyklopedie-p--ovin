/**
 * Supabase klient s automatickým přechodem na Demo / LocalStorage režim,
 * pokud uživatel ještě nevyplnil své Supabase přístupové údaje v config.js.
 */
import { INITIAL_ARTICLES, INITIAL_CATEGORIES, INITIAL_REVISIONS, INITIAL_COMMENTS } from './demo-data.js';

let config = {
  url: '',
  anonKey: '',
  fallbackToDemoData: true
};

try {
  const customConfig = await import('./config.js');
  if (customConfig && customConfig.SUPABASE_CONFIG) {
    config = { ...config, ...customConfig.SUPABASE_CONFIG };
  }
} catch {
  // config.js neexistuje, použijeme výchozí nastavení a demo data
}

export const isConfigured = Boolean(config.url && config.anonKey && config.url.startsWith('https://'));
export const isDemoMode = !isConfigured;

let supabaseInstance = null;

if (isConfigured) {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.48.1/+esm');
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn('[Encyklopedie] Chyba při načítání Supabase SDK přes CDN. Přepínám do lokálního režimu.', err);
  }
}

export const supabase = supabaseInstance;

// Inicializace lokálního úložiště pro demo režim
const STORAGE_KEYS = {
  ARTICLES: 'encyklopedie_articles_v1',
  CATEGORIES: 'encyklopedie_categories_v1',
  REVISIONS: 'encyklopedie_revisions_v1',
  COMMENTS: 'encyklopedie_comments_v1',
  USER: 'encyklopedie_user_session_v1'
};

export function getLocalStore() {
  if (!localStorage.getItem(STORAGE_KEYS.ARTICLES)) {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(INITIAL_ARTICLES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVISIONS)) {
    localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(INITIAL_REVISIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
  }

  return {
    getArticles: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTICLES) || '[]'),
    saveArticles: (items) => localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(items)),
    getCategories: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]'),
    saveCategories: (items) => localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(items)),
    getRevisions: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.REVISIONS) || '[]'),
    saveRevisions: (items) => localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(items)),
    getComments: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS) || '[]'),
    saveComments: (items) => localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(items)),
    getUser: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'),
    saveUser: (user) => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  };
}
