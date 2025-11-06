// Em: backend/scripts/createClient.js (VERSÃO CORRIGIDA)

require('dotenv').config();
const { MasterClient, Client, sequelize } = require('../models');

// Lista de clientes que queremos cadastrar como "Empresas-Mãe"
const clientCompanies = [
  "AMERICANAS", "ARAMIS", "CANTU", "COGNA", "ESPORTE DA SORTE",
  "HASDEX", "HORTIFRUTI NATURAL DA TERRA", "IDEAZARVOS", "KEETA",
  "MASTERCARD", "O BOTICARIO", "RD", "SAMSUNG", "SAMSUNG E STORE",
  "SICREDI", "VIVO"
];

async function createInitialData() {
  try {
    await sequelize.sync();
    console.log('Banco de dados sincronizado.');

    let masterClientsCreated = 0;
    let clientUsersCreated = 0;

    for (const companyName of clientCompanies) {
      // Passo 1: Garante que a Empresa-Mãe (MasterClient) exista
      const [masterClient, mcCreated] = await MasterClient.findOrCreate({
        where: { name: companyName },
        defaults: { name: companyName }
      });

      if (mcCreated) {
        masterClientsCreated++;
        console.log(`- Empresa-Mãe "${masterClient.name}" criada.`);
      }

      // Passo 2: Cria um usuário de contato genérico para essa empresa
      const clientUserData = {
        name: `Contato ${companyName}`,
        email: `contato@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        password: 'password_placeholder', // Senha genérica
        company: companyName, // Campo legado, mas bom manter
        isActive: true,
        MasterClientId: masterClient.id, // Vincula o usuário à empresa-mãe
      };

      const [clientUser, cuCreated] = await Client.findOrCreate({
        where: { email: clientUserData.email },
        defaults: clientUserData
      });
      
      if (cuCreated) {
        clientUsersCreated++;
        console.log(`  - Usuário Cliente "${clientUser.name}" criado e vinculado.`);
      }
    }

    console.log('\n--- Resumo da Carga ---');
    console.log(`${masterClientsCreated} novas Empresas-Mãe (MasterClients) criadas.`);
    console.log(`${clientUsersCreated} novos Usuários Cliente (Clients) criados.`);
    if (masterClientsCreated === 0 && clientUsersCreated === 0) {
      console.log('O banco de dados já estava populado. Nenhuma ação necessária.');
    }

  } catch (error) {
    console.error('Erro ao fazer a carga inicial de dados:', error);
  } finally {
    await sequelize.close();
  }
}

createInitialData();