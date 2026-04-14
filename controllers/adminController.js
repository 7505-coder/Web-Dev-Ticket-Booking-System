const Event = require('../models/Event');
const Booking = require('../models/Booking');

const buildMonthlyReport = async () => {
  const now = new Date();
  const months = [];

  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    });
  }

  const firstMonth = new Date(months[0].year, months[0].month - 1, 1);

  const bookingAgg = await Booking.aggregate([
    { $match: { bookingDate: { $gte: firstMonth } } },
    {
      $group: {
        _id: {
          year: { $year: '$bookingDate' },
          month: { $month: '$bookingDate' }
        },
        bookingsCount: { $sum: 1 },
        seatsBooked: { $sum: '$seatsBooked' }
      }
    }
  ]);

  const monthMap = bookingAgg.reduce((accumulator, item) => {
    const key = `${item._id.year}-${item._id.month}`;
    accumulator[key] = {
      bookingsCount: item.bookingsCount,
      seatsBooked: item.seatsBooked
    };
    return accumulator;
  }, {});

  return months.map((month) => {
    const key = `${month.year}-${month.month}`;
    return {
      label: month.label,
      year: month.year,
      month: month.month,
      bookingsCount: monthMap[key]?.bookingsCount || 0,
      seatsBooked: monthMap[key]?.seatsBooked || 0
    };
  });
};

const getDashboardStats = async (req, res, next) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const seatSummary = await Event.aggregate([
      {
        $group: {
          _id: null,
          availableSeats: { $sum: '$availableSeats' }
        }
      }
    ]);

    res.json({
      stats: {
        totalEvents,
        totalBookings,
        availableSeats: seatSummary[0]?.availableSeats || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyReports = async (req, res, next) => {
  try {
    const report = await buildMonthlyReport();

    res.json({ report });
  } catch (error) {
    next(error);
  }
};

const downloadMonthlyReportsCsv = async (req, res, next) => {
  try {
    const report = await buildMonthlyReport();
    const rows = [
      ['Month', 'Year', 'MonthNumber', 'Bookings', 'SeatsBooked'],
      ...report.map((entry) => [entry.label, entry.year, entry.month, entry.bookingsCount, entry.seatsBooked])
    ];

    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getMonthlyReports,
  downloadMonthlyReportsCsv
};
