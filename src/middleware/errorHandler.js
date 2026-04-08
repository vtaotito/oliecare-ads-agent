const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(`${err.message} — ${req.method} ${req.path}`);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    path: req.path,
  });
};
