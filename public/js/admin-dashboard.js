document.addEventListener('DOMContentLoaded', async () => {
  if (!App.requireAdmin()) {
    return;
  }

  const statsContainer = document.getElementById('statsGrid');
  const highlightsContainer = document.getElementById('adminHighlights');
  const reportTableBody = document.getElementById('monthlyReportTableBody');
  const downloadMonthlyCsvBtn = document.getElementById('downloadMonthlyCsvBtn');
  const eventsContainer = document.getElementById('eventsTableBody');
  const bookingsContainer = document.getElementById('bookingsTableBody');
  const status = document.getElementById('adminStatus');
  const chartCanvas = document.getElementById('monthlyBookingsChart');
  let chartInstance = null;

  const renderEventStatus = (event) => {
    if (event.availableSeats <= 0) {
      return '<span class="badge text-bg-danger">Sold out</span>';
    }

    if (App.getOccupancyPercent(event) >= 75) {
      return '<span class="badge badge-warm">Selling fast</span>';
    }

    return '<span class="badge badge-soft">Open</span>';
  };

  const renderMonthlyChart = (report) => {
    if (!window.Chart || !chartCanvas) {
      return;
    }

    const labels = report.map((row) => row.label);
    const bookingValues = report.map((row) => row.bookingsCount);
    const seatValues = report.map((row) => row.seatsBooked);

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new window.Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Bookings',
            data: bookingValues,
            backgroundColor: 'rgba(24, 176, 138, 0.65)',
            borderRadius: 8
          },
          {
            label: 'Seats Booked',
            data: seatValues,
            type: 'line',
            borderColor: 'rgba(213, 171, 87, 0.95)',
            backgroundColor: 'rgba(213, 171, 87, 0.2)',
            fill: true,
            tension: 0.35,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#dbe7f4'
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9eafc4' },
            grid: { color: 'rgba(255,255,255,0.06)' }
          },
          y: {
            ticks: { color: '#9eafc4' },
            grid: { color: 'rgba(255,255,255,0.06)' },
            beginAtZero: true
          }
        }
      }
    });
  };

  const loadDashboard = async () => {
    App.clearMessage(status);

    const [dashboardData, summaryData, monthlyData, eventsData, bookingsData] = await Promise.all([
      App.apiRequest('/admin/dashboard'),
      App.apiRequest('/events/summary'),
      App.apiRequest('/admin/reports/monthly'),
      App.apiRequest('/events'),
      App.apiRequest('/bookings/all')
    ]);

    const stats = dashboardData.stats || {};
    const eventSummary = summaryData.summary || {};
    const report = monthlyData.report || [];
    const events = (eventsData.events || []).map((event) => ({
      ...event,
      category: App.getEventCategory(event),
      occupancy: App.getOccupancyPercent(event)
    }));
    const bookings = bookingsData.bookings || [];

    const topEvent = [...events].sort((left, right) => right.occupancy - left.occupancy)[0] || null;
    const recentBooking = bookings[0] || null;
    const soldOutEvents = events.filter((event) => event.availableSeats <= 0).length;
    const highOccupancyEvents = events.filter((event) => event.occupancy >= 75).length;
    const thisMonth = report[report.length - 1] || { bookingsCount: 0, seatsBooked: 0 };

    statsContainer.innerHTML = `
      <div class="col-md-4 col-xl-2"><div class="stat-card"><div class="label">Total Events</div><div class="value">${stats.totalEvents || 0}</div></div></div>
      <div class="col-md-4 col-xl-2"><div class="stat-card"><div class="label">Total Bookings</div><div class="value">${stats.totalBookings || 0}</div></div></div>
      <div class="col-md-4 col-xl-2"><div class="stat-card"><div class="label">Available Seats</div><div class="value">${App.formatCompactNumber(stats.availableSeats || 0)}</div></div></div>
      <div class="col-md-4 col-xl-2"><div class="stat-card"><div class="label">Occupancy Rate</div><div class="value">${eventSummary.occupancyRate || 0}%</div></div></div>
      <div class="col-md-4 col-xl-2"><div class="stat-card"><div class="label">High Demand</div><div class="value">${highOccupancyEvents}</div></div></div>
      <div class="col-md-4 col-xl-2"><div class="stat-card"><div class="label">Sold Out</div><div class="value">${soldOutEvents}</div></div></div>
    `;

    highlightsContainer.innerHTML = `
      <div class="col-lg-4">
        <div class="feature-card">
          <div class="section-title mb-2">Top event</div>
          <h4 class="fw-bold mb-2">${topEvent ? App.escapeHtml(topEvent.title) : 'No events yet'}</h4>
          <p class="mb-3">${topEvent ? App.truncateText(topEvent.description, 140) : 'Create events to populate this overview.'}</p>
          ${topEvent ? `<div class="progress-track mb-3"><div class="progress-bar-soft" style="width:${topEvent.occupancy}%"></div></div><div class="d-flex justify-content-between small text-muted mb-3"><span>${topEvent.occupancy}% booked</span><span>${topEvent.availableSeats} seats left</span></div>` : ''}
        </div>
      </div>
      <div class="col-lg-4">
        <div class="feature-card">
          <div class="section-title mb-2">Recent booking</div>
          <h4 class="fw-bold mb-2">${recentBooking ? App.escapeHtml(recentBooking.ticketId) : 'No bookings yet'}</h4>
          <p class="mb-3">${recentBooking ? `${App.escapeHtml(recentBooking.userId?.name || '')} booked ${recentBooking.seatsBooked} seat(s) for ${App.escapeHtml(recentBooking.eventId?.title || '')}.` : 'Bookings will appear here once users start reserving seats.'}</p>
          ${recentBooking ? `<div class="summary-pill">${App.formatDateTime(recentBooking.bookingDate)}</div>` : ''}
        </div>
      </div>
      <div class="col-lg-4">
        <div class="feature-card">
          <div class="section-title mb-2">This month</div>
          <div class="d-grid gap-2 mt-3">
            <span class="summary-pill justify-content-between"><span>Bookings</span><strong>${thisMonth.bookingsCount || 0}</strong></span>
            <span class="summary-pill justify-content-between"><span>Seats booked</span><strong>${thisMonth.seatsBooked || 0}</strong></span>
            <span class="summary-pill justify-content-between"><span>Upcoming events</span><strong>${eventSummary.upcomingEvents || 0}</strong></span>
          </div>
        </div>
      </div>
    `;

    reportTableBody.innerHTML = report.slice().reverse().map((row) => `
      <tr>
        <td>${row.label}</td>
        <td>${row.bookingsCount}</td>
        <td>${row.seatsBooked}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" class="text-center text-muted py-4">No report data</td></tr>';

    renderMonthlyChart(report);

    eventsContainer.innerHTML = events.map((event) => `
      <tr>
        <td><div class="fw-semibold">${App.escapeHtml(event.title)}</div><div class="small text-muted">${App.escapeHtml(event.category)}</div></td>
        <td>${App.formatDate(event.date)}</td>
        <td>${App.escapeHtml(event.location)}</td>
        <td><div class="d-flex flex-column gap-1"><span>${event.availableSeats}/${event.totalSeats}</span><div class="progress-track" style="height: 7px;"><div class="progress-bar-soft" style="width:${event.occupancy}%"></div></div></div></td>
        <td>${renderEventStatus(event)}</td>
        <td><a class="btn btn-sm btn-outline-brand me-2" href="create-event.html?id=${event._id}">Edit</a><button class="btn btn-sm btn-outline-danger" data-delete-event="${event._id}">Delete</button></td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No events available</td></tr>';

    bookingsContainer.innerHTML = bookings.map((booking) => {
      const event = booking.eventId || {};
      const user = booking.userId || {};
      return `
        <tr>
          <td>${App.escapeHtml(booking.ticketId)}</td>
          <td>${App.escapeHtml(user.name || '')}</td>
          <td>${App.escapeHtml(event.title || '')}</td>
          <td>${booking.seatsBooked}</td>
          <td>${App.formatDateTime(booking.bookingDate)}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" data-admin-cancel-booking="${booking._id}">Cancel</button>
          </td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No bookings yet</td></tr>';
  };

  if (downloadMonthlyCsvBtn) {
    downloadMonthlyCsvBtn.addEventListener('click', async () => {
      try {
        await App.downloadFile('/admin/reports/monthly.csv', `monthly-report-${Date.now()}.csv`);
      } catch (error) {
        App.showMessage(status, error.message);
      }
    });
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-event]');
    const bookingButton = event.target.closest('[data-admin-cancel-booking]');

    if (button) {
      const eventId = button.getAttribute('data-delete-event');
      const confirmed = window.confirm('Delete this event? This will remove associated bookings too.');
      if (!confirmed) {
        return;
      }

      try {
        await App.apiRequest(`/events/${eventId}`, { method: 'DELETE' });
        await loadDashboard();
      } catch (error) {
        App.showMessage(status, error.message);
      }
      return;
    }

    if (bookingButton) {
      const bookingId = bookingButton.getAttribute('data-admin-cancel-booking');
      const confirmed = window.confirm('Cancel this booking and release its seats?');
      if (!confirmed) {
        return;
      }

      try {
        await App.apiRequest(`/bookings/${bookingId}`, { method: 'DELETE' });
        await loadDashboard();
      } catch (error) {
        App.showMessage(status, error.message);
      }
    }
  });

  try {
    await loadDashboard();
  } catch (error) {
    App.showMessage(status, error.message);
  }
});
