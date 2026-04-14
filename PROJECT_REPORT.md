# Smart Event Management and Ticket Booking System - Final Project Report

## 1. Project Overview
This project is a complete full-stack web application for managing events and booking tickets with role-based access.

- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: Node.js, Express
- Database: MongoDB with Mongoose

## 2. Problem Statement
Traditional event booking workflows are fragmented, making it difficult for users to discover and book events while giving admins limited visibility into seat utilization and booking analytics.

## 3. Objectives
- Provide user registration and secure login
- Enable users to discover events, book seats, and manage bookings
- Provide a separate admin workflow for event and booking operations
- Generate unique ticket IDs and downloadable PDF tickets
- Offer analytics and monthly reporting for decision making

## 4. Core Modules

### 4.1 Authentication Module
- User login and registration
- Separate admin login endpoint
- JWT-based authorization

### 4.2 Event Module
- Create, update, delete events (admin)
- Public event listing, details, category/summary insights
- Image upload support for event posters

### 4.3 Booking Module
- Seat-based booking with availability checks
- Unique ticket ID generation
- User cancellation and admin-side booking cancellation
- PDF ticket download endpoint
- Optional booking confirmation email (SMTP)

### 4.4 Analytics Module
- Dashboard stats: total events, bookings, seats
- Monthly bookings and seats trend
- CSV export of monthly reports

## 5. Database Design

### Users Collection
- name
- email
- password
- role

### Events Collection
- title
- description
- date
- location
- totalSeats
- availableSeats
- image

### Bookings Collection
- userId
- eventId
- seatsBooked
- bookingDate
- ticketId

## 6. API Highlights
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin-login`
- `GET /api/events`
- `GET /api/events/summary`
- `POST /api/bookings`
- `GET /api/bookings/:id/ticket`
- `GET /api/admin/reports/monthly`
- `GET /api/admin/reports/monthly.csv`
- `GET /api/health`

## 7. Validation and Error Handling
- Input validation middleware for auth, event, and booking payloads
- Centralized error handler with development stack traces
- Production-safe error responses

## 8. Security Measures
- Password hashing with bcrypt
- JWT auth middleware
- Role-based route protection
- Helmet security headers

## 9. User Experience and UI
- Responsive, modern, multi-page interface
- Advanced home discovery experience with filters and featured listings
- Categories page, analytics dashboard, and booking management pages

## 10. Setup and Execution
1. Install dependencies: `npm install`
2. Create `.env` from `.env.example`
3. Seed database: `npm run seed`
4. Run project: `npm run dev`
5. Open: `http://localhost:3000`

## 11. Sample Credentials
- Admin: `admin@eventsystem.com` / `Password123!`
- User: `user@eventsystem.com` / `Password123!`

## 12. Future Enhancements
- Payment gateway integration
- Email templates and SMS notifications
- Seat map selection UI
- CI/CD and containerized deployment
- Automated test suite (unit and integration)
