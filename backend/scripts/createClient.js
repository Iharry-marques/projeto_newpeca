// Em: backend/scripts/createClient.js (VERSÃO ATUALIZADA PARA CARGA INICIAL)

require('dotenv').config();
const { Client, sequelize } = require('../models');

// Lista de clientes que queremos cadastrar como "Empresas-Mãe"
const clientCompanies = [
  "AMERICANAS", "ARAMIS", "CANTU", "COGNA", "ESPORTE DA SORTE",
  "HASDEX", "HORTIFRUTI NATURAL DA TERRA", "IDEAZARVOS", "KEETA",
  "MASTERCARD", "O BOTICARIO", "RD", "SAMSUNG", "SAMSUNG E STORE",
  "SICREDI", "VIVO"
];

async function createInitialClients() {
  try {
    await sequelize.sync();
    console.log('Banco de dados sincronizado.');

    let createdCount = 0;

    for (const companyName of clientCompanies) {
      // Vamos criar um "usuário" genérico para cada empresa por enquanto.
      // A senha é obrigatória no modelo, então usamos uma placeholder.
      const clientData = {
        name: `Contato Principal ${companyName}`,
        email: `contato@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        password: 'password_placeholder', // Senha genérica que não será usada para login
        company: companyName,
        isActive: true,
      };

      // Verifica se uma empresa com esse nome já existe para não duplicar
      const [client, created] = await Client.findOrCreate({
        where: { company: companyName },
        defaults: clientData
      });

      if (created) {
        createdCount++;
        console.log(`- Cliente/Empresa "${client.company}" criado com sucesso.`);
      }
    }

    if (createdCount > 0) {
      console.log(`\n${createdCount} novos clientes foram adicionados!`);
    } else {
      console.log('\nNenhum novo cliente adicionado, o banco de dados já estava populado.');
    }

  } catch (error) {
    console.error('Erro ao fazer a carga inicial de clientes:', error);
  } finally {
    await sequelize.close();
  }
}

createInitialClients();