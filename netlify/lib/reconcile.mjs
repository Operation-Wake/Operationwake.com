import { summarize } from './accounting.mjs';
const id = object => typeof object === 'string' ? object : object?.id;
const ignored = new Set(['payout', 'payout_cancel', 'payout_failure', 'topup', 'topup_reversal']);

// Full reconciliation also catches missed webhooks and pending-to-available
// transitions. A hard bound fails closed instead of publishing a partial sum.
export async function reconcile(stripe, config, { now = Date.now(), deadlineMs = 12 * 60 * 1000, maxRows = 10000 } = {}) {
  const account = await stripe.accounts.retrieve();
  if (account.id !== config.account) throw new Error('Unexpected Stripe account');
  for (const link of config.links) {
    const value = await stripe.paymentLinks.retrieve(link);
    if (value.livemode !== (config.mode === 'live')) throw new Error('Payment link mode mismatch');
  }
  const chargeCache = new Map(), subscriptionCache = new Map(), sourceCache = new Map();
  const included = [], review = [];
  let scanned = 0;
  function checkLimit() { if (Date.now() - now > deadlineMs) throw new Error('Reconciliation time limit'); }
  async function sessionsMatch(filter) {
    for await (const session of stripe.checkout.sessions.list({ ...filter, limit: 100 })) {
      checkLimit();
      if (session.status === 'complete' && session.livemode === (config.mode === 'live') && config.links.has(id(session.payment_link))) return true;
    }
    return false;
  }
  async function belongsToCampaign(chargeId) {
    if (chargeCache.has(chargeId)) return chargeCache.get(chargeId);
    const charge = await stripe.charges.retrieve(chargeId);
    if (charge.livemode !== (config.mode === 'live')) throw new Error('Charge mode mismatch');
    const pi = id(charge.payment_intent);
    if (!pi) { chargeCache.set(chargeId, false); return false; }
    let matches = await sessionsMatch({ payment_intent: pi });
    if (!matches) {
      for await (const payment of stripe.invoicePayments.list({ payment: { type: 'payment_intent', payment_intent: pi }, limit: 100 })) {
        checkLimit();
        const invoice = await stripe.invoices.retrieve(id(payment.invoice));
        const subscription = id(invoice.parent?.subscription_details?.subscription);
        if (!subscription) continue;
        if (!subscriptionCache.has(subscription)) subscriptionCache.set(subscription, await sessionsMatch({ subscription }));
        if (subscriptionCache.get(subscription)) matches = true;
      }
    }
    chargeCache.set(chargeId, matches);
    return matches;
  }
  async function sourceCharge(source) {
    const sourceId = id(source);
    if (!sourceId) return null;
    if (sourceCache.has(sourceId)) return sourceCache.get(sourceId);
    let charge = null;
    if (/^(ch_|py_)/.test(sourceId)) charge = sourceId;
    else if (/^(re_|pyr_)/.test(sourceId)) charge = id((await stripe.refunds.retrieve(sourceId)).charge);
    else if (sourceId.startsWith('dp_')) charge = id((await stripe.disputes.retrieve(sourceId)).charge);
    sourceCache.set(sourceId, charge);
    return charge;
  }
  // Keep an upper created bound so new payments are handled on the next pass.
  for await (const row of stripe.balanceTransactions.list({ limit: 100, created: { lte: Math.floor(now / 1000) } })) {
    checkLimit();
    if (++scanned > maxRows) throw new Error('Ledger size requires incremental database upgrade');
    if (ignored.has(row.type)) continue; // Bank payouts are not campaign expenses.
    const chargeId = await sourceCharge(row.source);
    if (chargeId) {
      if (await belongsToCampaign(chargeId)) included.push(row);
    } else if (row.amount !== 0 || row.fee !== 0 || row.net !== 0) {
      // Billing fees, manual adjustments, reserves, FX, etc. cannot safely be
      // guessed as campaign costs. Withhold verified net until allocated.
      review.push({ id: row.id, type: row.type });
    }
  }
  return { schemaVersion: 1, mode: config.mode, startedAt: now, updatedAt: new Date().toISOString(),
    status: review.length ? 'review_required' : 'ready', totals: summarize(included, config.reserveBps),
    review, scanned };
}
