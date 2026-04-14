document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const status = document.getElementById('registerStatus');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    App.clearMessage(status);

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
      App.showMessage(status, 'All fields are required.');
      return;
    }

    if (password.length < 6) {
      App.showMessage(status, 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      App.showMessage(status, 'Passwords do not match.');
      return;
    }

    try {
      const data = await App.apiRequest('/auth/register', {
        method: 'POST',
        body: { name, email, password }
      });

      App.setSession(data.user, data.token);
      window.location.href = 'index.html';
    } catch (error) {
      App.showMessage(status, error.message);
    }
  });
});
