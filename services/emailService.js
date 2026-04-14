const nodemailer = require('nodemailer');

const getTransporter = () => {
  const hasHost = Boolean(process.env.SMTP_HOST);
  if (!hasHost) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || ''
        }
      : undefined
  });
};

const sendBookingConfirmation = async ({ to, name, booking, event }) => {
  const transporter = getTransporter();

  const subject = `Booking Confirmed: ${event.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin-bottom: 4px;">Booking Confirmation</h2>
      <p>Hi ${name},</p>
      <p>Your booking is confirmed. Here are your ticket details:</p>
      <ul>
        <li><strong>Ticket ID:</strong> ${booking.ticketId}</li>
        <li><strong>Event:</strong> ${event.title}</li>
        <li><strong>Date:</strong> ${new Date(event.date).toLocaleString('en-US')}</li>
        <li><strong>Location:</strong> ${event.location}</li>
        <li><strong>Seats Booked:</strong> ${booking.seatsBooked}</li>
      </ul>
      <p>Thank you for using Smart Event Booking.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[Email] SMTP not configured. Simulated confirmation email to ${to} for ticket ${booking.ticketId}.`);
    return { simulated: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Smart Event Booking <no-reply@smart-event.local>',
    to,
    subject,
    html
  });

  return { simulated: false };
};

module.exports = {
  sendBookingConfirmation
};
