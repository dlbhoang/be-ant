const ErrorResponse = require('../utils/ErrorResponse');
const clgDev = require('../utils/clgDev');

const errorHandler = (err, req, res, next) => {
  let error = {
    statusCode: err.statusCode || 500,
    error: err.message || 'Lỗi máy chủ',
  };

  res.status(error.statusCode).json({
    success: false,
    error: error.error,
  });
};

module.exports = errorHandler;
