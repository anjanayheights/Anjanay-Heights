const SUPABASE_URL = 'https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';

const BASE = 'https://anjanayheights-9m6i.vercel.app';

function xmlEscape(value) {
  return String(value || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[c]));
}

function slug(value) {
  return String(value || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default async function sitemap(req, res) {
  try {
    const endpoint = SUPABASE_URL + '/rest/v1/properties?select=id,location,updated_at,status,verification_status,is_public&status=eq.active&verification_status=eq.verified&is_public=eq.true';
    const response = await fetch(endpoint, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
    });
    if (!response.ok) throw new Error('Inventory query failed: ' + response.status);

    const rows = await response.json();
    const urls = new Map();

    const add = (loc, lastmod) => {
      if (!urls.has(loc)) urls.set(loc, lastmod || '');
    };

    add('/', new Date().toISOString());

    [
      'noida','greater-noida','noida-extension','yamuna-expressway','yeida',
      'faridabad','ghaziabad','gurgaon','greater-noida-west','jewar','delhi-ncr'
    ].forEach((location) => add('/locations/' + location));

    for (const row of Array.isArray(rows) ? rows : []) {
      if (!row?.id) continue;
      add('/property/' + encodeURIComponent(String(row.id)), row.updated_at);
    }

    const body = Array.from(urls.entries()).map(([path, lastmod]) => {
      const lm = lastmod ? '<lastmod>' + xmlEscape(new Date(lastmod).toISOString()) + '</lastmod>' : '';
      return '<url><loc>' + xmlEscape(BASE + path) + '</loc>' + lm + '<changefreq>daily</changefreq></url>';
    }).join('');

    const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + body + '</urlset>';

    return res.status(200)
      .setHeader('Content-Type', 'application/xml; charset=utf-8')
      .setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
      .send(xml);
  } catch (error) {
    const fallback = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      '<url><loc>' + BASE + '/</loc></url>' +
      '</urlset>';
    return res.status(200)
      .setHeader('Content-Type', 'application/xml; charset=utf-8')
      .setHeader('Cache-Control', 'public, s-maxage=300')
      .send(fallback);
  }
}
