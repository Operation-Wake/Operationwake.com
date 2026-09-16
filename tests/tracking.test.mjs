import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, publicProgress, reserveRate } from '../netlify/lib/accounting.mjs';
import { reconcile } from '../netlify/lib/reconcile.mjs';
const row = (id, amount, fee = 0, status = 'available', type = 'charge', source = 'ch_campaign') => ({ id, amount, fee, net: amount - fee, status, type, source, currency: 'usd' });
const list = rows => async function* () { yield* rows; };
const config = { account: 'acct_expected', links: new Set(['plink_campaign']), mode: 'test', reserveBps: 2500 };
function stripe(rows, overrides = {}) {
  return {
    accounts: { retrieve: async () => ({ id: 'acct_expected' }) },
    paymentLinks: { retrieve: async () => ({ livemode: false }) },
    balanceTransactions: { list: list(rows) },
    charges: { retrieve: async value => ({ id: value, livemode: false, payment_intent: value === 'ch_other' ? 'pi_other' : 'pi_campaign' }) },
    checkout: { sessions: { list: list([{ status: 'complete', livemode: false, payment_link: 'plink_campaign' }]) } },
    invoicePayments: { list: list([]) },
    refunds: { retrieve: async () => ({ charge: 'ch_campaign' }) },
    disputes: { retrieve: async () => ({ charge: 'ch_campaign' }) },
    ...overrides
  };
}
test('actual fees then 25% reserve, rounded conservatively in cents', () => {
  const value = summarize([row('txn_a', 10000, 320)], 2500);
  assert.equal(value.reserveCents, 2420);
  assert.equal(value.verifiedNetCents, 7260);
  assert.equal(summarize([row('tiny', 1)], 2500).verifiedNetCents, 0);
});
test('duplicate ledger rows and order do not change total', () => {
  const a = row('a', 10000, 320), b = row('b', -2000, 0, 'available', 'refund');
  assert.deepEqual(summarize([a,b,a],2500), summarize([b,a],2500));
});
test('pending positive funds excluded; pending refunds deducted immediately', () => {
  const value = summarize([row('a',10000,320), row('b',5000,175,'pending'),row('c',-2000,0,'pending','refund')],2500);
  assert.equal(value.pendingNetCents,4825);
  assert.equal(value.verifiedNetCents,5760);
});
test('full refund preserves unrecovered fee loss; no negative tax reserve', () => {
  const value = summarize([row('a',10000,320), row('b',-10000,0,'available','refund')],2500);
  assert.equal(value.verifiedNetCents,-320);
  assert.equal(value.reserveCents,0);
});
test('dispute debit and reinstatement are not counted as extra donations', () => {
  const value = summarize([row('a',10000,320),row('b',-10000,1500,'available','adjustment'),row('c',10000,0,'available','adjustment')],2500);
  assert.equal(value.grossCents,10000);
  assert.equal(value.verifiedNetCents,6135);
});
test('reject invalid amounts, currencies, reserve, and ledger mismatches', () => {
  assert.throws(()=>reserveRate(''));
  assert.throws(()=>reserveRate('25000'));
  assert.throws(()=>summarize([{...row('a',100),currency:'eur'}],2500));
  assert.throws(()=>summarize([{...row('a',100),net:99}],2500));
  assert.throws(()=>summarize([row('a',0.1)],2500));
});
test('public response hides stale/test/review totals and private identifiers', () => {
  const snapshot = { mode:'live',status:'ready',startedAt:Date.now(),updatedAt:new Date().toISOString(),totals:summarize([row('a',1000)],2500),review:[],secret:'private' };
  assert.equal(publicProgress(snapshot).verifiedNetCents,750);
  assert.equal(publicProgress({...snapshot,mode:'test'}).verifiedNetCents,null);
  assert.equal(publicProgress({...snapshot,status:'review_required'}).verifiedNetCents,null);
  assert.equal(publicProgress(snapshot,Date.now()+36*60000).status,'stale');
  assert.ok(!JSON.stringify(publicProgress(snapshot)).includes('private'));
});
test('reconcile attributes refunds and disputes, ignores payouts',async()=>{
  const result = await reconcile(stripe([row('a',10000,320),row('b',-2000,0,'available','refund','re_refund'),row('payout',-5000,0,'available','payout',null)]),config);
  assert.equal(result.totals.verifiedNetCents,5760);
  assert.equal(result.status,'ready');
});
test('unallocated platform fees block verified publication',async()=>{
  const result = await reconcile(stripe([row('a',10000,320),row('billing',-100,0,'available','stripe_fee',null)]),config);
  assert.equal(result.status,'review_required');
});
test('excludes unrelated Checkout links',async()=>{
  const result = await reconcile(stripe([row('a',10000)],{checkout:{sessions:{list:list([{status:'complete',livemode:false,payment_link:'plink_other'}])}}}),config);
  assert.equal(result.totals.verifiedNetCents,0);
});
test('recurring renewal is attributed via invoice subscription original Checkout',async()=>{
  const api = stripe([row('renewal',2000,88)],{
    checkout:{sessions:{list: async function* (filter) { if(filter.subscription==='sub_campaign') yield {status:'complete',livemode:false,payment_link:'plink_campaign'}; }}},
    invoicePayments:{list:list([{invoice:'in_renewal'}])},
    invoices:{retrieve:async()=>({parent:{subscription_details:{subscription:'sub_campaign'}}})}
  });
  assert.equal((await reconcile(api,config)).totals.verifiedNetCents,1434);
});
test('wrong account, wrong mode, partial scans fail closed',async()=>{
  await assert.rejects(()=>reconcile(stripe([],{accounts:{retrieve:async()=>({id:'acct_wrong'})}}),config));
  await assert.rejects(()=>reconcile(stripe([],{paymentLinks:{retrieve:async()=>({livemode:true})}}),config));
  await assert.rejects(()=>reconcile(stripe([row('a',100),row('b',100)]),config,{maxRows:1}));
});
