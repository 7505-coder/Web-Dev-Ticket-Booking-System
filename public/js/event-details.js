document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  const container = document.getElementById('eventDetails');
  const status = document.getElementById('detailsStatus');

  if (!eventId) {
    App.showMessage(status, 'Missing event id in the URL.');
    return;
  }

  try {
    const data = await App.apiRequest(`/events/${eventId}`);
    const event = data.event;

    const imageMarkup = event.image
      ? `<img src="${event.image}" class="img-fluid event-image rounded-5 w-100" alt="${App.escapeHtml(event.title)}">`
      : `<div class="event-image event-fallback rounded-5">${App.escapeHtml(event.title.charAt(0).toUpperCase())}</div>`;

    container.innerHTML = `
      <div class="row g-4 align-items-center">
        <div class="col-lg-6">${imageMarkup}</div>
        <div class="col-lg-6">
          <span class="section-kicker mb-3">Event Details</span>
          <h1 class="fw-bold mb-3">${App.escapeHtml(event.title)}</h1>
          <p class="hero-copy mb-4">${App.escapeHtml(event.description)}</p>
          <div class="d-flex flex-wrap gap-2 mb-4">
            <span class="badge badge-soft">${App.formatDate(event.date)}</span>
            <span class="badge badge-warm">${event.availableSeats} / ${event.totalSeats} seats</span>
            <span class="badge text-bg-dark">${App.escapeHtml(event.location)}</span>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <a href="book.html?id=${event._id}" class="btn btn-brand btn-lg">Book Tickets</a>
            <a href="index.html" class="btn btn-outline-brand btn-lg">Back to Events</a>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    App.showMessage(status, error.message);
  }
});
