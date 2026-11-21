(function () {
  const cards = [...document.querySelectorAll('[data-boat-id]')];
  const search = document.getElementById('boat-search');
  const statusFilter = document.getElementById('status-filter');
  const feedback = document.getElementById('research-feedback');
  const count = document.getElementById('research-count');
  const statuses = new Set(['Researched', 'Toured', 'Shortlisted', 'Ruled out']);
  const storagePrefix = 'operation-wake-boat-research-v1:';

  if (!cards.length || !search || !statusFilter) return;

  function filterCards() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;

    for (const card of cards) {
      const matchesSearch = card.dataset.search.includes(query);
      const status = card.querySelector('[data-research-status]').value;
      const matchesStatus = statusFilter.value === 'all' || status === statusFilter.value;
      card.hidden = !(matchesSearch && matchesStatus);
      if (!card.hidden) visible += 1;
    }

    for (const group of document.querySelectorAll('.research-group')) {
      const emptyMessage = group.querySelector('.research-empty');
      const visibleCards = [...group.querySelectorAll('[data-boat-id]')].some(card => !card.hidden);
      if (emptyMessage) emptyMessage.hidden = visibleCards;
    }

    count.textContent = `${visible} of ${cards.length} research entries shown`;
  }

  for (const card of cards) {
    const status = card.querySelector('[data-research-status]');
    const notes = card.querySelector('[data-research-notes]');
    const stage = card.querySelector('.boat-stage');
    const storageKey = storagePrefix + card.dataset.boatId;

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && statuses.has(saved.status)) status.value = saved.status;
      if (saved && typeof saved.notes === 'string') notes.value = saved.notes.slice(0, 8000);
    } catch {
      feedback.textContent = 'Browser storage is unavailable or contains unreadable notes. You can still review and edit this page.';
    }

    stage.textContent = status.value;

    function save() {
      stage.textContent = status.value;
      try {
        localStorage.setItem(storageKey, JSON.stringify({status: status.value, notes: notes.value}));
        const message = `Saved ${card.dataset.name} on this browser.`;
        if (feedback.textContent !== message) feedback.textContent = message;
      } catch {
        feedback.textContent = 'Your edit is visible, but this browser could not save it. Keep a copy of your notes before closing the page.';
      }
    }

    status.addEventListener('change', () => {
      save();
      filterCards();
    });
    notes.addEventListener('input', save);
  }

  search.addEventListener('input', filterCards);
  statusFilter.addEventListener('change', filterCards);
  filterCards();
})();
