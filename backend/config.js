// Em: backend/config.js

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const usePostgres = Boolean(connectionString);
// Habilita SSL apenas quando informado ou em produção; evita erro em bancos locais
const useSsl =
  (process.env.POSTGRES_SSL || '').toLowerCase() === 'true' ||
  process.env.NODE_ENV === 'production';

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_muito_seguro',

  db: {
    dialect: usePostgres ? 'postgres' : 'sqlite',
    storage: usePostgres ? undefined : './database.sqlite',
    connectionString,
    dialectOptions: usePostgres && useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  },
};
