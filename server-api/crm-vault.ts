import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const SUPABASE_URL = 'https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_KEY = 'sb_publishable__2iHvDMRRfVzkPYAQfQI6Q_7Df0v2UF';
const TABLE = 'crm_vault_events';
const SALT = 'anjanay-heights-crm-vault-v1';

function key() {
  const password = process.env.DASHBOARD_PASSWORD || '';
  return password ? scryptSync(password, SALT, 32) : null;
}

function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
}

export function vaultAvailable() { return Boolean(key()); }

export function encryptVault(value: unknown) {
  const secret = key();
  if (!secret) throw new Error('CRM vault key unavailable');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return { payload: ciphertext.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}

export function decryptVault(row: any) {
  const secret = key();
  if (!secret || !row?.payload || !row?.iv || !row?.tag) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', secret, Buffer.from(row.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(row.tag, 'base64'));
    const plain = Buffer.concat([decipher.update(Buffer.from(row.payload, 'base64')), decipher.final()]).toString('utf8');
    return JSON.parse(plain);
  } catch { return null; }
}

export async function appendVault(recordType: string, recordId: string, value: unknown) {
  if (!vaultAvailable()) return false;
  const encrypted = encryptVault(value);
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify({ record_type: recordType, record_id: recordId, ...encrypted })
  });
  if (!r.ok) throw new Error(`CRM vault write failed (${r.status})`);
  return true;
}

export async function readVault(recordType: string) {
  if (!vaultAvailable()) return [];
  const endpoint = `${SUPABASE_URL}/rest/v1/${TABLE}?select=record_id,created_at,payload,iv,tag&record_type=eq.${encodeURIComponent(recordType)}&order=created_at.asc&limit=5000`;
  const r = await fetch(endpoint, { headers: headers() });
  if (!r.ok) throw new Error(`CRM vault read failed (${r.status})`);
  const rows = await r.json();
  return (Array.isArray(rows) ? rows : []).map((row: any) => ({ ...row, value: decryptVault(row) })).filter((row: any) => row.value !== null);
}

export async function readVaultRecord(recordType: string, recordId: string) {
  const rows = await readVault(recordType);
  const matches = rows.filter((row: any) => row.record_id === recordId);
  return matches.length ? matches[matches.length - 1].value : null;
}
