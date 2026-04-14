document.addEventListener('DOMContentLoaded', async () => {
  if (!App.requireAuth()) {
    return;
  }

  const container = document.getElementById('bookingsList');
  const status = document.getElementById('bookingsStatus');
  const summaryContainer = document.getElementById('bookingsSummary');
  const searchInput = document.getElementById('bookingSearchInput');
  const searchBtn = document.getElementById('bookingSearchBtn');
  const resetBtn = document.getElementById('bookingResetBtn');

  const state = {
    bookings: [],
    search: ''
  };

  const renderSummary = () => {
    const totalBookings = state.bookings.length;
    const totalSeats = state.bookings.reduce((sum, booking) => sum + (booking.seatsBooked || 0), 0);
    const latestBooking = state.bookings[0];
    const latestEvent = latestBooking?.eventId;

    summaryContainer.innerHTML = `
      <div class="col-md-4">
        <div class="stat-card">
          <div class="label">Total bookings</div>
          <div class="value">${totalBookings}</div>
          <p class="small-muted mb-0">Tickets in your history</p>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="label">Seats reserved</div>
          <div class="value">${totalSeats}</div>
          <p class="small-muted mb-0">Combined seat count</p>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="label">Latest booking</div>
          <div class="value">${latestBooking ? App.escapeHtml(latestBooking.ticketId) : 'None'}</div>
          <p class="small-muted mb-0">${latestEvent ? App.escapeHtml(latestEvent.title || '') : 'Book an event to get started'}</p>
        </div>
      </div>
    `;
  };

  const matchesSearch = (booking) => {
    if (!state.search) {
      return true;
    }

    const event = booking.eventId || {};
    const searchText = `${booking.ticketId} ${booking.seatsBooked} ${event.title || ''} ${event.location || ''}`.toLowerCase();
    return searchText.includes(state.search.toLowerCase());
  };

  const renderBookings = () => {
    const filtered = state.bookings.filter(matchesSearch);

    if (!filtered.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="panel-card text-center py-5">
            <h4 class="mb-2">No bookings found</h4>
            <p class="text-muted mb-4">Try another search term or book a new event.</p>
            <a href="index.html" class="btn btn-brand">Browse Events</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((booking) => {
      const event = booking.eventId || {};
      const category = App.getEventCategory(event);
      const imageMarkup = event.image
        ? `<img src="${event.image}" class="event-image" alt="${App.escapeHtml(event.title || 'Event')}">`
        : `<div class="event-image event-fallback">${App.escapeHtml((event.title || 'E').charAt(0).toUpperCase())}</div>`;

      return `
        <div class="col-lg-6">
          <div class="event-card h-100">
            ${imageMarkup}
            <div class="p-4">
              <div class="d-flex justify-content-between gap-2 flex-wrap mb-3">
                <span class="badge badge-soft">Ticket ${App.escapeHtml(booking.ticketId)}</span>
                <span class="badge badge-warm">${booking.seatsBooked} seat${booking.seatsBooked > 1 ? 's' : ''}</span>
              </div>
              <h5 class="fw-bold mb-2">${App.escapeHtml(event.title || 'Event')}</h5>
              <p class="text-muted mb-2">${App.escapeHtml(event.location || '')}</p>
              <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="badge text-bg-dark">${category}</span>
                <span class="badge badge-soft">${App.formatDate(event.date)}</span>
              </div>
              <div class="small-muted mb-3">Booked on: ${App.formatDateTime(booking.bookingDate)}</div>
              <div class="d-flex gap-2">
                <a href="event.html?id=${event._id}" class="btn btn-outline-brand btn-sm flex-fill">View event</a>
                <button class="btn btn-outline-light btn-sm flex-fill" data-download-ticket="${booking._id}" data-ticket-id="${App.escapeHtml(booking.ticketId)}">Ticket PDF</button>
                <button class="btn btn-outline-danger btn-sm flex-fill" data-cancel-booking="${booking._id}">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const loadBookings = async () => {
    try {
      App.clearMessage(status);
      container.innerHTML = '<div class="col-12"><div class="panel-card text-center py-5">Loading bookings...</div></div>';

      const data = await App.apiRequest('/bookings/me');
      state.bookings = data.bookings || [];
      renderSummary();
      renderBookings();
    } catch (error) {
      App.showMessage(status, error.message);
    }
  };

  const applySearch = () => {
    state.search = searchInput.value.trim();
    renderBookings();
  };

  searchBtn.addEventListener('click', applySearch);
  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.search = '';
    renderBookings();
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applySearch();
    }
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-cancel-booking]');
    const downloadButton = event.target.closest('[data-download-ticket]');

    if (downloadButton) {
      const bookingId = downloadButton.getAttribute('data-download-ticket');
      const ticketId = downloadButton.getAttribute('data-ticket-id') || 'ticket';

      try {
        await App.downloadFile(`/bookings/${bookingId}/ticket`, `${ticketId}.pdf`);
      } catch (error) {
        App.showMessage(status, error.message);
      }
      return;
    }

    if (!button) {
      return;
    }

    const bookingId = button.getAttribute('data-cancel-booking');
    const confirmed = window.confirm('Cancel this booking and release the seats?');
    if (!confirmed) {
      return;
    }

    try {
      await App.apiRequest(`/bookings/${bookingId}`, { method: 'DELETE' });
      await loadBookings();
    } catch (error) {
      App.showMessage(status, error.message);
    }
  });

  loadBookings();
});
