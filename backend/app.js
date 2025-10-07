// Em: backend/app.js (VERSÃO FINAL E CORRIGIDA)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bodyParser = require("body-parser");
const creativeLineRoutes = require('./routes/creativeLines');
const pieceRoutes = require('./routes/pieces');

// Importações dos Módulos do Projeto
const { googleAuthRouter, ensureAuth, meRouter, passport } = require("./auth");
const campaignRoutes = require("./routes/campaigns");
const filesRoutes = require("./routes/files"); // <-- 1. Importa a nova rota
const clientManagementRoutes = require("./routes/clientManagement");
const clientAuthRoutes = require("./routes/clientAuth");
const approvalRoutes = require("./routes/approval");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const forceSameSiteNone = process.env.COOKIE_SAMESITE_NONE === 'true';
const forceSecureCookie = process.env.COOKIE_FORCE_SECURE === 'true';

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(bodyParser.json());

app.use(
  session({
    store: new SQLiteStore({
      db: "database.sqlite",
      dir: "./",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: (() => {
      const cookieConfig = {
        secure: isProduction || forceSecureCookie,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      };

      const shouldUseSameSiteNone = (isProduction || forceSameSiteNone) && cookieConfig.secure;

      cookieConfig.sameSite = shouldUseSameSiteNone ? 'none' : 'lax';

      if (shouldUseSameSiteNone) {
        cookieConfig.partitioned = true;
      }

      return cookieConfig;
    })(),
  })
);

app.get("/debug/session", (req, res) => {
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
app.use("/me", meRouter);
app.use("/client-auth", clientAuthRoutes.router);
app.use('/creative-lines', ensureAuth, creativeLineRoutes); // Protegida
app.use('/pieces', ensureAuth, pieceRoutes); // Protegida

// <-- 2. Rota PÚBLICA para servir arquivos (usada na pré-visualização e PPTX)
app.use('/campaigns', filesRoutes);

// <-- 3. Rotas PROTEGIDAS para gerenciar campanhas
app.use("/campaigns", ensureAuth, campaignRoutes);
app.use("/clients", ensureAuth, clientManagementRoutes);
app.use("/approval", approvalRoutes); // As rotas internas de approval já têm sua própria proteção

app.get("/__routes", (req, res) => {
  const out = [];
  app._router.stack.forEach((m) => {
    if (m.route?.path)
      out.push(
        `[APP] ${Object.keys(m.route.methods).join(",").toUpperCase()} ${
          m.route.path
        }`
      );
    if (m.name === "router" && m.handle?.stack) {
      m.handle.stack.forEach((r) => {
        if (r.route?.path)
          out.push(
            `[ROUTER] ${Object.keys(r.route.methods).join(",").toUpperCase()} ${
              r.route.path
            }`
          );
      });
    }
  });
  res.type("text/plain").send(out.sort().join("\n"));
});

app.use(errorHandler);

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

start();
