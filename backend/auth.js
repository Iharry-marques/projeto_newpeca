// 🔐 auth.js - configura Google OAuth com Passport
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// auth.js
const { User } = require('./models');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id);
  done(null, user);
});


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // USA A VARIÁVEL DO .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // USA A VARIÁVEL DO .env
      callbackURL: '/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const domain = email.split('@')[1];

      // só permite e-mails dos domínios autorizados
      const allowedDomains = ['sunocreators.com', 'unitedcreators.com.br'];
      if (!allowedDomains.includes(domain)) return done(null, false);

      let user = await User.findOne({ where: { username: email } });
      if (!user) {
        user = await User.create({
          username: email,
          password: 'oauth', // não é usado, mas campo obrigatório
          role: 'collaborator',
        });
      }
      return done(null, user);
    }
  )
);

module.exports = passport;