// Em: backend/auth.js (VERSÃO FINAL COM ROTA /me/token)

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('./models');

const FRONTEND_URL = process.env.FRONTEND_URL;

passport.serializeUser((user, done) => { done(null, user.id); });

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
    passReqToCallback: true, // MUDANÇA 1: Permite acesso ao 'req'
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
      
      // MUDANÇA 2: Salva o token de acesso na sessão do usuário
      if (req.session) {
        req.session.accessToken = accessToken;
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ authenticated: false, error: 'Não autenticado' });
}

const googleAuthRouter = express.Router();
googleAuthRouter.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'] // Adicionado escopo do Drive
  })
);
googleAuthRouter.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => { res.redirect(FRONTEND_URL); }
);

const meRouter = express.Router();
meRouter.get('/', (req, res) => {
  if (req.user && req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.status(401).json({ authenticated: false, user: null });
  }
});

// MUDANÇA 3: NOVA ROTA para buscar o token de acesso de forma segura
meRouter.get('/token', ensureAuth, (req, res) => {
  if (req.session && req.session.accessToken) {
    res.json({ accessToken: req.session.accessToken });
  } else {
    res.status(401).json({ error: 'Token de acesso não encontrado na sessão.' });
  }
});

module.exports = { googleAuthRouter, ensureAuth, meRouter, passport };