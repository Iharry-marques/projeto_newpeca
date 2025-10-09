// Em: backend/app.js (VERSÃO FINAL PARA USAR COM PROXY NO RENDER)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const SQLiteStoreFactory = require("connect-sqlite3")(session);
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const bodyParser = require("body-parser");
const creativeLineRoutes = require("./routes/creativeLines");
const pieceRoutes = require("./routes/pieces");

// Importações dos Módulos do Projeto
const { googleAuthRouter, ensureAuth, meRouter, passport } = require("./auth");
const campaignRoutes = require("./routes/campaigns");
const filesRoutes = require("./routes/files");
const clientManagementRoutes = require("./routes/clientManagement");
const clientAuthRoutes = require("./routes/clientAuth");
const approvalRoutes = require("./routes/approval");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const redisUrl = process.env.REDIS_URL;

async function createSessionStore() {
  if (redisUrl && isProduction) { // Apenas tenta usar Redis em produção
    try {
      const redisClient = createClient({ url: redisUrl });
      redisClient.on("error", (err) => {
        console.error("[SESSION] Erro no Redis:", err);
      });
      await redisClient.connect();
      console.log("[SESSION] Conectado ao Redis.");
      return new RedisStore({
        client: redisClient,
        prefix: "sess:",
      });
    } catch (error) {
      console.error(
        "[SESSION] Falha ao conectar no Redis. Voltando para SQLite:",
        error
      );
    }
  }

  console.log("[SESSION] Utilizando SQLite como store de sessão.");
  return new SQLiteStoreFactory({
    db: "database.sqlite",
    dir: "./",
  });
}

// Para o Express confiar no proxy reverso do Render
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => {
      console.log(`[SUCESSO] Servidor rodando na porta ${PORT}`);
      console.log(`[INFO] Ambiente: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("[ERRO] Não foi possível iniciar o servidor:", error);
  }
}

(async () => {
  const sessionStore = await createSessionStore();

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        secure: isProduction, // true em produção (HTTPS), false em desenvolvimento (HTTP)
        sameSite: isProduction ? 'none' : 'lax', // permite envio cross-site no Render
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // --- ROTAS ---
  app.use(googleAuthRouter);
  app.use("/me", meRouter);
  app.use("/client-auth", clientAuthRoutes.router);
  app.use("/creative-lines", ensureAuth, creativeLineRoutes);
  app.use("/pieces", ensureAuth, pieceRoutes);
  app.use("/campaigns", filesRoutes);
  app.use("/campaigns", ensureAuth, campaignRoutes);
  app.use("/clients", ensureAuth, clientManagementRoutes);
  app.use("/approval", approvalRoutes);
  app.use(errorHandler);

  await start();
})();
