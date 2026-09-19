(function () {
  const settings = (window.OPERATION_WAKE && window.OPERATION_WAKE.campaign) || {};
  const total = document.querySelector('[data-campaign-total]');
  const bar = document.querySelector('.campaign-progress');
  const fill = document.querySelector('[data-campaign-progress]');
  const status = document.querySelector('[data-tracking-status]');
  const details = document.querySelector('[data-tracking-details]');
  if (!total || !bar || !fill || !status) return;
  const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100);
  function unavailable(message) {
    total.textContent = 'Pending verification';
    fill.style.width = '0%';
    bar.removeAttribute('aria-valuenow');
    bar.setAttribute('aria-valuetext', message);
    status.textContent = message;
    if (details) details.textContent = '';
  }
  let running = false;
  async function refresh() {
    if (running) return;
    running = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(settings.progressEndpoint || '/api/campaign-progress', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (data.status !== 'ready') {
        const messages = {
          not_connected: 'A confirmed campaign total is temporarily unavailable.',
          review_required: 'The contribution total is being reconciled. It will return after verification.',
          stale: 'The latest contribution total is awaiting a fresh update.'
        };
        unavailable(messages[data.status] || 'Tracking is temporarily unavailable. Please check again shortly.');
        return;
      }
      if (data.currency !== 'usd' || !Number.isSafeInteger(data.verifiedNetCents) ||
          !Number.isSafeInteger(data.pendingNetCents) || data.pendingNetCents < 0 ||
          !Number.isSafeInteger(data.reserveCents) || data.reserveCents < 0 ||
          !Number.isInteger(data.reserveBps) || data.reserveBps < 0 || data.reserveBps > 10000 ||
          !Number.isSafeInteger(data.targetCents) || data.targetCents <= 0 ||
          !Number.isFinite(Date.parse(data.updatedAt)) || Date.now() - Date.parse(data.updatedAt) > 35 * 60 * 1000) throw new Error('Invalid total');
      total.textContent = money(data.verifiedNetCents);
      const targetCents = 115000000; // Published cumulative milestone for Missions 1–3; Mission 4 remains TBD.
      const bounded = Math.max(0, Math.min(targetCents, data.verifiedNetCents));
      fill.style.width = `${bounded / targetCents * 100}%`;
      bar.setAttribute('aria-valuemax', String(targetCents / 100));
      bar.setAttribute('aria-valuenow', String(bounded / 100));
      bar.setAttribute('aria-valuetext', `${money(data.verifiedNetCents)} estimated net toward ${money(targetCents)} for Missions 1–3; Mission 4 target to be determined`);
      status.textContent = `Updated ${new Date(data.updatedAt).toLocaleString('en-US')}. Automatic checks are scheduled every 15 minutes.`;
      if (details) details.textContent = `Pending settlement: ${money(data.pendingNetCents)} (not counted). Provisional reserve: ${data.reserveBps / 100}% (${money(data.reserveCents)}).`;
    } catch {
      unavailable('Tracking is temporarily unavailable. Please check again shortly.');
    } finally {
      clearTimeout(timeout);
      running = false;
    }
  }
  unavailable('Checking latest contributions…');
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
