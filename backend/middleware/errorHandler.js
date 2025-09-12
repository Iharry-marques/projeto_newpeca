function errorHandler(err, req, res, next) {
  console.error('[ERRO]', err.stack);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
}

module.exports = errorHandler;
