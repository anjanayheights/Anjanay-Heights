const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v26.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function json(res: any, status: number, body: unknown) {
  return res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}
function header(req: any, name: string) {
  return String(req?.headers?.[name.toLowerCase()] || req?.headers?.[name] || '');
}
function authorized(req: any) {
  const secret = process.env.CRON_SECRET || '';
  return !secret || header(req, 'authorization') === `Bearer ${secret}`;
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  (() => {
    try {
      const keys = JSON.parse(process.env.SUPABASE_SECRET_KEYS || '{}');
      return String(keys?.default || '');
    } catch {
      return '';
    }
  })();

async function supabaseRequest(path: string) {
  if (!SUPABASE_KEY) throw new Error('Supabase server key is not configured.');
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      apikey: SUPABASE_KEY,
      ...(SUPABASE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SUPABASE_KEY } : {}),
      'Content-Type': 'application/json'
    }
  });
  if (!r.ok) throw new Error('Supabase request failed (' + r.status + '): ' + (await r.text()).slice(0, 300));
  return r.json();
}

async function getPageAccessToken(systemUserToken: string, pageId: string) {
  const r = await fetch(`${GRAPH_BASE}/me/accounts?fields=id,access_token&access_token=${encodeURIComponent(systemUserToken)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.error) throw new Error(data?.error?.message || `Facebook Page token lookup failed ${r.status}`);
  const page = Array.isArray(data?.data) ? data.data.find((item: any) => String(item?.id) === pageId) : null;
  if (!page?.access_token) throw new Error('Facebook Page access token could not be resolved for the assigned Page.');
  return String(page.access_token);
}

async function readPageFeed(pageId: string, pageAccessToken: string) {
  const fields = 'id,message,created_time,permalink_url,is_published';
  const r = await fetch(
    `${GRAPH_BASE}/${pageId}/feed?fields=${fields}&limit=100&access_token=${encodeURIComponent(pageAccessToken)}`
  );
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.error) throw new Error(data?.error?.message || `Facebook Page feed read failed ${r.status}`);
  return Array.isArray(data?.data) ? data.data : [];
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' });

  const systemUserToken = process.env.META_SYSTEM_USER_TOKEN || '';
  const pageId = process.env.META_PAGE_ID || '1297238420139113';
  if (!systemUserToken) return json(res, 503, { ok: false, error: 'Facebook verification is not configured.' });

  try {
    const rows = await supabaseRequest(
      'social_posts?platform=eq.facebook&select=property_id,post_id,posted_at,title&order=posted_at.desc&limit=20'
    );
    const pageAccessToken = await getPageAccessToken(systemUserToken, pageId);
    const feed = await readPageFeed(pageId, pageAccessToken);

    const results = (Array.isArray(rows) ? rows : []).map((row: any) => {
      const postId = String(row?.post_id || '');
      const found = feed.find((item: any) =>
        String(item?.id || '') === postId || String(item?.id || '').startsWith(postId + '_')
      );
      return {
        title: String(row?.title || ''),
        propertyId: String(row?.property_id || ''),
        postId,
        postedAt: row?.posted_at || null,
        visibleOnPageFeed: Boolean(found),
        isPublished: found ? found.is_published !== false : null,
        permalinkUrl: found?.permalink_url || '',
        createdTime: found?.created_time || null
      };
    });

    return json(res, 200, {
      ok: true,
      pageId,
      feedItemsChecked: feed.length,
      posts: results
    });
  } catch (e: any) {
    console.error('facebook-verify error', e);
    return json(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
