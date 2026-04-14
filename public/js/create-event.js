document.addEventListener('DOMContentLoaded', async () => {
  if (!App.requireAdmin()) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  const form = document.getElementById('eventForm');
  const status = document.getElementById('eventStatus');
  const pageTitle = document.getElementById('eventPageTitle');
  const submitButton = document.getElementById('eventSubmitBtn');
  const imagePreview = document.getElementById('imagePreview');

  if (eventId) {
    pageTitle.textContent = 'Edit Event';
    submitButton.textContent = 'Update Event';

    try {
      const data = await App.apiRequest(`/events/${eventId}`);
      const event = data.event;

      document.getElementById('title').value = event.title;
      document.getElementById('description').value = event.description;
      document.getElementById('date').value = new Date(event.date).toISOString().slice(0, 16);
      document.getElementById('location').value = event.location;
      document.getElementById('totalSeats').value = event.totalSeats;

      if (event.image) {
        imagePreview.innerHTML = `<img src="${event.image}" alt="${App.escapeHtml(event.title)}" class="img-fluid rounded-4 mt-3">`;
      }
    } catch (error) {
      App.showMessage(status, error.message);
    }
  }

  document.getElementById('image').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.innerHTML = `<img src="${reader.result}" alt="Preview" class="img-fluid rounded-4 mt-3">`;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    App.clearMessage(status);

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const dateValue = document.getElementById('date').value;
    const location = document.getElementById('location').value.trim();
    const totalSeats = document.getElementById('totalSeats').value;
    const imageInput = document.getElementById('image');

    if (!title || !description || !dateValue || !location || !totalSeats) {
      App.showMessage(status, 'Please complete all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', dateValue);
    formData.append('location', location);
    formData.append('totalSeats', totalSeats);

    if (imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }

    try {
      await App.apiRequest(eventId ? `/events/${eventId}` : '/events', {
        method: eventId ? 'PUT' : 'POST',
        body: formData
      });

      window.location.href = 'admin.html';
    } catch (error) {
      App.showMessage(status, error.message);
    }
  });
});
