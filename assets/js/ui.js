/**
 * Společné UI prvky pro všechny stránky:
 * - Navigace a mobilní postranní panel
 * - Inicializace vyhledávání a klávesových zkratek
 * - Uživatelské menu v záhlaví
 * - Náhodný článek
 * - Upozornění na Demo režim s možností přepnutí role
 */
import { getCurrentUser, logoutUser, setDemoUserRole } from './auth.js';
import { isDemoMode } from './supabase-client.js';
import { getArticles } from './articles.js';
import { initSearchBox } from './search.js';

export async function initCommonUI() {
  renderHeaderUserMenu();
  initSidebarToggle();
  initSearchInputs();
  initRandomArticleLinks();
  renderDemoBannerIfNeeded();
  initTocInteractivity();
}

// Záhlaví: stav přihlášení a uživatelské menu
async function renderHeaderUserMenu() {
  const container = document.getElementById('user-tools-container');
  if (!container) return;

  const user = await getCurrentUser();

  if (user) {
    container.innerHTML = `
      <ul class="user-links-list">
        <li><span class="user-badge role-${user.role}">${user.role === 'admin' ? 'Administrátor' : 'Člen'}</span></li>
        <li><a href="profile.html" class="user-name-link" title="Zobrazit váš profil">${escapeHtml(user.displayName)}</a></li>
        ${user.role === 'admin' ? '<li><a href="admin.html">Správa</a></li>' : ''}
        <li><button type="button" class="btn-link" id="btn-logout">Odhlásit se</button></li>
      </ul>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await logoutUser();
    });
  } else {
    container.innerHTML = `
      <ul class="user-links-list">
        <li><span class="anon-notice">Nepřihlášen(a)</span></li>
        <li><a href="login.html" class="login-link">Přihlásit se</a></li>
      </ul>
    `;
  }
}

// Mobilní hamburger menu
function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('mw-panel');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    const isOpen = sidebar.classList.contains('open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Zavření kliknutím mimo
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
      sidebar.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// Vyhledávání v hlavičce
function initSearchInputs() {
  const searchInput = document.getElementById('searchInput');
  const searchDropdown = document.getElementById('searchSuggestions');
  if (searchInput && searchDropdown) {
    initSearchBox(searchInput, searchDropdown);
  }

  const searchForm = document.getElementById('searchform');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q) {
        window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      }
    });
  }
}

// Náhodný článek
function initRandomArticleLinks() {
  const links = document.querySelectorAll('.nav-random-article');
  links.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const articles = await getArticles();
      if (!articles || articles.length === 0) {
        alert('Žádné články zatím nejsou k dispozici.');
        return;
      }
      const random = articles[Math.floor(Math.random() * articles.length)];
      window.location.href = `article.html?slug=${encodeURIComponent(random.slug)}`;
    });
  });
}

// Informační proužek Demo režimu (pokud není Supabase nakonfigurována)
function renderDemoBannerIfNeeded() {
  if (!isDemoMode) return;

  const banner = document.createElement('div');
  banner.className = 'demo-mode-bar';
  banner.id = 'demo-mode-bar';
  banner.innerHTML = `
    <div class="demo-mode-content">
      <span><strong>Režim náhledu:</strong> Aplikace běží s ukázkovými daty. Pro připojení živé Supabase databáze doplňte <code>assets/js/config.js</code>.</span>
      <div class="demo-role-switcher">
        <label for="demo-role-select">Testovat jako:</label>
        <select id="demo-role-select">
          <option value="anon">Anonymní čtenář</option>
          <option value="member">Přihlášený člen (Kuba)</option>
          <option value="admin">Administrátor (Admin)</option>
        </select>
      </div>
    </div>
  `;

  document.body.prepend(banner);

  const select = document.getElementById('demo-role-select');
  getCurrentUser().then(user => {
    if (!user) select.value = 'anon';
    else if (user.role === 'admin') select.value = 'admin';
    else select.value = 'member';
  });

  select.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (val === 'anon') {
      await logoutUser();
    } else if (val === 'admin') {
      setDemoUserRole('admin', 'Vóma (Admin)');
      window.location.reload();
    } else {
      setDemoUserRole('member', 'Kuba');
      window.location.reload();
    }
  });
}

// Skládání/rozbalování obsahu článku [skrýt] / [zobrazit]
function initTocInteractivity() {
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'toc-toggle-btn') {
      const btn = e.target;
      const list = document.getElementById('toc-list');
      if (!list) return;

      const isHidden = list.style.display === 'none';
      if (isHidden) {
        list.style.display = 'block';
        btn.textContent = '[skrýt]';
        btn.setAttribute('aria-expanded', 'true');
      } else {
        list.style.display = 'none';
        btn.textContent = '[zobrazit]';
        btn.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}
