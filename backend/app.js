// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const passport = require('passport');

const { googleAuthRouter, ensureAuth, meRouter } = require('./auth');

const app = express();

/* 1) Proxy e body parser */
app.set('trust proxy', 1);
app.use(express.json());

/* 2) CORS */
app.use(cors({
  origin: process.env.FRONTEND_URL, // ex.: http://localhost:3001
  credentials: true,
}));

/* 3) Cookie-session (stateless) */
app.use(cookieSession({
  name: 'sess',
  secret: process.env.SESSION_SECRET,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || 'lax', // 'none' em domínios diferentes + HTTPS
  maxAge: 24 * 60 * 60 * 1000,
}));

/* 3.1) SHIM p/ compat do Passport com cookie-session */
app.use((req, res, next) => {
  if (!req.session) req.session = {};
  if (typeof req.session.regenerate !== 'function') {
    req.session.regenerate = (cb) => cb && cb();
  }
  if (typeof req.session.save !== 'function') {
    req.session.save = (cb) => cb && cb();
  }
  next();
});

/* 4) Passport */
app.use(passport.initialize());
app.use(passport.session());

/* Saúde */
app.get('/GetHealth', (_, res) => res.send('Healthy'));

/* Auth + util */
app.use(googleAuthRouter);
app.use('/me', meRouter);

/* Exemplo de rota protegida */
app.get('/suno/protected', ensureAuth, (req, res) => {
  res.json({ ok: true, user: req.user, msg: 'Rota protegida (Suno)' });
});

/* 404 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* Start local */
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
