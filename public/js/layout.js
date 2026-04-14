(function () {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const user = window.App.getUser();
  const isAdmin = user?.role === 'admin';
  const isLoggedIn = window.App.isLoggedIn();

  if (header) {
    header.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
        <div class="container py-2">
          <a class="navbar-brand d-flex align-items-center gap-2" href="index.html">
            <span class="brand-mark">S</span>
            <span>Smart Event Booking</span>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="mainNav">
            <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1 mt-3 mt-lg-0">
              <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
              <li class="nav-item"><a class="nav-link" href="index.html#browseSection">Browse</a></li>
              <li class="nav-item"><a class="nav-link" href="categories.html">Categories</a></li>
              ${isLoggedIn && !isAdmin ? '<li class="nav-item"><a class="nav-link" href="bookings.html">My Bookings</a></li>' : ''}
              ${isAdmin ? '<li class="nav-item"><a class="nav-link" href="admin.html">Admin Dashboard</a></li><li class="nav-item"><a class="nav-link" href="create-event.html">Create Event</a></li>' : ''}
              ${!isLoggedIn ? '<li class="nav-item"><a class="nav-link" href="login.html">Login</a></li><li class="nav-item"><a class="nav-link" href="register.html">Register</a></li><li class="nav-item"><a class="nav-link" href="admin-login.html">Admin Login</a></li>' : ''}
              ${isLoggedIn ? `<li class="nav-item ms-lg-2"><span class="nav-link text-info">${window.App.escapeHtml(user?.name || 'User')}</span></li><li class="nav-item"><button id="logoutBtn" class="btn btn-outline-light btn-sm">Logout</button></li>` : ''}
            </ul>
          </div>
        </div>
      </nav>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <div class="footer-panel mt-5">
        <div class="container py-4 py-lg-5">
          <div class="row g-4 align-items-start">
            <div class="col-lg-5">
              <div class="brand-mark mb-3">S</div>
              <div class="fw-bold text-white fs-5 mb-2">Smart Event Management and Ticket Booking System</div>
              <div class="small">Professional event discovery, secure booking, live seat tracking, and admin operations in one platform.</div>
            </div>
            <div class="col-lg-3">
              <div class="card-label mb-2">Quick Links</div>
              <div class="d-grid gap-2 small">
                <a href="index.html#browseSection">Browse events</a>
                <a href="categories.html">Categories</a>
                <a href="register.html">Register account</a>
                <a href="login.html">User login</a>
                <a href="admin-login.html">Admin login</a>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card-label mb-2">Platform Snapshot</div>
              <div class="d-grid gap-2">
                <span class="summary-pill justify-content-between"><span>Event booking</span><strong>Live</strong></span>
                <span class="summary-pill justify-content-between"><span>Seat tracking</span><strong>Dynamic</strong></span>
                <span class="summary-pill justify-content-between"><span>Ticket IDs</span><strong>Unique</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'logoutBtn') {
      window.App.clearSession();
      window.location.href = 'index.html';
    }
  });
})();
