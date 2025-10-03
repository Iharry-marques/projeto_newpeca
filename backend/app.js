// Em: backend/app.js (VERSÃO FINAL E CORRIGIDA)

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');

// Importações dos Módulos do Projeto
const { googleAuthRouter, ensureAuth, meRouter, passport } = require('./auth');
const campaignRoutes = require('./routes/campaigns');
const clientManagementRoutes = require('./routes/clientManagement');
const clientAuthRoutes = require('./routes/clientAuth'); // Importa o objeto { router, authenticateClient }
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
      secure: false,
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.get('/debug/session', (req, res) => {
  res.json({
    user: req.user ? req.user.username : null,
    hasAccessToken: !!(req.session && req.session.accessToken),
    sessionKeys: req.session ? Object.keys(req.session) : [],
  });
});


app.use(passport.initialize());
app.use(passport.session());

// --- ROTAS ---
app.use(googleAuthRouter);
app.use('/me', meRouter);

// Precisamos usar a propriedade .router do objeto importado
app.use('/client-auth', clientAuthRoutes.router);

// Rotas Protegidas
app.use('/campaigns', ensureAuth, campaignRoutes);
app.use('/clients', ensureAuth, clientManagementRoutes);
app.use('/approval', approvalRoutes);

app.get('/__routes', (req, res) => {
  const out = [];
  app._router.stack.forEach((m) => {
    if (m.route?.path) out.push(`[APP] ${Object.keys(m.route.methods).join(',').toUpperCase()} ${m.route.path}`);
    if (m.name === 'router' && m.handle?.stack) {
      m.handle.stack.forEach((r) => {
        if (r.route?.path) out.push(`[ROUTER] ${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
      });
    }
  });
  res.type('text/plain').send(out.sort().join('\n'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => {
      console.log(`[SUCESSO] Servidor rodando na porta ${PORT}`);
      console.log(`[INFO] Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[ERRO] Não foi possível iniciar o servidor:', error);
  }
}

start();