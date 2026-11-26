(function () {
  const settings = (window.OPERATION_WAKE && window.OPERATION_WAKE.campaign) || {};
  const total = document.querySelector('[data-campaign-total]');
  const bar = document.querySelector('.campaign-progress');
  const fill = document.querySelector('[data-campaign-progress]');
  const status = document.querySelector('[data-tracking-status]');
  const details = document.querySelector('[data-tracking-details]');
  const goalProgress = document.querySelector('[data-home-goal-progress]');
  const goalLabel = document.querySelector('[data-home-goal-label]');
  const homeGoalCents = 400000;
  if (!total || !status) return;
  const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100);
  function unavailable(message) {
    total.textContent = 'Pending verification';
    status.textContent = message;
    if (details) details.textContent = '';
    if (goalProgress) { goalProgress.removeAttribute('value'); goalProgress.hidden = true; }
    if (goalLabel) goalLabel.textContent = 'Progress pending verified contribution data.';
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
          !Number.isFinite(Date.parse(data.updatedAt)) || Date.now() - Date.parse(data.updatedAt) > 35 * 60 * 1000) throw new Error('Invalid total');
      total.textContent = money(data.verifiedNetCents);
      if (goalProgress) {
        const available = Math.max(0, data.verifiedNetCents);
        goalProgress.max = homeGoalCents;
        goalProgress.value = Math.min(available, homeGoalCents);
        goalProgress.hidden = false;
        const percent = available / homeGoalCents * 100;
        const label = `${money(available)} available toward the ${money(homeGoalCents)} working goal (${percent.toFixed(2)}%).`;
        goalProgress.setAttribute('aria-valuetext', label);
        if (goalLabel) goalLabel.textContent = label;
      }
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
