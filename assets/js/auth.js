/**
 * Správa autentizace, rolí a relace (Supabase Auth + Demo režim).
 */
import { supabase, isDemoMode, getLocalStore } from './supabase-client.js';

export async function getCurrentUser() {
  if (!isDemoMode && supabase) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;

      // Načíst profil s rolí
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      return {
        id: session.user.id,
        email: session.user.email,
        displayName: profile?.display_name || session.user.email.split('@')[0],
        role: profile?.role || 'member',
        avatarUrl: profile?.avatar_path || null
      };
    } catch (e) {
      console.warn('[Auth] Chyba relace:', e);
      return null;
    }
  }

  // Demo režim v localStorage
  return getLocalStore().getUser();
}

export async function loginWithEmailPassword(email, password) {
  if (!email || !password) {
    throw new Error('Vyplňte prosím e-mail i heslo.');
  }

  if (!isDemoMode && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Nesprávný e-mail nebo heslo.');
      }
      throw new Error(error.message);
    }
    return data.user;
  }

  // Demo přihlášení
  const store = getLocalStore();
  const demoRole = email.toLowerCase().includes('admin') ? 'admin' : 'member';
  const name = email.split('@')[0] || 'Demo Uživatel';

  const user = {
    id: 'user-' + Date.now(),
    email,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    role: demoRole,
    avatarUrl: null
  };
  store.saveUser(user);
  return user;
}

export async function loginWithMagicLink(email) {
  if (!email || !email.includes('@')) {
    throw new Error('Zadejte prosím platnou e-mailovou adresu.');
  }

  if (!isDemoMode && supabase) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/login.html'
      }
    });
    if (error) throw new Error(error.message);
    return true;
  }

  // V demo režimu rovnou přihlásíme
  return await loginWithEmailPassword(email, 'demo-pass');
}

export async function logoutUser() {
  if (!isDemoMode && supabase) {
    await supabase.auth.signOut();
  }
  const store = getLocalStore();
  store.saveUser(null);
  window.location.reload();
}

/**
 * Rychlé přihlášení pro testování v demo režimu
 */
export function setDemoUserRole(role = 'member', name = 'Kuba') {
  const store = getLocalStore();
  const user = {
    id: 'demo-' + role,
    email: `${role}@encyklopedie.local`,
    displayName: name,
    role: role,
    avatarUrl: null
  };
  store.saveUser(user);
  return user;
}
