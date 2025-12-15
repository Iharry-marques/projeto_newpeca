// Em: backend/config.js

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_muito_seguro',

  db: {
    dialect: process.env.POSTGRES_URL ? 'postgres' : 'sqlite',
    storage: process.env.POSTGRES_URL ? undefined : './database.sqlite',

    // Esta linha diz: "Procure a variável de ambiente POSTGRES_URL"
    connectionString: process.env.POSTGRES_URL,

    dialectOptions: process.env.POSTGRES_URL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
  }
};