/**
 * Vzorová konfigurace pro Encyklopedii píčovin.
 *
 * PRO LOKÁLNÍ POUŽITÍ:
 * 1. Zkopírujte tento soubor jako `config.js` do stejné složky (`assets/js/config.js`).
 * 2. Vyplňte vaše Supabase URL a veřejný publishable anon klíč z administrace projektu:
 *    Project Settings -> API -> Project URL & Project API Keys (anon / public).
 *
 * POZOR: Nikdy sem nevkládejte service_role klíč! Soubor config.js je v .gitignore.
 */
export const SUPABASE_CONFIG = {
  // Např. 'https://abcdefghijklm.supabase.co'
  url: '',
  // Veřejný anonymní klíč (anon public)
  anonKey: '',
  // Pokud je prázdné nebo nedostupné, aplikace běží v demo režimu se vzorovými daty
  fallbackToDemoData: true
};
