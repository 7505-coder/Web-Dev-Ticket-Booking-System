const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}]`, err);
  }

  res.status(statusCode).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

module.exports = errorHandler;
