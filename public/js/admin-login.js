document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminLoginForm');
  const status = document.getElementById('adminLoginStatus');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    App.clearMessage(status);

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      App.showMessage(status, 'Please enter both email and password.');
      return;
    }

    try {
      const data = await App.apiRequest('/auth/admin-login', {
        method: 'POST',
        body: { email, password }
      });

      App.setSession(data.user, data.token);
      window.location.href = 'admin.html';
    } catch (error) {
      App.showMessage(status, error.message);
    }
  });
});
