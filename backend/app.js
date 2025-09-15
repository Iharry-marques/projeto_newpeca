require('dotenv').config(); // MUITO IMPORTANTE: Deve ser a primeira linha

// --- Importações de Pacotes ---
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./auth');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SQLiteStore = require('connect-sqlite3')(session);

// --- Importações do Projeto ---
const config = require('./config');
const { User, Client, Campaign, Piece, sequelize } = require('./models');

// --- Início da Aplicação Express ---
const app = express();
app.set('trust proxy', 1); // Importante para o Render e cookies seguros

// --- Configuração dos Middlewares (A Ordem é Importante) ---

// 1. CORS: Deve vir primeiro para permitir a comunicação.
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
app.use(cors(corsOptions));

// 2. Sessões: Agora salvas no banco de dados para serem persistentes.
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
      secure: true,
      proxy: true,
      sameSite: 'none',
    },
  })
);

// 3. Passport.js: Deve vir depois da configuração da sessão.
app.use(passport.initialize());
app.use(passport.session());

// 4. Outros Middlewares
app.use(bodyParser.json());
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// --- ROTAS DA APLICAÇÃO ---
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const { router: clientAuthRoutes } = require('./routes/clientAuth');
const approvalRoutes = require('./routes/approval');
const errorHandler = require('./middleware/errorHandler');

app.use('/auth', authRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/client-auth', clientAuthRoutes);
app.use('/approval', approvalRoutes);

app.use(errorHandler);

/* ========== Inicialização do Servidor ========== */

async function start() {
  try {
    await sequelize.sync();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`[SUCESSO] Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    console.error('[ERRO] Não foi possível iniciar o servidor:', error);
  }
}

start();