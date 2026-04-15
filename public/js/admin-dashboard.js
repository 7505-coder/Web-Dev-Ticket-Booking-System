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
  let chartLoaderPromise = null;
  let lastReportData = [];
  let usingCanvasFallback = false;

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  const ensureChartLibrary = async () => {
    if (window.Chart) {
      return true;
    }

    if (!chartLoaderPromise) {
      chartLoaderPromise = (async () => {
        const fallbackSources = [
          'https://unpkg.com/chart.js@4.4.7/dist/chart.umd.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.7/chart.umd.min.js'
        ];

        for (const source of fallbackSources) {
          try {
            await loadScript(source);
            if (window.Chart) {
              return true;
            }
          } catch (error) {
            // Try next fallback CDN.
          }
        }

        return false;
      })();
    }

    return chartLoaderPromise;
  };

  const getOrCreateChartFallback = () => {
    if (!chartCanvas || !chartCanvas.parentElement) {
      return null;
    }

    let fallback = document.getElementById('monthlyBookingsFallback');
    if (!fallback) {
      fallback = document.createElement('div');
      fallback.id = 'monthlyBookingsFallback';
      fallback.className = 'summary-pill mt-3';
      fallback.style.display = 'none';
      chartCanvas.parentElement.appendChild(fallback);
    }

    return fallback;
  };

  const showChartFallback = (message) => {
    const fallback = getOrCreateChartFallback();
    if (!fallback || !chartCanvas) {
      return;
    }

    chartCanvas.style.display = 'none';
    fallback.textContent = message;
    fallback.style.display = 'inline-flex';
  };

  const hideChartFallback = () => {
    const fallback = getOrCreateChartFallback();
    if (chartCanvas) {
      chartCanvas.style.display = 'block';
    }
    if (fallback) {
      fallback.style.display = 'none';
    }
  };

  const renderEventStatus = (event) => {
    if (event.availableSeats <= 0) {
      return '<span class="badge text-bg-danger">Sold out</span>';
    }

    if (App.getOccupancyPercent(event) >= 75) {
      return '<span class="badge badge-warm">Selling fast</span>';
    }

    return '<span class="badge badge-soft">Open</span>';
  };

  const renderCanvasFallbackChart = (report) => {
    if (!chartCanvas) {
      return false;
    }

    const context = chartCanvas.getContext('2d');
    if (!context) {
      return false;
    }

    const labels = report.map((row) => row.label);
    const bookingValues = report.map((row) => row.bookingsCount);
    const seatValues = report.map((row) => row.seatsBooked);
    const maxValue = Math.max(...bookingValues, ...seatValues, 1);

    const cssWidth = chartCanvas.clientWidth || chartCanvas.parentElement?.clientWidth || 760;
    const cssHeight = Math.max(chartCanvas.clientHeight || 220, 220);
    const pixelRatio = window.devicePixelRatio || 1;

    chartCanvas.width = Math.floor(cssWidth * pixelRatio);
    chartCanvas.height = Math.floor(cssHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);

    const plot = {
      left: 50,
      top: 24,
      right: cssWidth - 18,
      bottom: cssHeight - 40
    };
    plot.width = Math.max(plot.right - plot.left, 10);
    plot.height = Math.max(plot.bottom - plot.top, 10);

    context.fillStyle = '#4d3f31';
    context.font = '600 12px "Plus Jakarta Sans", sans-serif';
    context.fillText('Bookings', plot.left, 14);
    context.fillStyle = 'rgba(24, 176, 138, 0.8)';
    context.fillRect(plot.left + 58, 5, 12, 9);
    context.fillStyle = '#4d3f31';
    context.fillText('Seats Booked', plot.left + 82, 14);
    context.strokeStyle = 'rgba(213, 171, 87, 0.95)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(plot.left + 173, 10);
    context.lineTo(plot.left + 191, 10);
    context.stroke();

    for (let step = 0; step <= 4; step += 1) {
      const y = plot.top + (plot.height / 4) * step;
      const value = Math.round(maxValue * (1 - step / 4));
      context.strokeStyle = 'rgba(112, 84, 50, 0.12)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(plot.left, y);
      context.lineTo(plot.right, y);
      context.stroke();

      context.fillStyle = '#6a5a48';
      context.font = '11px "Plus Jakarta Sans", sans-serif';
      context.fillText(String(value), 10, y + 4);
    }

    context.strokeStyle = 'rgba(112, 84, 50, 0.2)';
    context.lineWidth = 1.25;
    context.beginPath();
    context.moveTo(plot.left, plot.bottom);
    context.lineTo(plot.right, plot.bottom);
    context.stroke();

    const count = labels.length;
    const slotWidth = plot.width / Math.max(count, 1);
    const barWidth = Math.max(Math.min(slotWidth * 0.5, 28), 8);
    const points = [];
    const showEveryLabel = slotWidth >= 42;

    labels.forEach((label, index) => {
      const centerX = plot.left + slotWidth * index + slotWidth / 2;
      const bookingHeight = (bookingValues[index] / maxValue) * plot.height;
      const barY = plot.bottom - bookingHeight;

      context.fillStyle = 'rgba(24, 176, 138, 0.7)';
      context.fillRect(centerX - barWidth / 2, barY, barWidth, bookingHeight);

      const seatY = plot.bottom - (seatValues[index] / maxValue) * plot.height;
      points.push({ x: centerX, y: seatY });

      if (showEveryLabel || index % 2 === 0 || index === count - 1 || index === 0) {
        context.fillStyle = '#6a5a48';
        context.font = '10.5px "Plus Jakarta Sans", sans-serif';
        context.textAlign = 'center';
        context.fillText(label, centerX, cssHeight - 10);
      }
    });

    context.textAlign = 'start';
    context.strokeStyle = 'rgba(213, 171, 87, 0.95)';
    context.lineWidth = 2;
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();

    context.fillStyle = 'rgba(213, 171, 87, 0.95)';
    points.forEach((point) => {
      context.beginPath();
      context.arc(point.x, point.y, 2.8, 0, Math.PI * 2);
      context.fill();
    });

    return true;
  };

  const renderMonthlyChart = async (report) => {
    if (!chartCanvas) {
      return;
    }

    const hasData = report.some((row) => row.bookingsCount > 0 || row.seatsBooked > 0);

    lastReportData = report;

    if (!hasData) {
      usingCanvasFallback = false;
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      showChartFallback('No booking trend yet. Create more bookings to populate this chart.');
      return;
    }

    if (!window.Chart) {
      showChartFallback('Loading chart library from backup source...');
      const loaded = await ensureChartLibrary();
      if (!loaded || !window.Chart) {
        const rendered = renderCanvasFallbackChart(report);
        if (rendered) {
          usingCanvasFallback = true;
          hideChartFallback();
        } else {
          usingCanvasFallback = false;
          showChartFallback('Unable to render chart in this browser.');
        }
        return;
      }
      usingCanvasFallback = false;
      hideChartFallback();
    }

    if (!window.Chart) {
      showChartFallback('Chart library failed to load from all CDNs. Please check internet/firewall settings.');
      return;
    }

    hideChartFallback();

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
              color: '#4d3f31'
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#6a5a48' },
            grid: { color: 'rgba(112, 84, 50, 0.12)' }
          },
          y: {
            ticks: { color: '#6a5a48' },
            grid: { color: 'rgba(112, 84, 50, 0.12)' },
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

    reportTableBody.innerHTML = report.map((row) => `
      <tr>
        <td>${row.label}</td>
        <td>${row.bookingsCount}</td>
        <td>${row.seatsBooked}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" class="text-center text-muted py-4">No report data</td></tr>';

    await renderMonthlyChart(report);

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

  window.addEventListener('resize', () => {
    if (usingCanvasFallback && lastReportData.length) {
      renderCanvasFallbackChart(lastReportData);
    }
  });

  try {
    await loadDashboard();
  } catch (error) {
    App.showMessage(status, error.message);
  }
});
