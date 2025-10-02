// Em: backend/app.js

require('dotenv').config();

// --- Importações de Pacotes ---
const express = require('express');
const cors = require('cors'); // 1. Importe o pacote
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');

// --- Importações do Projeto (Corrigidas) ---
const { googleAuthRouter, ensureAuth, meRouter, passport } = require('./auth'); // <-- MUDANÇA AQUI
const campaignRoutes = require('./routes/campaigns');
const { Campaign, Piece, sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// --- Início da Aplicação Express ---
const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

// --- Configuração dos Middlewares ---

// 1. CORS
app.use(cors({
  origin: process.env.FRONTEND_URL, // Permite apenas a origem do seu frontend
  credentials: true // Permite que o navegador envie cookies
}));

// 2. Body Parser
app.use(bodyParser.json());

// 3. Sessões (Usando a versão mais robusta com SQLite)
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
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// 4. Passport.js
app.use(passport.initialize());
app.use(passport.session());

// --- Associações dos Modelos ---
Campaign.hasMany(Piece);
Piece.belongsTo(Campaign);

// --- ROTAS DA APLICAÇÃO (Corrigidas) ---
app.use(googleAuthRouter); // Rota de autenticação do Google
app.use('/me', meRouter);   // Rota para verificar o usuário logado

// Rotas protegidas pelo middleware `ensureAuth`
app.use('/campaigns', ensureAuth, campaignRoutes);

// Middleware para tratamento de erros
app.use(errorHandler);

/* ========== Inicialização do Servidor ========== */
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