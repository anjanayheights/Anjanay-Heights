import { get, list } from '@vercel/blob';

const authCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID
    ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }]
    : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];

function send(res: any, status: number, body: unknown) {
  return res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

async function withAuth<T>(fn: (auth: Record<string, string>) => Promise<T>) {
  let last: unknown = new Error('Inventory storage is not configured.');
  for (const auth of [{}, ...authCandidates] as Record<string, string>[]) {
    try {
      return await fn(auth);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

async function read(url: string) {
  const r = await withAuth((auth) => get(url, { access: 'private', ...auth }));
  return r?.statusCode === 200 && r.stream ? await new Response(r.stream).json() : null;
}

function money(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 0;

  const cleaned = raw.replace(/,/g, '').replace(/₹/g, '').trim();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|k)?/i);
  if (!match) return 0;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const unit = String(match[2] || '').toLowerCase();
  if (unit === 'crore' || unit === 'cr') return amount * 10_000_000;
  if (unit === 'lakh' || unit === 'lac') return amount * 100_000;
  return amount;
}

function priceRange(p: any) {
  const min = money(p.minBudget ?? p.minPrice);
  const max = money(p.maxBudget ?? p.maxPrice);
  const price = money(p.price);
  if (min || max) return { min: min || max, max: max || min };
  return { min: price, max: price };
}

function normalise(value: unknown) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function locationMatch(property: any, wanted: string) {
  if (!wanted) return true;
  const hay = normalise(`${property.title || ''} ${property.location || ''} ${property.description || ''}`);
  return hay.includes(normalise(wanted));
}

function typeMatch(property: any, wanted: string) {
  if (!wanted) return true;
  const hay = normalise(`${property.propertyType || property.type || ''} ${property.title || ''}`);
  return hay.includes(normalise(wanted));
}

function bhkMatch(property: any, wanted: string) {
  if (!wanted || /any/i.test(wanted)) return true;
  const requested = wanted.match(/\d+/)?.[0];
  if (!requested) return true;
  const nums = String(property.bedrooms || '').match(/\d+(?:\.\d+)?/g) || [];
  return nums.includes(requested);
}

function budgetScore(property: any, budget: number) {
  if (!budget) return 0;
  const range = priceRange(property);
  if (!range.min && !range.max) return 0;
  if (range.min <= budget && range.max >= budget) return 40;
  if (range.min <= budget) return 25;
  const distance = (range.min - budget) / budget;
  return distance <= 0.15 ? 15 : 0;
}

function matchScore(property: any, q: any) {
  let score = 0;
  if (q.location) score += locationMatch(property, q.location) ? 30 : 0;
  if (q.type) score += typeMatch(property, q.type) ? 15 : 0;
  if (q.bhk) score += bhkMatch(property, q.bhk) ? 20 : 0;
  score += budgetScore(property, money(q.budget));
  if (property.photos?.length) score += 3;
  if (property.videoUrl) score += 2;
  return score;
}

function matches(property: any, q: any) {
  if (!locationMatch(property, q.location)) return false;
  if (!typeMatch(property, q.type)) return false;
  if (!bhkMatch(property, q.bhk)) return false;

  const budget = money(q.budget);
  if (!budget) return true;
  const range = priceRange(property);
  if (!range.min && !range.max) return true;
  return range.min <= budget || range.min <= budget * 1.15;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  try {
    const q = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const result = await withAuth((auth) => list({ prefix: 'crm/properties/', ...auth }));
    const rows = (
      await Promise.all(
        result.blobs.map(async (b) => {
          try {
            return await read(b.url);
          } catch {
            return null;
          }
        }),
      )
    )
      .filter(Boolean)
      .filter((p: any) => String(p.status || 'Available').toLowerCase() === 'available');

    const matchesList = rows
      .filter((p: any) => matches(p, q))
      .map((p: any) => ({ property: p, score: matchScore(p, q) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ property: p, score }: any, i: number) => ({
        id: p.id,
        title: p.title,
        location: p.location,
        propertyType: p.propertyType || p.type,
        price: p.price,
        minBudget: p.minBudget ?? null,
        maxBudget: p.maxBudget ?? null,
        area: p.area,
        bedrooms: p.bedrooms,
        photos: p.photos || [],
        videoUrl: p.videoUrl || '',
        matchScore: score,
        rank: i + 1,
      }));

    return send(res, 200, {
      ok: true,
      count: matchesList.length,
      properties: matchesList,
    });
  } catch (e) {
    console.error('property match error', e);
    return send(res, 500, { error: 'Unable to match properties right now.' });
  }
}
