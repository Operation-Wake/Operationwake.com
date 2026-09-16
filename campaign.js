(function () {
  const campaign = (window.OPERATION_WAKE && window.OPERATION_WAKE.campaign) || {};
  const form = document.querySelector('[data-contribution-form]');
  if (!form) return;
  const fieldset = form.querySelector('fieldset');
  const status = form.querySelector('.device-status');
  const recurring = form.querySelector('[data-recurring]');
  const amounts = form.querySelector('[data-monthly-amounts]');
  const portal = form.querySelector('[data-customer-portal]');
  const live = campaign.paymentsLive === true;
  const stripeUrl = (value, host) => {
    try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === host ? url.href : null; }
    catch { return null; }
  };
  fieldset.disabled = !live;
  form.classList.toggle('is-pending', !live);
  status.textContent = live ? 'Choose your contribution and continue to Stripe’s secure checkout.' : 'Contribution setup in progress. Payments are not open yet.';
  recurring.addEventListener('change', () => { amounts.hidden = !recurring.checked; });
  const portalUrl = stripeUrl(campaign.customerPortal, 'billing.stripe.com');
  if (portalUrl) { portal.href = portalUrl; portal.hidden = false; }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!live) return;
    const selected = form.querySelector('input[name="amount"]:checked');
    const destination = recurring.checked ? (campaign.monthlyPaymentLinks || {})[selected && selected.value] : campaign.oneTimePaymentLink;
    const url = stripeUrl(destination, 'buy.stripe.com');
    if (!url) { status.textContent = 'This contribution option is unavailable. Please try again later.'; return; }
    window.location.assign(url);
  });
})();
