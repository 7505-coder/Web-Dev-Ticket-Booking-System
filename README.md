# Smart Event Management and Ticket Booking System

A full-stack event booking platform built with HTML, CSS, JavaScript, Bootstrap, Node.js, Express, and MongoDB.

This repository is prepared as a final-project quality implementation with role-based workflows, analytics, CSV/PDF exports, and submission-ready documentation.

## Features

- User registration and login
- Separate admin login
- Event browsing with search by title
- Featured events, category filters, and sorting on the homepage
- Dedicated categories page with featured event carousel
- Event detail pages
- Ticket booking with seat selection
- Unique ticket ID generation
- Booking cancellation for users
- Ticket PDF download for every booking
- Optional SMTP booking confirmation emails
- My bookings history
- Admin dashboard with totals, highlights, and monthly analytics chart
- Admin-side booking cancellation from dashboard
- Monthly report CSV export from dashboard
- Event create, edit, and delete
- Image/poster upload support
- Responsive Bootstrap UI
- REST API with authentication middleware
- Request validation middleware for core payloads

## UI Direction

The app uses a premium dark navy, emerald, and gold visual style with layered cards, strong spacing, and dashboard-style sections to make it feel closer to a production platform than a starter demo.

## Project Structure

- `config/` MongoDB connection
- `controllers/` request handlers
- `middleware/` auth, error handling, and upload logic
- `models/` Mongoose schemas
- `routes/` REST API routes
- `public/` frontend pages, CSS, and JavaScript
- `scripts/` seed data
- `uploads/` event posters

## Database Collections

### Users
- `name`
- `email`
- `password`
- `role`

### Events
- `title`
- `description`
- `date`
- `location`
- `totalSeats`
- `availableSeats`
- `image`

### Bookings
- `userId`
- `eventId`
- `seatsBooked`
- `bookingDate`
- `ticketId`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` and update the values.

3. Start MongoDB locally or use a MongoDB Atlas connection string.

4. Seed the database with demo data:

```bash
npm run seed
```

5. Start the server:

```bash
npm run dev
```

6. Open the app in your browser:

```bash
http://localhost:3000
```

## Sample Credentials

- Admin: `admin@eventsystem.com` / `Password123!`
- User: `user@eventsystem.com` / `Password123!`

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin-login`
- `GET /api/events`
- `GET /api/events/:id`
- `GET /api/events/summary`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`
- `POST /api/bookings`
- `GET /api/bookings/me`
- `DELETE /api/bookings/:id`
- `GET /api/bookings/:id/ticket`
- `GET /api/bookings/all`
- `GET /api/admin/dashboard`
- `GET /api/admin/reports/monthly`
- `GET /api/admin/reports/monthly.csv`
- `GET /api/health`

## Notes

- Event images are stored in the `uploads/` folder.
- JWT tokens are stored in browser local storage for this demo implementation.
- Use the admin account to manage events and view all bookings.

## Academic Deliverable

- `PROJECT_REPORT.md` contains a structured final project report with overview, modules, database design, API coverage, and future scope.
