const express = require('express');
const passport = require('../auth');
const router = express.Router();

/* ========== Autenticação com Google ========== */

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL + '/login' }),
  (req, res) => {
    console.log('[CALLBACK] Login bem-sucedido. Usuário na sessão:', req.user);
    console.log('[CALLBACK] ID da Sessão:', req.sessionID);
    res.redirect(process.env.FRONTEND_URL);
  }
);

router.get('/status', (req, res) => {
  console.log('---------------------------------');
  console.log('[STATUS] Recebida verificação de status.');
  console.log('[STATUS] O ID da sessão recebida é:', req.sessionID);
  console.log('[STATUS] O usuário na sessão é:', req.user);
  console.log('[STATUS] O resultado de req.isAuthenticated() é:', req.isAuthenticated());
  console.log('---------------------------------');

  if (req.isAuthenticated()) {
    res.status(200).json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
    });
  } else {
    res.status(401).json({
      isAuthenticated: false,
      user: null,
    });
  }
});

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect(process.env.FRONTEND_URL);
  });
});

module.exports = router;
