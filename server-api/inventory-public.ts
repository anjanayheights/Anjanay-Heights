type Property = {
  id: string;
  title: string;
  propertyType: string;
  location: string;
  price: string;
  minBudget: number | null;
  maxBudget: number | null;
  area: string;
  bedrooms: string;
  status: 'Available' | 'Hold' | 'Sold' | 'Inactive';
  description: string;
  createdAt: string;
  lastVerified: string;
  verificationStatus: string;
  photos?: string[];
  videoUrl?: string;
  isHot?: boolean;
};

const SUPABASE_URL = 'https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';

function send(res: any, status: number, body: unknown) {
  return res.status(status).setHeader('Cache-Control', 'no-store').setHeader('Pragma', 'no-cache').json(body);
}

async function readSupabase(): Promise<Property[]> {
  const url = `${SUPABASE_URL}/rest/v1/properties?select=id,name,location,property_type,status,price,area,configuration,source_url,video_url,photos_url,verification_status,verification_notes,created_at,updated_at,hot_score,is_public&status=eq.active&verification_status=eq.verified&is_public=eq.true`;
  const r = await fetch(url, {
    headers: {
      // Supabase publishable keys are passed via the apikey header.
      // Do not send the non-JWT publishable key as a Bearer token.
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!r.ok) throw new Error(`Supabase inventory unavailable (${r.status})`);
  const rows: any[] = await r.json();

  return rows.map((p) => ({
    id: String(p?.id || ''),
    title: String(p?.name || 'Property'),
    propertyType: String(p?.property_type || ''),
    location: String(p?.location || ''),
    price: String(p?.price || ''),
    minBudget: null,
    maxBudget: null,
    area: String(p?.area || ''),
    bedrooms: String(p?.configuration || ''),
    status: 'Available' as const,
    description: String(p?.verification_notes || ''),
    createdAt: String(p?.created_at || p?.updated_at || new Date(0).toISOString()),
    lastVerified: String(p?.updated_at || p?.created_at || ''),
    verificationStatus: 'Verified',
    photos: typeof p?.photos_url === 'string' && /\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(p.photos_url.trim()) ? [p.photos_url.trim()] : Array.isArray(p?.photos_url) ? p.photos_url.filter((u: unknown) => typeof u === 'string' && /\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(u.trim())) : [],
    videoUrl: String(p?.video_url || ''),
    isHot: Number(p?.hot_score || 0) >= 70,
  })).filter((p) => p.id);
}

function matchesBhk(p: Property, bhk: string) {
  if (!bhk) return true;
  const wanted = bhk.match(/\d+/)?.[0];
  if (!wanted) return true;
  const nums = String(p.bedrooms || '').match(/\d+(?:\.\d+)?/g) || [];
  return nums.includes(wanted);
}

function budgetOverlap(p: Property, budget: number | null) {
  if (!budget) return true;
  const min = p.minBudget ?? null;
  const max = p.maxBudget ?? null;
  if (min == null && max == null) return true;
  return (min == null || min <= budget) && (max == null || max >= budget);
}

function matchesType(p: Property, type: string) {
  if (!type) return true;
  const value = p.propertyType.toLowerCase();
  const wanted = type.toLowerCase();
  if (wanted === 'residential') return /flat|apartment|villa|residential/.test(value);
  if (wanted === 'commercial') return /commercial|office|shop|retail/.test(value);
  if (wanted === 'plot') return /plot|land/.test(value);
  if (wanted === 'institutional') return /hospital|healthcare|institutional|school/.test(value);
  if (wanted === 'investment') return /investment/.test(value);
  return value.includes(wanted);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  try {
    const all = await readSupabase();
    const rawUrl = String(req.url || '/');
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `http://localhost${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const bhk = (url.searchParams.get('bhk') || '').trim();
    const location = (url.searchParams.get('location') || '').trim().toLowerCase();
    const type = (url.searchParams.get('type') || '').trim().toLowerCase();
    const budget = Number(url.searchParams.get('budget') || 0) || null;

    const properties = all
      .filter((p) => {
        const hay = `${p.title} ${p.propertyType} ${p.location} ${p.price} ${p.area} ${p.bedrooms} ${p.description}`.toLowerCase();
        return (!q || hay.includes(q))
          && (!location || p.location.toLowerCase().includes(location))
          && matchesType(p, type)
          && matchesBhk(p, bhk)
          && budgetOverlap(p, budget);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => ({
        id: p.id,
        title: p.title,
        propertyType: p.propertyType,
        location: p.location,
        price: p.price,
        minBudget: p.minBudget,
        maxBudget: p.maxBudget,
        area: p.area,
        bedrooms: p.bedrooms,
        status: p.status,
        description: p.description,
        photos: p.photos || [],
        videoUrl: p.videoUrl || '',
        createdAt: p.createdAt,
        lastVerified: p.lastVerified,
        verificationStatus: p.verificationStatus,
        isHot: Boolean(p.isHot),
      }));

    return send(res, 200, {
      properties,
      availableCount: all.length,
      totalCount: all.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('public inventory error', e);
    return send(res, 200, {
      properties: [],
      availableCount: 0,
      totalCount: 0,
      updatedAt: new Date().toISOString(),
      inventoryUnavailable: true,
      error: 'Live inventory is temporarily unavailable.',
    });
  }
}
