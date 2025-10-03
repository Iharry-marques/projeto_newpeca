// Em: backend/auth.js

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

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('Email não encontrado.'), null);

      const domain = email.split('@')[1];
      if (process.env.SUNO_DOMAIN && domain !== process.env.SUNO_DOMAIN) {
        return done(null, false, { message: 'Domínio não autorizado' });
      }

      const [user] = await User.findOrCreate({
        where: { username: email },
        defaults: { password: 'provided_by_google' }
      });

      // ➜ Passe os tokens pelo "info"
      return done(null, user, { accessToken, refreshToken });
    } catch (err) {
      return done(err, null);
    }
  }
));


// Middleware para garantir que o usuário está autenticado
function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ authenticated: false, error: 'Não autenticado' });
}

const googleAuthRouter = express.Router();

// Rota de login padrão
googleAuthRouter.get(
  '/auth/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }, 
      (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect(`${FRONTEND_URL}/login`);

        req.logIn(user, (err) => {
          if (err) return next(err);

          // Salva tokens na sessão AGORA (após login)
          if (info?.accessToken) req.session.accessToken = info.accessToken;
          if (info?.refreshToken) req.session.refreshToken = info.refreshToken;

          req.session.save(() => res.redirect(FRONTEND_URL));
        });
      }
    )(req, res, next);
  }
);


// <-- MUDANÇA: NOVA ROTA para forçar o consentimento e garantir o refresh token
// Use esta rota quando o usuário precisar (re)conectar o Google Drive
googleAuthRouter.get(
  '/auth/google/drive-consent',
  passport.authenticate('google', {
    scope: ['profile', 'email', DRIVE_SCOPE],
    accessType: 'offline',
    prompt: 'consent', // Força a tela de permissão do Google
  })
);

googleAuthRouter.get('/auth/google', (req, res, next) => {
  res.redirect('/auth/google/drive-consent');
});


// Rota de callback do Google (comum para ambas as autenticações)
googleAuthRouter.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => { 
    // Redireciona para uma página específica ou para a home após o login
    res.redirect(FRONTEND_URL); 
  }
);

const meRouter = express.Router();

// Rota para verificar o status da autenticação
meRouter.get('/', (req, res) => {
  if (req.user && req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.status(401).json({ authenticated: false, user: null });
  }
});

// <-- MUDANÇA: Rota /me/token atualizada e mais segura
// O frontend chamará esta rota para obter o token antes de fazer chamadas à API do Drive
meRouter.get('/token', ensureAuth, (req, res) => {
  const token = req.session?.accessToken;
  if (token) return res.json({ accessToken: token });
  return res.status(401).json({ error: 'Token de acesso não encontrado na sessão.' });
});

module.exports = { googleAuthRouter, ensureAuth, meRouter, passport };