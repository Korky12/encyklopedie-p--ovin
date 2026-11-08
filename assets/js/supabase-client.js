/**
 * Supabase klient s automatickým přechodem na Demo / LocalStorage režim.
 * Konfigurace se načítá buď z lokálního config.js, nebo dynamicky ze serveru (/api/config),
 * což zajišťuje bezproblémový běh na hostingu (Render).
 */
import { INITIAL_ARTICLES, INITIAL_CATEGORIES, INITIAL_REVISIONS, INITIAL_COMMENTS } from './demo-data.js';

let config = {
  url: '',
  anonKey: '',
  fallbackToDemoData: true
};

// 1. Zkusíme načíst lokální config.js (pro lokální vývoj)
try {
  const customConfig = await import('./config.js');
  if (customConfig && customConfig.SUPABASE_CONFIG) {
    config = { ...config, ...customConfig.SUPABASE_CONFIG };
  }
} catch {
  // config.js neexistuje, zkusíme serverový endpoint
}

// 2. Pokud nemáme konfiguraci z config.js, zkusíme ji načíst ze serveru (/api/config)
if ((!config.url || !config.anonKey) && typeof fetch !== 'undefined' && typeof window !== 'undefined') {
  try {
    const srvRes = await fetch('/api/config');
    if (srvRes.ok) {
      const srvData = await srvRes.json();
      if (srvData && srvData.supabaseUrl && srvData.supabaseAnonKey) {
        config.url = srvData.supabaseUrl;
        config.anonKey = srvData.supabaseAnonKey;
      }
    }
  } catch {
    // server /api/config nedostupný
  }
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
