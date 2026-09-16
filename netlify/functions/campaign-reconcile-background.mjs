import { authorized, settings, stripeClient, storeFor, saveSnapshot, fingerprint } from '../lib/runtime.mjs';
import { reconcile } from '../lib/reconcile.mjs';
export default async (request, context) => {
  if (request.method !== 'POST' || !authorized(request)) return new Response(null, { status: 403 });
  const config = settings();
  if (config.mode === 'live' && context?.deploy?.context !== 'production') return new Response(null, { status: 403 });
  const store = storeFor(config.mode);
  const startedAt = Date.now();
  try {
    const snapshot = await reconcile(stripeClient(), config, { now: startedAt });
    snapshot.fingerprint = fingerprint(config);
    await saveSnapshot(store, snapshot);
  } catch {
    await saveSnapshot(store, { startedAt, updatedAt: new Date().toISOString(), mode: config.mode, fingerprint: fingerprint(config), status: 'review_required' });
    // Never log Stripe error bodies, secrets, names, or email addresses.
    throw new Error('Campaign reconciliation failed; inspect configuration and Stripe ledger');
  }
};
