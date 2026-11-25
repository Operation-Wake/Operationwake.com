(function () {
  const cards = [...document.querySelectorAll('[data-boat-id]')];
  const search = document.getElementById('boat-search');
  const statusFilter = document.getElementById('status-filter');
  const count = document.getElementById('research-count');

  if (!cards.length || !search || !statusFilter) return;

  function filterCards() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;

    for (const card of cards) {
      const matchesSearch = card.dataset.search.includes(query);
      const status = card.dataset.defaultStatus;
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

  search.addEventListener('input', filterCards);
  statusFilter.addEventListener('change', filterCards);
  filterCards();
})();
