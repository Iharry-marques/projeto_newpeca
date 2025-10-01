// backend/auth.js
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// session: guarda payload mínimo
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  },
  (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value || '';
    const domain = email.split('@')[1] || '';
    if (process.env.SUNO_DOMAIN && domain !== process.env.SUNO_DOMAIN) {
      return done(null, false, { message: 'Domínio não autorizado' });
    }

    const user = {
      id: profile.id,
      email,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
      provider: 'google',
      role: 'suno', // dica: marca papel
    };
    return done(null, user);
  }
));

// helpers
function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Não autenticado' });
}

// router
const googleAuthRouter = express.Router();

googleAuthRouter.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

googleAuthRouter.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login`, session: true }),
  (req, res) => {
    console.log('[AUTH] callback OK, user=', req.user?.email);
    return res.redirect(`${FRONTEND_URL}/suno`);
  }
);

// /me para debug
const meRouter = express.Router();
meRouter.get('/', ensureAuth, (req, res) => res.json({ user: req.user }));

module.exports = { googleAuthRouter, ensureAuth, meRouter };
