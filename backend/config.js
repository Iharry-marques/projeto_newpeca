// Em: backend/config.js

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_muito_seguro',
  
  db: {
    dialect: 'postgres',
    
    // Esta linha diz: "Procure a variável de ambiente POSTGRES_URL"
    connectionString: process.env.POSTGRES_URL, 
    
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
  }
};