const databaseUrl = process.env.DATABASE_URL;

module.exports = {
  jwtSecret: 'replace_this_secret',
  db: databaseUrl
    ? {
        dialect: 'postgres',
        url: databaseUrl,
      }
    : {
        dialect: 'sqlite',
        storage: process.env.SQLITE_STORAGE_PATH || 'database.sqlite',
      },
};
