import { settings, stripeClient, storeFor } from '../lib/runtime.mjs';
const events = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed', 'invoice.paid', 'charge.updated', 'charge.refunded',
  'refund.updated', 'charge.dispute.created', 'charge.dispute.closed', 'charge.dispute.funds_withdrawn',
  'charge.dispute.funds_reinstated', 'balance.available']);
export default async (request, context) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  let config, stripe;
  try { config = settings(); stripe = stripeClient(); } catch { return new Response('Not configured', { status: 503 }); }
  if (config.mode === 'live' && context?.deploy?.context !== 'production') return new Response(null, { status: 403 });
  const body = await request.text();
  if (Buffer.byteLength(body) > 1024 * 1024) return new Response(null, { status: 413 });
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, request.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  } catch { return new Response('Invalid signature', { status: 400 }); }
  if (event.livemode !== (config.mode === 'live') || (event.account && event.account !== config.account)) return new Response('Wrong context', { status: 400 });
  if (!events.has(event.type)) return new Response(null, { status: 204 });
  try {
    // Store only minimal delivery audit data, never the full payload or PII.
    await storeFor(config.mode).setJSON(`events/${event.id}`, { id: event.id, type: event.type, created: event.created }, { onlyIfNew: true });
    // Scheduled reconciliation coalesces deliveries into one run every 15 minutes.
    // Do not launch a full financial scan for every duplicate Stripe notification.
    return new Response(null, { status: 204 });
  } catch { return new Response('Retry delivery', { status: 503 }); }
};
