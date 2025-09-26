// backend/auth.js
const express = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

const googleAuthRouter = express.Router();
const meRouter = express.Router();

const SUNO_DOMAIN = process.env.SUNO_DOMAIN; // ex.: sunocreators.com.br
const FORCE_SUNO = process.env.FORCE_SUNO === 'true'; // opcional: forçar perfil Suno p/ teste

/* Serialize/deserialize (MVP: guarda payload enxuto na sessão) */
passport.serializeUser((user, done) => {
  done(null, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    provider: 'google',
  });
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

/* Estratégia Google */
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || '';
      const name = profile.displayName || '';
      const hd = profile._json?.hd;

      let role = 'CLIENT';
      if (FORCE_SUNO) {
        role = 'SUNO';
      } else if ((SUNO_DOMAIN && email.endsWith(`@${SUNO_DOMAIN}`)) || (hd && hd === SUNO_DOMAIN)) {
        role = 'SUNO';
      }

      // Aqui você poderia persistir no DB; MVP retorna direto
      const user = { id: profile.id, email, name, role };
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

/* Middleware de proteção */
function ensureAuth(req, res, next) {
  if ((req.isAuthenticated && req.isAuthenticated()) || req.user) return next();
  return res.status(401).json({ error: 'Não autenticado' });
}

/* Rotas de auth */
googleAuthRouter.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

// 👉 Se quiser validar sem front, troque o redirecionamento por um res.send(...)
googleAuthRouter.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure', session: true }),
  (req, res) => {
    const base = process.env.FRONTEND_URL;
    const target = req.user?.role === 'SUNO' ? '/suno' : '/cliente';
    res.redirect(`${base}${target}`);
  }
);

googleAuthRouter.get('/auth/failure', (_req, res) => {
  res.status(401).send('Falha no login com Google');
});

googleAuthRouter.post('/auth/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

/* /me */
meRouter.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, user: req.user });
});

module.exports = {
  googleAuthRouter,
  ensureAuth,
  meRouter,
};
