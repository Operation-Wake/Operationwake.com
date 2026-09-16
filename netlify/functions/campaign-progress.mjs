import { storeFor, settings, fingerprint } from '../lib/runtime.mjs';
import { publicProgress } from '../lib/accounting.mjs';
export default async (request, context) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET' } });
  if (process.env.CAMPAIGN_TRACKING_ENABLED !== 'true' || process.env.STRIPE_MODE !== 'live' || context?.deploy?.context !== 'production') {
    return Response.json({ status: 'not_connected', verifiedNetCents: null }, { headers });
  }
  try {
    const snapshot = await storeFor('live').get('progress', { type: 'json' });
    if (snapshot && snapshot.fingerprint !== fingerprint(settings())) return Response.json({status: "not_connected", verifiedNetCents: null}, {headers});
    return Response.json(publicProgress(snapshot), { headers });
  } catch {
    return Response.json({ status: 'unavailable', verifiedNetCents: null }, { status: 503, headers });
  }
};
