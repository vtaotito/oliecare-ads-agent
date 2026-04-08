const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const message = err.message || err.details || JSON.stringify(err);
  logger.error(`${message} — ${req.method} ${req.path}`);
  if (err.errors) {
    logger.error(`Details: ${JSON.stringify(err.errors)}`);
  }
  res.status(err.status || 500).json({
    error: message || 'Erro interno do servidor',
    path: req.path,
  });
};
