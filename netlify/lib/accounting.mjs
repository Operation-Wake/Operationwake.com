export function reserveRate(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new Error('Reserve rate required');
  const rate = Number(value);
  if (!Number.isInteger(rate) || rate < 0 || rate > 10000) throw new Error('Invalid reserve');
  return rate;
}

// Stripe's balance transactions are the ledger. Never increment a stored total
// from webhook amounts: delivery may be duplicated, delayed, or out of order.
export function summarize(rows, reserveBps) {
  reserveRate(String(reserveBps));
  const seen = new Set();
  let settledNetCents = 0, pendingNetCents = 0, grossCents = 0, feesCents = 0, adjustmentsCents = 0;
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    if (row.currency !== 'usd') throw new Error('Non-USD settlement requires review');
    for (const key of ['amount', 'fee', 'net']) if (!Number.isSafeInteger(row[key])) throw new Error('Invalid ledger amount');
    if (row.amount - row.fee !== row.net) throw new Error('Ledger mismatch');
    if (!['available', 'pending'].includes(row.status)) throw new Error('Unknown settlement status');
    // Negative adjustments reduce the total immediately, even before settlement.
    // Positive entries count only when Stripe reports them available.
    if (row.status === 'pending' && row.net > 0) { pendingNetCents += row.net; continue; }
    settledNetCents += row.net;
    feesCents += row.fee;
    if (['charge', 'payment'].includes(row.type)) grossCents += row.amount;
    else adjustmentsCents += row.amount;
  }
  for (const value of [settledNetCents, pendingNetCents, grossCents, feesCents, adjustmentsCents]) {
    if (!Number.isSafeInteger(value)) throw new Error('Ledger overflow');
  }
  const reserveCents = Number((BigInt(Math.max(0, settledNetCents)) * BigInt(reserveBps) + 9999n) / 10000n);
  return { settledNetCents, pendingNetCents, grossCents, feesCents, adjustmentsCents, reserveCents,
    verifiedNetCents: settledNetCents - reserveCents, reserveBps, currency: 'usd', transactionCount: seen.size };
}

export function publicProgress(snapshot, now = Date.now()) {
  if (!snapshot || snapshot.mode !== 'live') return { status: 'not_connected', verifiedNetCents: null };
  if (snapshot.status !== 'ready') return { status: 'review_required', verifiedNetCents: null, updatedAt: snapshot.updatedAt };
  if (!Number.isFinite(snapshot.startedAt) || now - snapshot.startedAt > 35 * 60 * 1000) {
    return { status: 'stale', verifiedNetCents: null, updatedAt: snapshot.updatedAt };
  }
  // Deliberate allowlist: no account, transaction, customer IDs or contact data.
  const { verifiedNetCents, pendingNetCents, reserveCents, reserveBps, currency } = snapshot.totals;
  return { status: 'ready', verifiedNetCents, pendingNetCents, reserveCents, reserveBps, currency,
    targetCents: 180000000, updatedAt: snapshot.updatedAt };
}
