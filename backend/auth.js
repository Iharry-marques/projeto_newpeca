// backend/auth.js
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const FRONTEND_URL = process.env.FRONTEND_URL;

// --- Passport sessão (bem minimal)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// --- Estratégia Google
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value || '';
    const domain = email.split('@')[1] || '';

    // trava domínio
    if (process.env.SUNO_DOMAIN && domain !== process.env.SUNO_DOMAIN) {
      return done(null, false, { message: 'Domínio não autorizado' });
    }

    const user = {
      id: profile.id,
      email,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
      provider: 'google',
    };
    return done(null, user);
  }
));

// --- Helpers
function ensureAuth(req, _res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return next({ status: 401, message: 'Não autenticado' });
}

// --- Routers
const googleAuthRouter = express.Router();

googleAuthRouter.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


googleAuthRouter.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login`, session: true }),
  (req, res) => {
    console.log('[AUTH] callback OK, user=', req.user?.email);
    // MUDANÇA AQUI: Redireciona para a raiz do frontend, onde a HomePage está.
    return res.redirect(FRONTEND_URL); 
  }
);

// debug rápido
googleAuthRouter.get('/auth/debug', (req, res) => {
  res.json({
    hasSession: !!req.session,
    user: req.user || null,
    isAuth: req.isAuthenticated ? req.isAuthenticated() : false,
  });
});

// /me sempre responde 200 com payload simples
const meRouter = express.Router();
meRouter.get('/', (req, res) => {
  res.json({ authenticated: !!req.user, user: req.user || null });
});

module.exports = { googleAuthRouter, ensureAuth, meRouter, passport };
