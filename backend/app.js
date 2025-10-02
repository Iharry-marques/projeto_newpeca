
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');

const { googleAuthRouter, ensureAuth, meRouter, passport } = require('./auth');
const campaignRoutes = require('./routes/campaigns');
const clientManagementRoutes = require('./routes/clientManagement');
const clientAuthRoutes = require('./routes/clientAuth');
const approvalRoutes = require('./routes/approval');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(bodyParser.json());

app.use(
  session({
    store: new SQLiteStore({
      db: 'database.sqlite',
      dir: './',
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      proxy: isProduction,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// --- ROTAS ---
app.use(googleAuthRouter);
app.use('/me', meRouter);
app.use('/client-auth', clientAuthRoutes);

// Rotas Protegidas
app.use('/campaigns', ensureAuth, campaignRoutes);
app.use('/clients', ensureAuth, clientManagementRoutes);
app.use('/approval', approvalRoutes);


app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`[SUCESSO] Servidor rodando na porta ${PORT}`);
      console.log(`[INFO] Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[ERRO] Não foi possível iniciar o servidor:', error);
  }
}

start();