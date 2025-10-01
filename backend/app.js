// backend/app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const passport = require('passport');

const { googleAuthRouter, ensureAuth, meRouter } = require('./auth');

const campaignRoutes = require('./routes/campaigns');
const approvalRoutes = require('./routes/approval');
const clientManagementRoutes = require('./routes/clientManagement');
const { sequelize } = require('./models');

const app = express();

/* 1) Proxy + body parser */
app.set('trust proxy', 1);
app.use(express.json());

/* 2) CORS (origem EXATA do front + credentials) */
const FRONT = process.env.FRONTEND_URL || 'http://localhost:3001';
app.use(cors({
  origin: FRONT,
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* 3) Cookie-session
   ⚠️ 3000 (API) e 3001 (front) são origens diferentes ⇒ precisa SameSite=None + Secure=true
   Localhost é considerado "seguro" pelo Chrome, então Secure=true funciona em http://localhost.
*/
app.use(cookieSession({
  name: 'sess',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 24 * 60 * 60 * 1000,
}));

// compat com passport: em cookie-session não existem regenerate/save
app.use((req, res, next) => {
  if (req.session) {
    if (typeof req.session.regenerate !== 'function') req.session.regenerate = cb => cb && cb();
    if (typeof req.session.save !== 'function') req.session.save = cb => cb && cb();
  }
  next();
});

/* 4) Passport */
app.use(passport.initialize());
app.use(passport.session());

/* 5) Health */
app.get('/GetHealth', (_, res) => res.send('Healthy'));

/* 6) Auth routes (SEM prefixo extra) */
app.use(googleAuthRouter);   // /auth/google e /auth/google/callback
app.use('/me', meRouter);    // debug de sessão

/* 7) Suas rotas de app (protegidas) */
app.use('/campaigns', ensureAuth, campaignRoutes);
app.use('/approval', ensureAuth, approvalRoutes);
app.use('/clients', ensureAuth, clientManagementRoutes);

/* 8) Logout (limpa cookie de sessão) */
app.post('/logout', (req, res) => {
  req.logout?.(() => {});
  req.session = null;
  res.status(204).end();
});

/* 9) 404 padrão */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

/* 10) Start local */
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  (async () => {
    try {
      await sequelize.sync();
      app.listen(PORT, () => {
        console.log(`API listening on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error('Falha ao iniciar (sequelize.sync):', err);
      process.exit(1);
    }
  })();
}

module.exports = app;
