require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Booking.deleteMany({})
  ]);

  const adminPassword = await bcrypt.hash('Password123!', 10);
  const userPassword = await bcrypt.hash('Password123!', 10);

  const [admin, user] = await User.create([
    {
      name: 'Admin User',
      email: 'admin@eventsystem.com',
      password: adminPassword,
      role: 'admin'
    },
    {
      name: 'Demo User',
      email: 'user@eventsystem.com',
      password: userPassword,
      role: 'user'
    }
  ]);

  const events = await Event.create([
    {
      title: 'Tech Innovators Summit 2026',
      description: 'A premium conference for founders, developers, and product teams focused on future-ready product strategy and AI adoption.',
      date: new Date('2026-06-18T10:00:00'),
      location: 'Metro Convention Center',
      totalSeats: 220,
      availableSeats: 220,
      image: ''
    },
    {
      title: 'City Music Night',
      description: 'An energetic evening featuring live bands, immersive lights, and a modern stage experience for music lovers.',
      date: new Date('2026-07-05T19:30:00'),
      location: 'Riverside Arena',
      totalSeats: 320,
      availableSeats: 320,
      image: ''
    },
    {
      title: 'Creative Workshop Weekend',
      description: 'Hands-on workshops for designers, photographers, and creators who want to level up their practical skills.',
      date: new Date('2026-08-02T09:00:00'),
      location: 'Studio Loft Hub',
      totalSeats: 80,
      availableSeats: 80,
      image: ''
    }
  ]);

  console.log('Seed completed successfully');
  console.log('Admin login: admin@eventsystem.com / Password123!');
  console.log('User login: user@eventsystem.com / Password123!');
  console.log(`Created ${events.length} sample events`);
  console.log(`Seeded admin id: ${admin._id}`);
  console.log(`Seeded user id: ${user._id}`);
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
