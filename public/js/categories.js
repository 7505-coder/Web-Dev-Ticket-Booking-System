document.addEventListener('DOMContentLoaded', async () => {
  const categoriesGrid = document.getElementById('categoriesGrid');
  const featuredInner = document.getElementById('featuredCarouselInner');
  const featuredStatus = document.getElementById('featuredStatus');

  try {
    const [eventsRes, summaryRes] = await Promise.all([
      App.apiRequest('/events'),
      App.apiRequest('/events/summary')
    ]);

    const events = eventsRes.events || [];
    const featuredEvents = summaryRes.summary?.featuredEvents || events.slice(0, 4);

    if (!featuredEvents.length) {
      featuredInner.innerHTML = '<div class="carousel-item active"><div class="feature-card"><h4 class="mb-2">No featured events yet</h4><p class="text-muted mb-0">Featured events will appear after catalog grows.</p></div></div>';
    } else {
      featuredInner.innerHTML = featuredEvents.map((event, index) => {
        const imageMarkup = event.image
          ? `<img src="${event.image}" class="d-block w-100 event-image" alt="${App.escapeHtml(event.title)}">`
          : `<div class="event-image event-fallback">${App.escapeHtml(event.title.charAt(0).toUpperCase())}</div>`;

        return `
          <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <div class="feature-card p-0 overflow-hidden">
              ${imageMarkup}
              <div class="p-4">
                <div class="d-flex flex-wrap gap-2 mb-2">
                  <span class="badge badge-soft">${App.getEventCategory(event)}</span>
                  <span class="badge badge-warm">${App.formatDate(event.date)}</span>
                </div>
                <h4 class="fw-bold mb-2">${App.escapeHtml(event.title)}</h4>
                <p class="text-muted mb-3">${App.truncateText(event.description, 140)}</p>
                <div class="d-flex gap-2">
                  <a href="event.html?id=${event._id}" class="btn btn-outline-brand btn-sm">Details</a>
                  <a href="book.html?id=${event._id}" class="btn btn-brand btn-sm ${event.availableSeats <= 0 ? 'disabled' : ''}">${event.availableSeats <= 0 ? 'Sold out' : 'Book now'}</a>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    const categoryMap = events.reduce((accumulator, event) => {
      const category = App.getEventCategory(event);
      if (!accumulator[category]) {
        accumulator[category] = [];
      }
      accumulator[category].push(event);
      return accumulator;
    }, {});

    const orderedCategories = Object.keys(categoryMap).sort((left, right) => categoryMap[right].length - categoryMap[left].length);

    categoriesGrid.innerHTML = orderedCategories.map((category) => {
      const categoryEvents = categoryMap[category];
      const nextEvent = categoryEvents.sort((left, right) => new Date(left.date) - new Date(right.date))[0];

      return `
        <div class="col-md-6 col-xl-4">
          <div class="feature-card h-100">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="fw-bold mb-0">${App.escapeHtml(category)}</h5>
              <span class="badge badge-soft">${categoryEvents.length}</span>
            </div>
            <p class="text-muted mb-3">Next: ${nextEvent ? App.escapeHtml(nextEvent.title) : 'No upcoming event'}</p>
            <div class="summary-pill justify-content-between mb-3">
              <span>Nearest date</span>
              <strong>${nextEvent ? App.formatDate(nextEvent.date) : 'TBA'}</strong>
            </div>
            <div class="d-grid gap-2">
              ${categoryEvents.slice(0, 3).map((event) => `
                <a href="event.html?id=${event._id}" class="summary-pill justify-content-between text-decoration-none">
                  <span>${App.escapeHtml(App.truncateText(event.title, 32))}</span>
                  <strong>${event.availableSeats}</strong>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('') || '<div class="col-12"><div class="panel-card text-center py-5"><h4 class="mb-2">No categories available</h4><p class="text-muted mb-0">Add events to start generating category insights.</p></div></div>';
  } catch (error) {
    App.showMessage(featuredStatus, error.message);
  }
});
