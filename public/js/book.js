document.addEventListener('DOMContentLoaded', async () => {
  if (!App.requireAuth()) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  const summary = document.getElementById('bookingSummary');
  const form = document.getElementById('bookingForm');
  const status = document.getElementById('bookingStatus');
  const seatSelect = document.getElementById('seatsBooked');
  const submitButton = form.querySelector('button[type="submit"]');

  if (!eventId) {
    App.showMessage(status, 'Missing event id in the URL.');
    return;
  }

  try {
    const data = await App.apiRequest(`/events/${eventId}`);
    const event = data.event;
    const category = App.getEventCategory(event);
    const occupancy = App.getOccupancyPercent(event);
    const soldOut = event.availableSeats <= 0;
    const imageMarkup = event.image
      ? `<img src="${event.image}" class="img-fluid event-image rounded-5 w-100" alt="${App.escapeHtml(event.title)}">`
      : `<div class="event-image event-fallback rounded-5">${App.escapeHtml(event.title.charAt(0).toUpperCase())}</div>`;

    summary.innerHTML = `
      <div class="booking-ticket mb-3">
        <div class="section-title mb-2">Booking summary</div>
        ${imageMarkup}
        <div class="d-flex flex-wrap gap-2 mt-3 mb-3">
          <span class="badge badge-soft">${category}</span>
          <span class="badge badge-warm">${App.formatDate(event.date)}</span>
        </div>
        <h3 class="fw-bold mb-2">${App.escapeHtml(event.title)}</h3>
        <p class="mb-3 text-muted">${App.escapeHtml(event.location)}</p>
        <p class="text-muted mb-3">${App.truncateText(event.description, 150)}</p>
        <div class="progress-track mb-3">
          <div class="progress-bar-soft" style="width:${occupancy}%"></div>
        </div>
        <div class="d-flex justify-content-between small text-muted mb-3">
          <span>${occupancy}% booked</span>
          <span>${event.availableSeats} seats left</span>
        </div>
        <div class="row g-2">
          <div class="col-6">
            <div class="mini-stat">
              <div class="label">Total seats</div>
              <div class="value">${event.totalSeats}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="mini-stat">
              <div class="label">Available</div>
              <div class="value">${event.availableSeats}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (soldOut) {
      seatSelect.innerHTML = '<option value="">Sold out</option>';
      seatSelect.disabled = true;
      submitButton.disabled = true;
      App.showMessage(status, 'This event is sold out.');
      return;
    }

    seatSelect.innerHTML = Array.from({ length: event.availableSeats }, (_, index) => {
      const seatCount = index + 1;
      return `<option value="${seatCount}">${seatCount} seat${seatCount > 1 ? 's' : ''}</option>`;
    }).join('');
  } catch (error) {
    App.showMessage(status, error.message);
    submitButton.disabled = true;
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    App.clearMessage(status);

    const seatsBooked = Number(seatSelect.value);

    if (!Number.isInteger(seatsBooked) || seatsBooked < 1) {
      App.showMessage(status, 'Please select a valid number of seats.');
      return;
    }

    try {
      const data = await App.apiRequest('/bookings', {
        method: 'POST',
        body: { eventId, seatsBooked }
      });

      status.innerHTML = `
        <div class="alert alert-success booking-ticket">
          <div class="fw-bold mb-1">Booking confirmed</div>
          <div>Your ticket ID is <strong>${App.escapeHtml(data.booking.ticketId)}</strong>.</div>
          <div class="small mt-2">You can view this booking in My Bookings.</div>
        </div>
      `;
      window.location.href = 'bookings.html';
    } catch (error) {
      App.showMessage(status, error.message);
    }
  });
});
