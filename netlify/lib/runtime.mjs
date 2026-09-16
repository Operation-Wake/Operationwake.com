import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';
import { timingSafeEqual, createHash, createHmac } from 'node:crypto';
import { reserveRate } from './accounting.mjs';

export function settings(env = process.env) {
  const mode = env.STRIPE_MODE;
  if (!['live', 'test'].includes(mode)) throw new Error('Stripe mode required');
  if (!env.STRIPE_SECRET_KEY?.startsWith(`sk_${mode}_`) && !env.STRIPE_SECRET_KEY?.startsWith(`rk_${mode}_`)) throw new Error('Key mode mismatch');
  if (!/^acct_\w+$/.test(env.STRIPE_ACCOUNT_ID || '')) throw new Error('Account required');
  const links = new Set((env.CAMPAIGN_PAYMENT_LINK_IDS || '').split(',').map(x => x.trim()).filter(Boolean));
  if (!links.size || [...links].some(x => !/^plink_\w+$/.test(x))) throw new Error('Campaign links required');
  return { mode, account: env.STRIPE_ACCOUNT_ID, links, reserveBps: reserveRate(env.CAMPAIGN_TAX_RESERVE_BPS) };
}
export const stripeClient = () => new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil', timeout: 15000, maxNetworkRetries: 2
});
export const storeFor = mode => getStore({ name: `campaign-tracking-${mode}`, consistency: 'strong' });
export function internalToken(env = process.env) {
  if (env.TRACKING_INTERNAL_TOKEN) return env.TRACKING_INTERNAL_TOKEN;
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe key required');
  return createHmac('sha256', env.STRIPE_SECRET_KEY).update('operation-wake:reconcile:v1').digest('hex');
}
export function authorized(request) {
  let expected;
  try { expected = internalToken(); } catch { return false; }
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  return Boolean(expected && expected.length >= 32 && Buffer.byteLength(supplied) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)));
}
export async function dispatch(context) {
  const token = internalToken();
  if (token.length < 32) throw new Error('Internal token required');
  const origin = deploymentOrigin(context);
  const url = new URL('/.netlify/functions/campaign-reconcile-background', origin);
  if (url.protocol !== 'https:') throw new Error('HTTPS required');
  const response = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
  if (response.status !== 202) throw new Error('Reconciliation not accepted');
}

export async function saveSnapshot(store, snapshot) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await store.getWithMetadata('progress', { type: 'json' });
    if (current && current.data.startedAt >= snapshot.startedAt) return;
    const result = await store.setJSON('progress', snapshot, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
    if (result.modified) return;
  }
  throw new Error('Snapshot contention');
}

export function fingerprint(config) {
  return createHash("sha256").update(JSON.stringify({account:config.account,mode:config.mode,links:[...config.links].sort(),reserveBps:config.reserveBps})).digest("hex");
}

export function deploymentOrigin(context) {
  const id = context?.deploy?.id, name = context?.site?.name;
  if (!/^[a-f0-9]{24}$/.test(id || '') || !/^[a-z0-9-]+$/.test(name || '')) throw new Error('Deploy identity required');
  return `https://${id}--${name}.netlify.app`;
}
