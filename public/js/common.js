window.App = window.App || {};

(function (app) {
  app.getToken = function () {
    return localStorage.getItem('sem-token');
  };

  app.getUser = function () {
    try {
      return JSON.parse(localStorage.getItem('sem-user') || 'null');
    } catch (error) {
      return null;
    }
  };

  app.setSession = function (user, token) {
    localStorage.setItem('sem-user', JSON.stringify(user));
    localStorage.setItem('sem-token', token);
  };

  app.clearSession = function () {
    localStorage.removeItem('sem-user');
    localStorage.removeItem('sem-token');
  };

  app.isLoggedIn = function () {
    return Boolean(app.getToken());
  };

  app.isAdmin = function () {
    return app.getUser()?.role === 'admin';
  };

  app.escapeHtml = function (value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  app.formatDate = function (value) {
    if (!value) {
      return 'TBA';
    }

    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  app.formatDateTime = function (value) {
    if (!value) {
      return 'TBA';
    }

    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  app.truncateText = function (value, limit = 120) {
    const text = String(value || '');
    if (text.length <= limit) {
      return text;
    }

    return `${text.slice(0, limit).trimEnd()}...`;
  };

  app.getEventCategory = function (event) {
    const text = `${event?.title || ''} ${event?.description || ''}`.toLowerCase();

    if (/(tech|ai|developer|startup|innovation|product|software)/.test(text)) return 'Technology';
    if (/(music|concert|festival|dj|band|show)/.test(text)) return 'Music';
    if (/(workshop|training|class|hands-on|bootcamp|learn)/.test(text)) return 'Workshop';
    if (/(business|summit|conference|leadership|network)/.test(text)) return 'Business';
    if (/(community|charity|family|social|local)/.test(text)) return 'Community';
    if (/(sport|fitness|run|game|match|tournament)/.test(text)) return 'Sports';
    return 'Experience';
  };

  app.getOccupancyPercent = function (event) {
    if (!event || !event.totalSeats) {
      return 0;
    }

    const bookedSeats = Math.max((event.totalSeats || 0) - (event.availableSeats || 0), 0);
    return Math.round((bookedSeats / event.totalSeats) * 100);
  };

  app.formatCompactNumber = function (value) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value || 0);
  };

  app.downloadFile = async function (path, fileName) {
    const token = app.getToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api${path}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = 'Download failed';

      if (raw) {
        try {
          const data = JSON.parse(raw);
          message = data.message || message;
        } catch (error) {
          message = raw;
        }
      }

      throw new Error(message);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  app.apiRequest = async function (path, options = {}) {
    const token = app.getToken();
    const headers = { ...(options.headers || {}) };
    const requestOptions = {
      method: options.method || 'GET',
      headers
    };

    if (token) {
      requestOptions.headers.Authorization = `Bearer ${token}`;
    }

    if (options.body instanceof FormData) {
      requestOptions.body = options.body;
    } else if (options.body !== undefined) {
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(`/api${path}`, requestOptions);
    const raw = await response.text();
    let data = {};

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (error) {
        data = { message: raw };
      }
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  };

  app.showMessage = function (container, message, type = 'danger') {
    if (!container) {
      return;
    }

    container.innerHTML = `<div class="alert alert-${type} mb-0" role="alert">${app.escapeHtml(message)}</div>`;
  };

  app.clearMessage = function (container) {
    if (container) {
      container.innerHTML = '';
    }
  };

  app.requireAuth = function (redirectUrl = 'login.html') {
    if (!app.isLoggedIn()) {
      window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return false;
    }

    return true;
  };

  app.requireAdmin = function (redirectUrl = 'admin-login.html') {
    if (!app.isLoggedIn() || !app.isAdmin()) {
      window.location.href = redirectUrl;
      return false;
    }

    return true;
  };
})(window.App);
