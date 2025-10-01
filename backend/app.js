// backend/app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const { googleAuthRouter, ensureAuth, meRouter, passport } = require('./auth');

const campaignRoutes = require('./routes/campaigns'); // pode ficar por enquanto
const approvalRoutes = require('./routes/approval');
const clientManagementRoutes = require('./routes/clientManagement');
const { sequelize } = require('./models');

const app = express();

/* 1) proxy + body */
app.set('trust proxy', 1);
app.use(express.json());

/* 2) CORS */
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

/* 3) Cookie Session */
app.use(cookieSession({
  name: 'sess',
  secret: process.env.SESSION_SECRET || 'dev',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' ? true : false,
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  maxAge: 24 * 60 * 60 * 1000,
}));

// compat cookie-session <-> passport
app.use((req, _res, next) => {
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

/* 6) Auth + /me */
app.use(googleAuthRouter);
app.use('/me', meRouter);

/* 7) (resto pode ficar protegido – não vamos usar agora) */
app.use('/campaigns', ensureAuth, campaignRoutes);
app.use('/approval', ensureAuth, approvalRoutes);
app.use('/clients', ensureAuth, clientManagementRoutes);

/* 8) 404 */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

/* 9) start */
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  (async () => {
    try {
      await sequelize.sync();
      app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
    } catch (err) {
      console.error('Falha ao iniciar:', err);
      process.exit(1);
    }
  })();
}

module.exports = app;
