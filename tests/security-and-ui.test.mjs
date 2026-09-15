import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import Stripe from 'stripe';
import hook from '../netlify/functions/stripe-webhook.mjs';
import progress from '../netlify/functions/campaign-progress.mjs';
import {authorized,settings,saveSnapshot,fingerprint} from '../netlify/lib/runtime.mjs';
const env = { STRIPE_SECRET_KEY:'sk_test_local_only',STRIPE_WEBHOOK_SECRET:'whsec_local_only',STRIPE_MODE:'test',STRIPE_ACCOUNT_ID:'acct_expected',CAMPAIGN_PAYMENT_LINK_IDS:'plink_test',CAMPAIGN_TAX_RESERVE_BPS:'2500',TRACKING_INTERNAL_TOKEN:'a'.repeat(32) };
Object.assign(process.env,env);
test('signature is checked against raw body; forged, tampered, expired events rejected',async()=>{
 const stripe = new Stripe(env.STRIPE_SECRET_KEY);
 const body=JSON.stringify({id:'evt_fake',type:'invoice.paid',livemode:false});
 const signed=stripe.webhooks.generateTestHeaderString({payload:body,secret:env.STRIPE_WEBHOOK_SECRET});
 const req=(payload,signature)=>new Request('https://example.com/api/stripe-webhook',{method:'POST',body:payload,headers:{'stripe-signature':signature}});
 assert.equal((await hook(req(body,'bad'))).status,400);
 assert.equal((await hook(req(body+' ',signed))).status,400);
 assert.equal((await hook(req(body,stripe.webhooks.generateTestHeaderString({payload:body,secret:env.STRIPE_WEBHOOK_SECRET,timestamp:1})))).status,400);
 const live=JSON.stringify({id:'evt_live',type:'invoice.paid',livemode:true});
 assert.equal((await hook(req(live,stripe.webhooks.generateTestHeaderString({payload:live,secret:env.STRIPE_WEBHOOK_SECRET})))).status,400);
 const ignored=JSON.stringify({id:'evt_ignored',type:'customer.updated',livemode:false});
 assert.equal((await hook(req(ignored,stripe.webhooks.generateTestHeaderString({payload:ignored,secret:env.STRIPE_WEBHOOK_SECRET})))).status,204);
});
test('public endpoint never exposes sandbox data',async()=>{
 process.env.CAMPAIGN_TRACKING_ENABLED='true';
 const response=await progress(new Request('https://example.com/api/campaign-progress'));
 assert.deepEqual(await response.json(),{status:'not_connected',verifiedNetCents:null});
});
test('internal authentication rejects wrong and multibyte tokens without throwing',()=>{
 assert.equal(authorized(new Request('https://example.com',{headers:{authorization:'Bearer '+'a'.repeat(32)}})),true);
 assert.equal(authorized(new Request('https://example.com',{headers:{authorization:'Bearer '+'b'.repeat(32)}})),false);
 assert.equal(authorized(new Request('https://example.com',{headers:{authorization:'Bearer '+'é'.repeat(32)}})),false);
});
test('configuration fails closed and fingerprints changes',()=>{
 assert.throws(()=>settings({...env,STRIPE_MODE:'live'}));
 assert.throws(()=>settings({...env,CAMPAIGN_PAYMENT_LINK_IDS:''}));
 assert.notEqual(fingerprint(settings(env)),fingerprint(settings({...env,CAMPAIGN_TAX_RESERVE_BPS:'3000'})));
});
test('older scans cannot overwrite newer snapshots; conditional conflict retries',async()=>{
 let current={data:{startedAt:200},etag:'2'},writes=0;
 const store={getWithMetadata:async()=>current,setJSON:async(key,value)=>{writes++;current={data:value,etag:'3'};return {modified:true};}};
 await saveSnapshot(store,{startedAt:100});
 assert.equal(writes,0);
 await saveSnapshot(store,{startedAt:300});
 assert.equal(current.data.startedAt,300);
 let attempts=0;
 store.setJSON=async()=>({modified:++attempts>1});
 await saveSnapshot(store,{startedAt:400});
 assert.equal(attempts,2);
});
async function render(payload,ok=true){
 const nodes = new Map();
 for(const selector of ['[data-campaign-total]','.campaign-progress','[data-campaign-progress]','[data-tracking-status]','[data-tracking-details]']) nodes.set(selector,{textContent:'',style:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}});
 const context={window:{OPERATION_WAKE:{campaign:{}}},document:{querySelector:s=>nodes.get(s),addEventListener(){}},fetch:async()=>({ok,json:async()=>payload}),Intl,Date,Number,AbortController,setTimeout,clearTimeout,setInterval(){}};
 vm.runInNewContext(readFileSync('campaign-progress.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 return nodes;
}
test('browser displays a verified cents total and accessible progress',async()=>{
 const nodes=await render({status:'ready',currency:'usd',verifiedNetCents:7260,pendingNetCents:100,reserveCents:2420,reserveBps:2500,targetCents:180000000,updatedAt:new Date().toISOString()});
 assert.equal(nodes.get('[data-campaign-total]').textContent,'$72.60');
 assert.equal(nodes.get('.campaign-progress').attributes['aria-valuenow'],'72.6');
});
test('browser never shows a fake zero on errors, stale data, or invalid amounts',async()=>{
 for(const payload of [{status:'not_connected'},{status:'stale'},{status:'review_required'},{status:'ready',verifiedNetCents:'100'}]){
   const nodes=await render(payload);
   assert.equal(nodes.get('[data-campaign-total]').textContent,'Pending verification');
   assert.equal(nodes.get('.campaign-progress').attributes['aria-valuenow'],undefined);
 }
 const nodes=await render({},false);
 assert.equal(nodes.get('[data-campaign-total]').textContent,'Pending verification');
});

test('internal token can be derived without storing a second credential', async()=>{
 const {internalToken}=await import('../netlify/lib/runtime.mjs');
 const value=internalToken({STRIPE_SECRET_KEY:'sk_test_fixture_only'});
 assert.equal(value.length,64);
 assert.equal(value,internalToken({STRIPE_SECRET_KEY:'sk_test_fixture_only'}));
 assert.notEqual(value,internalToken({STRIPE_SECRET_KEY:'sk_test_other_fixture'}));
 assert.ok(!value.includes('sk_test'));
});
