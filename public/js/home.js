document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const categoryRail = document.getElementById('categoryRail');
  const featuredGrid = document.getElementById('featuredEventsGrid');
  const eventsGrid = document.getElementById('eventsGrid');
  const status = document.getElementById('homeStatus');
  const heroStats = document.getElementById('heroStats');
  const nextEventPanel = document.getElementById('nextEventPanel');
  const heroUpcoming = document.getElementById('heroUpcoming');
  const heroOccupancy = document.getElementById('heroOccupancy');
  const heroSideList = document.getElementById('heroSideList');
  const resultsMeta = document.getElementById('resultsMeta');
  const listMeta = document.getElementById('listMeta');

  const state = {
    search: '',
    category: 'All',
    sort: 'soonest',
    events: [],
    summary: null
  };

  const categoryOrder = ['All', 'Technology', 'Music', 'Workshop', 'Business', 'Community', 'Sports', 'Experience'];

  const getCategoryCounts = () => {
    const counts = state.events.reduce((accumulator, event) => {
      const category = App.getEventCategory(event);
      accumulator[category] = (accumulator[category] || 0) + 1;
      return accumulator;
    }, { All: state.events.length });

    return categoryOrder.reduce((accumulator, category) => {
      accumulator[category] = counts[category] || 0;
      return accumulator;
    }, {});
  };

  const matchesState = (event) => {
    const category = App.getEventCategory(event);
    const searchText = `${event.title} ${event.description} ${event.location}`.toLowerCase();
    const matchesSearch = !state.search || searchText.includes(state.search.toLowerCase());
    const matchesCategory = state.category === 'All' || category === state.category;
    return matchesSearch && matchesCategory;
  };

  const sortEvents = (events) => {
    const items = [...events];

    switch (state.sort) {
      case 'availability':
        return items.sort((left, right) => left.availableSeats - right.availableSeats);
      case 'popular':
        return items.sort((left, right) => App.getOccupancyPercent(right) - App.getOccupancyPercent(left));
      default:
        return items.sort((left, right) => new Date(left.date) - new Date(right.date));
    }
  };

  const renderNextEvent = () => {
    const nextEvent = state.summary?.nextEvent;

    if (!nextEvent) {
      nextEventPanel.innerHTML = `
        <div class="panel-card text-center py-4">
          <h4 class="mb-2">No upcoming events yet</h4>
          <p class="text-muted mb-0">Create events from the admin console to start building your catalog.</p>
        </div>
      `;
      return;
    }

    const category = App.getEventCategory(nextEvent);
    const occupancy = App.getOccupancyPercent(nextEvent);

    nextEventPanel.innerHTML = `
      <div class="feature-card">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <div class="section-title mb-1">Next up</div>
            <h3 class="fw-bold mb-2">${App.escapeHtml(nextEvent.title)}</h3>
          </div>
          <span class="badge badge-warm">${category}</span>
        </div>
        <p class="text-muted mb-3">${App.truncateText(nextEvent.description, 140)}</p>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <span class="badge badge-soft">${App.formatDateTime(nextEvent.date)}</span>
          <span class="badge text-bg-dark">${App.escapeHtml(nextEvent.location)}</span>
          <span class="badge badge-warm">${nextEvent.availableSeats} seats left</span>
        </div>
        <div class="progress-track mb-3">
          <div class="progress-bar-soft" style="width: ${occupancy}%"></div>
        </div>
        <div class="d-flex justify-content-between small text-muted">
          <span>${occupancy}% booked</span>
          <span>${nextEvent.totalSeats} total seats</span>
        </div>
        <div class="d-flex gap-2 mt-4">
          <a href="event.html?id=${nextEvent._id}" class="btn btn-outline-brand btn-sm flex-fill">View details</a>
          <a href="book.html?id=${nextEvent._id}" class="btn btn-brand btn-sm flex-fill ${nextEvent.availableSeats <= 0 ? 'disabled' : ''}">${nextEvent.availableSeats <= 0 ? 'Sold out' : 'Book now'}</a>
        </div>
      </div>
    `;
  };

  const renderHeroStats = () => {
    const summary = state.summary || {};
    const stats = [
      { label: 'Total events', value: summary.totalEvents || 0, subtext: 'Live catalog size' },
      { label: 'Upcoming events', value: summary.upcomingEvents || 0, subtext: 'Scheduled ahead' },
      { label: 'Available seats', value: App.formatCompactNumber(summary.availableSeats || 0), subtext: 'Across all events' },
      { label: 'Occupancy rate', value: `${summary.occupancyRate || 0}%`, subtext: 'Booked vs capacity' }
    ];

    heroStats.innerHTML = stats.map((stat) => `
      <div class="col-sm-6 col-xl-3">
        <div class="mini-stat">
          <div class="label">${stat.label}</div>
          <div class="value">${stat.value}</div>
          <div class="subtext">${stat.subtext}</div>
        </div>
      </div>
    `).join('');

    heroUpcoming.textContent = summary.upcomingEvents || 0;
    heroOccupancy.textContent = `${summary.occupancyRate || 0}%`;
  };

  const renderHeroSideList = () => {
    const picks = (state.summary?.featuredEvents || []).slice(0, 3);

    if (!picks.length) {
      heroSideList.innerHTML = '<div class="meta">Featured insights will appear as events are added.</div>';
      return;
    }

    heroSideList.innerHTML = `
      <div class="section-title mb-1">Trending right now</div>
      ${picks.map((event) => `
        <div class="item">
          <div>
            <div class="title">${App.escapeHtml(App.truncateText(event.title, 34))}</div>
            <div class="meta">${App.formatDate(event.date)} · ${App.escapeHtml(App.getEventCategory(event))}</div>
          </div>
          <span class="badge badge-soft">${event.availableSeats}</span>
        </div>
      `).join('')}
    `;
  };

  const renderCategories = () => {
    const counts = getCategoryCounts();

    categoryRail.innerHTML = categoryOrder.map((category) => `
      <button type="button" class="chip-filter ${state.category === category ? 'active' : ''}" data-category="${category}">
        ${category}
        <span class="badge badge-soft ms-2">${counts[category] || 0}</span>
      </button>
    `).join('');
  };

  const renderCards = (events, featured = false) => {
    if (!events.length) {
      return `
        <div class="col-12">
          <div class="panel-card text-center py-5">
            <h4 class="mb-2">No events found</h4>
            <p class="text-muted mb-0">Try another search term or category, or check back after new events are published.</p>
          </div>
        </div>
      `;
    }

    return events.map((event) => {
      const category = App.getEventCategory(event);
      const occupancy = App.getOccupancyPercent(event);
      const soldOut = event.availableSeats <= 0;
      const imageMarkup = event.image
        ? `<img src="${event.image}" class="event-image" alt="${App.escapeHtml(event.title)}">`
        : `<div class="event-image event-fallback">${App.escapeHtml(event.title.charAt(0).toUpperCase())}</div>`;

      return `
        <div class="col-md-6 ${featured ? 'col-xl-3' : 'col-xl-4'}">
          <div class="event-card h-100 ${featured ? 'event-card--featured' : ''}">
            <div class="position-relative">
              ${imageMarkup}
              <div class="position-absolute top-0 start-0 p-3 w-100 d-flex justify-content-between align-items-start gap-2">
                <span class="badge badge-warm">${category}</span>
                <span class="badge ${soldOut ? 'text-bg-danger' : 'badge-soft'}">${soldOut ? 'Sold out' : `${event.availableSeats} seats left`}</span>
              </div>
            </div>
            <div class="p-4">
              <div class="event-meta mb-2">${App.formatDateTime(event.date)} · ${App.escapeHtml(event.location)}</div>
              <h5 class="fw-bold mb-2">${App.escapeHtml(event.title)}</h5>
              <p class="text-muted mb-3">${App.truncateText(event.description, featured ? 110 : 140)}</p>
              <div class="progress-track mb-3">
                <div class="progress-bar-soft" style="width:${occupancy}%"></div>
              </div>
              <div class="d-flex justify-content-between small text-muted mb-3">
                <span>${occupancy}% booked</span>
                <span>${event.totalSeats} total seats</span>
              </div>
              <div class="d-flex gap-2">
                <a href="event.html?id=${event._id}" class="btn btn-outline-brand btn-sm flex-fill">View details</a>
                <a href="book.html?id=${event._id}" class="btn btn-brand btn-sm flex-fill ${soldOut ? 'disabled' : ''}">${soldOut ? 'Sold out' : 'Book ticket'}</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderViews = () => {
    const filtered = sortEvents(state.events.filter(matchesState));
    const featuredEvents = filtered.slice(0, 4);

    featuredGrid.innerHTML = renderCards(featuredEvents, true);
    eventsGrid.innerHTML = renderCards(filtered, false);
    resultsMeta.textContent = `${filtered.length} matching events`;
    listMeta.textContent = `${state.events.length} events in the catalog`;
  };

  const loadData = async () => {
    try {
      App.clearMessage(status);
      featuredGrid.innerHTML = '<div class="col-12"><div class="panel-card text-center py-5">Loading events...</div></div>';
      eventsGrid.innerHTML = '';

      const [summaryResponse, eventsResponse] = await Promise.all([
        App.apiRequest('/events/summary'),
        App.apiRequest('/events')
      ]);

      state.summary = summaryResponse.summary || null;
      state.events = eventsResponse.events || [];

      renderHeroStats();
      renderNextEvent();
      renderHeroSideList();
      renderCategories();
      renderViews();
    } catch (error) {
      featuredGrid.innerHTML = '';
      eventsGrid.innerHTML = '';
      App.showMessage(status, error.message);
    }
  };

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.search = searchInput.value.trim();
    renderViews();
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    renderViews();
  });

  categoryRail.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) {
      return;
    }

    state.category = button.getAttribute('data-category');
    renderCategories();
    renderViews();
  });

  loadData();
});
