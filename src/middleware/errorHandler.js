const logger = require('../utils/logger');

function extractMessage(err) {
  if (err.message) return err.message;
  if (err.errors?.length) return err.errors.map(e => e.message).join('; ');
  if (err.details) return err.details;
  return 'Erro interno do servidor';
}

module.exports = (err, req, res, next) => {
  const message = extractMessage(err);
  logger.error(`${message} — ${req.method} ${req.path}`);
  if (err.errors) {
    logger.error(`Details: ${JSON.stringify(err.errors)}`);
  }
  res.status(err.status || 500).json({
    error: message,
    path: req.path,
  });
};
