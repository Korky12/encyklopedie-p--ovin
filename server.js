import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Konfigurace pro GitHub & Supabase z proměnných prostředí
export const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  githubOwner: process.env.GITHUB_OWNER || '',
  githubRepo: process.env.GITHUB_REPO || '',
  githubBranch: process.env.GITHUB_BRANCH || 'master',
  articlesDir: process.env.GITHUB_CONTENT_DIR || 'content/articles',
  mediaDir: process.env.GITHUB_MEDIA_DIR || 'content/media',
  localFallbackDir: path.join(__dirname, 'content')
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS
  });
  res.end(JSON.stringify(data));
}

function err(res, message, status = 400) {
  json(res, { error: message }, status);
}

// -------------------------------------------------------------
// Pomocné funkce: Parsování Front Matter v Markdownu
// -------------------------------------------------------------
export function parseMarkdownFile(fileContent) {
  const frontMatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = fileContent.match(frontMatterRegex);
  if (!match) {
    return { metadata: {}, content: fileContent };
  }

  const rawMeta = match[1];
  const content = match[2];
  const metadata = {};

  const lines = rawMeta.split(/\r?\n/);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    } else if (val.startsWith('[') && val.endsWith(']')) {
      try {
        val = JSON.parse(val);
      } catch {
        val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      }
    } else if (val.startsWith('{') && val.endsWith('}')) {
      try {
        val = JSON.parse(val);
      } catch {
        // ponecháme string
      }
    }
    metadata[key] = val;
  }

  return { metadata, content };
}

export function serializeMarkdownFile(metadata, content) {
  const metaLines = ['---'];
  for (const [key, val] of Object.entries(metadata)) {
    if (val === null || val === undefined) continue;
    if (typeof val === 'object') {
      metaLines.push(`${key}: ${JSON.stringify(val)}`);
    } else if (typeof val === 'string' && (val.includes(':') || val.includes('\n') || val.includes('"'))) {
      metaLines.push(`${key}: ${JSON.stringify(val)}`);
    } else {
      metaLines.push(`${key}: ${val}`);
    }
  }
  metaLines.push('---');
  metaLines.push('');
  metaLines.push(content || '');
  return metaLines.join('\n');
}

// -------------------------------------------------------------
// Autentizace a ověření role přes Supabase Auth API
// -------------------------------------------------------------
async function verifyUser(req) {
  const authHeader = req.headers['authorization'] || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token) return null;

  if (!CONFIG.supabaseUrl) {
    // V lokálním vývoji bez Supabase vracíme mock uživatele
    return { id: 'local-dev-user', email: 'dev@party.local', role: 'admin', display_name: 'Dev Člen' };
  }

  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: CONFIG.supabaseAnonKey
      }
    });
    if (!res.ok) return null;
    const user = await res.json();
    if (!user || !user.id) return null;

    let role = 'member';
    let displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Člen party';

    // Dotaz na roli do tabulky profiles v Supabase
    try {
      const pRes = await fetch(`${CONFIG.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,display_name`, {
        headers: {
          apikey: CONFIG.supabaseAnonKey,
          Authorization: `Bearer ${token}`
        }
      });
      if (pRes.ok) {
        const rows = await pRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          if (rows[0].role) role = rows[0].role;
          if (rows[0].display_name) displayName = rows[0].display_name;
        }
      }
    } catch (e) {
      // Ignorovat, použít výchozí hodnoty
    }

    return { id: user.id, email: user.email, role, display_name: displayName };
  } catch (err) {
    console.error('[Auth] Chyba při ověřování uživatele:', err);
    return null;
  }
}

// -------------------------------------------------------------
// GitHub API / Local storage adaptér pro Markdown články
// -------------------------------------------------------------
async function readMarkdownArticle(slug) {
  const cfg = customConfig || CONFIG;
  const filePath = `${cfg.articlesDir}/${slug}.md`;

  if (CONFIG.githubToken && CONFIG.githubOwner && CONFIG.githubRepo) {
    const url = `https://api.github.com/repos/${CONFIG.githubOwner}/${CONFIG.githubRepo}/contents/${filePath}?ref=${CONFIG.githubBranch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CONFIG.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Encyklopedie-Picovin'
      }
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const rawContent = Buffer.from(data.content, 'base64').toString('utf-8');
    const parsed = parseMarkdownFile(rawContent);
    return {
      slug,
      sha: data.sha,
      ...parsed.metadata,
      content: parsed.content
    };
  }

  // Lokální fallback (souborový systém na disku)
  const localFile = path.join(CONFIG.localFallbackDir, 'articles', `${slug}.md`);
  if (!fs.existsSync(localFile)) return null;
  const rawContent = fs.readFileSync(localFile, 'utf-8');
  const parsed = parseMarkdownFile(rawContent);
  return {
    slug,
    sha: 'local-sha',
    ...parsed.metadata,
    content: parsed.content
  };
}

export async function writeMarkdownArticle(slug, metadata, content, commitMessage, authorInfo, customConfig = CONFIG) {
  const cfg = customConfig || CONFIG;
  const filePath = `${cfg.articlesDir}/${slug}.md`;
  const fileContent = serializeMarkdownFile(metadata, content);

  if (cfg.githubToken && cfg.githubOwner && cfg.githubRepo) {
    // 1. Zjistit stávající SHA pro případnou aktualizaci
    let existingSha = null;
    try {
      const checkRes = await fetch(`https://api.github.com/repos/${cfg.githubOwner}/${cfg.githubRepo}/contents/${filePath}?ref=${cfg.githubBranch}`, {
        headers: {
          Authorization: `Bearer ${cfg.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Encyklopedie-Picovin'
        }
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        existingSha = checkData.sha;
      }
    } catch {
      // soubor neexistuje
    }

    // 2. Commit a zápis do GitHubu
    const bodyPayload = {
      message: commitMessage || `Aktualizace článku ${slug}`,
      content: Buffer.from(fileContent, 'utf-8').toString('base64'),
      branch: cfg.githubBranch,
      committer: {
        name: authorInfo?.display_name || 'Encyklopedie Člen',
        email: authorInfo?.email || 'clen@encyklopedie.local'
      }
    };
    if (existingSha) {
      bodyPayload.sha = existingSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${cfg.githubOwner}/${cfg.githubRepo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${cfg.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Encyklopedie-Picovin'
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      const status = putRes.status;
      const error = new Error(status === 409 ? 'Konflikt při zápisu na GitHub (409): soubor byl mezitím upraven.' : `Chyba při ukládání na GitHub (${status}): ${errText}`);
      error.statusCode = status;
      throw error;
    }

    const resultData = await putRes.json();
    return {
      success: true,
      slug,
      sha: resultData.content?.sha || resultData.commit?.sha
    };
  }

  throw new Error('GitHub synchronizace není nakonfigurována (chybí GITHUB_TOKEN, GITHUB_OWNER nebo GITHUB_REPO).');
}

async function getArticleHistory(slug) {
  const filePath = `${CONFIG.articlesDir}/${slug}.md`;

  if (CONFIG.githubToken && CONFIG.githubOwner && CONFIG.githubRepo) {
    const url = `https://api.github.com/repos/${CONFIG.githubOwner}/${CONFIG.githubRepo}/commits?path=${encodeURIComponent(filePath)}&sha=${CONFIG.githubBranch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CONFIG.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Encyklopedie-Picovin'
      }
    });

    if (res.status === 404) return [];
    if (!res.ok) return [];

    const commits = await res.json();
    if (!Array.isArray(commits)) return [];

    return commits.map((c, idx) => ({
      revision_number: commits.length - idx,
      commit_sha: c.sha,
      created_at: c.commit?.committer?.date || c.commit?.author?.date,
      editor_name: c.commit?.author?.name || 'Člen party',
      edit_summary: c.commit?.message || 'Úprava článku',
      html_url: c.html_url
    }));
  }

  return [];
}

// -------------------------------------------------------------
// HTTP Server s REST API
// -------------------------------------------------------------
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

export const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // ---------------- REST API ----------------
  if (pathname.startsWith('/api/')) {
    try {
      // GET /api/health
      if (pathname === '/api/health') {
        return json(res, {
          status: 'ok',
          github_configured: Boolean(CONFIG.githubToken && CONFIG.githubOwner && CONFIG.githubRepo),
          supabase_configured: Boolean(CONFIG.supabaseUrl)
        });
      }

      // GET /api/articles/:slug
      const articleMatch = pathname.match(/^\/api\/articles\/([^/]+)$/);
      if (articleMatch && req.method === 'GET') {
        const slug = articleMatch[1];
        const article = await readMarkdownArticle(slug);
        if (!article) return err(res, 'Článek nenalezen', 404);
        return json(res, article);
      }

      // POST /api/articles (vytvoření / editace článku do GitHubu)
      if (pathname === '/api/articles' && req.method === 'POST') {
        const user = await verifyUser(req);
        if (!user) {
          return err(res, 'Neautorizováno. Pro uložení článku musíte být přihlášeni.', 401);
        }

        const body = await readRequestBody(req);
        const { slug, title, summary, content, article_type, incident_date, incident_location, infobox, categories, edit_summary } = body;

        if (!slug || !title) {
          return err(res, 'Slug a title jsou povinné položky.');
        }

        const metadata = {
          title,
          summary: summary || '',
          article_type: article_type || 'general',
          incident_date: incident_date || null,
          incident_location: incident_location || null,
          categories: Array.isArray(categories) ? categories : [],
          infobox: infobox || {},
          updated_at: new Date().toISOString(),
          updated_by: user.display_name || user.email
        };

        const result = await writeMarkdownArticle(
          slug,
          metadata,
          content || '',
          edit_summary || `Úprava článku ${title}`,
          user
        );

        return json(res, { success: true, slug, result });
      }

      // GET /api/articles/:slug/history
      const historyMatch = pathname.match(/^\/api\/articles\/([^/]+)\/history$/);
      if (historyMatch && req.method === 'GET') {
        const slug = historyMatch[1];
        const history = await getArticleHistory(slug);
        return json(res, { slug, history });
      }

      return err(res, 'Endpoint nenalezen', 404);
    } catch (apiErr) {
      console.error('[API Error]', apiErr);
      return err(res, apiErr.message || 'Interní chyba serveru', 500);
    }
  }

  // ---------------- Statické soubory (Frontend) ----------------
  let staticPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(staticPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (errStat, stats) => {
    if (errStat || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><title>404 Nenalezeno</title><style>body{font-family:sans-serif;padding:2rem;text-align:center;color:#333;}</style></head><body><h1>404 – Stránka nenalezena</h1><p>Hledaná píčovina na této adrese bohužel neexistuje.</p><p><a href="/">Zpět na Hlavní stranu</a></p></body></html>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

const isTestEnv = process.env.NODE_ENV === 'test' ||
  process.argv.some(arg => arg.includes('test')) ||
  process.execArgv.some(arg => arg.includes('--test'));

if (!isTestEnv) {
  server.listen(PORT, () => {
    console.log(`[Encyklopedie píčovin] Node.js server běží na http://localhost:${PORT}`);
    if (CONFIG.githubToken) {
      console.log(`[GitHub API] Připojeno na repozitář: ${CONFIG.githubOwner}/${CONFIG.githubRepo}`);
    } else {
      console.log(`[GitHub API] GITHUB_TOKEN nenastaven – zapnut lokální fallback do složky ./content/articles`);
    }
  });
}
