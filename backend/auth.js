// Em: backend/auth.js (VERSÃO CORRIGIDA E ROBUSTA)

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('./models');

const FRONTEND_URL = process.env.FRONTEND_URL;
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Email não encontrado no perfil do Google.'), null);
      }

      const domain = email.split('@')[1];
      const allowedDomains = process.env.SUNO_DOMAIN
        ? process.env.SUNO_DOMAIN.split(',').map((d) => d.trim()).filter(Boolean)
        : null;

      if (allowedDomains?.length && !allowedDomains.includes(domain)) {
        return done(null, false, { message: 'Domínio não autorizado.' });
      }

      const [user] = await User.findOrCreate({
        where: { username: email },
        defaults: { password: 'provided_by_google' } // Senha placeholder
      });

      // Anexa os tokens ao objeto de usuário para serem capturados no callback
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Middleware para garantir que o usuário está autenticado
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ authenticated: false, error: 'Não autenticado.' });
}

const googleAuthRouter = express.Router();

// Rota para iniciar o login e pedir consentimento do Drive
googleAuthRouter.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', DRIVE_SCOPE],
    accessType: 'offline',
    prompt: 'consent',
  })
);

// Rota de callback do Google - TOTALMENTE REFEITA
googleAuthRouter.get(
  '/auth/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      failureRedirect: `${FRONTEND_URL}/login?error=auth_failed`,
      failureMessage: true
    }, (err, user, info) => {
      if (err) {
        console.error("[AUTH_CALLBACK] Erro do Passport:", err);
        return res.redirect(`${FRONTEND_URL}/login?error=internal_error`);
      }
      if (!user) {
        console.warn("[AUTH_CALLBACK] Autenticação falhou, usuário não retornado. Mensagem:", info?.message);
        return res.redirect(`${FRONTEND_URL}/login?error=access_denied`);
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("[AUTH_CALLBACK] Erro no req.logIn:", loginErr);
          return next(loginErr);
        }

        // Salva os tokens na sessão de forma explícita
        if (user.accessToken) {
            req.session.accessToken = user.accessToken;
        }
        if (user.refreshToken) {
            req.session.refreshToken = user.refreshToken;
        }

        // Garante que a sessão seja salva ANTES de redirecionar
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[AUTH_CALLBACK] Erro ao salvar a sessão:", saveErr);
            return next(saveErr);
          }
          console.log("[AUTH_CALLBACK] Sessão salva com sucesso, redirecionando para o frontend.");
          return res.redirect(FRONTEND_URL);
        });
      });
    })(req, res, next);
  }
);


const meRouter = express.Router();

// Rota para verificar o status da autenticação
meRouter.get('/', (req, res) => {
  console.log('[DEBUG] /me - Verificando autenticação. SessionID:', req.sessionID);
  console.log('[DEBUG] /me - req.isAuthenticated():', req.isAuthenticated());
  console.log('[DEBUG] /me - req.user:', req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null);
  // console.log('[DEBUG] /me - req.session:', req.session); // Descomente se precisar ver a sessão inteira
  if (req.isAuthenticated() && req.user) {
    const userData = typeof req.user.toJSON === 'function' ? req.user.toJSON() : req.user;
    const { password, ...safeUser } = userData;
    res.json({ authenticated: true, user: safeUser });
    return;
  }
  // Retorna 401 se não estiver autenticado
  res.status(401).json({ authenticated: false, user: null });
});

// Rota para obter o token de acesso do Drive
meRouter.get('/token', ensureAuth, (req, res) => {
  const token = req.session?.accessToken;
  if (token) {
    return res.json({ accessToken: token });
  }
  return res.status(401).json({ error: 'Token de acesso do Drive não encontrado na sessão.' });
});

module.exports = { googleAuthRouter, ensureAuth, meRouter, passport };
