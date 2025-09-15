// backend/scripts/createClient.js
// Script para criar usuários clientes

require('dotenv').config();
const { Client, sequelize } = require('../models');

async function createClient() {
  try {
    // Sincronizar o banco de dados
    await sequelize.sync();

    // Dados do cliente (modifique conforme necessário)
    const clientData = {
      name: 'João Silva',
      email: 'joao@empresacliente.com',
      password: 'senha123', // Será criptografada automaticamente
      company: 'Empresa Cliente Ltda',
      isActive: true,
    };

    // Verificar se já existe
    const existingClient = await Client.findOne({ where: { email: clientData.email } });
    
    if (existingClient) {
      console.log(`Cliente com email ${clientData.email} já existe!`);
      return;
    }

    // Criar o cliente
    const client = await Client.create(clientData);
    
    console.log('Cliente criado com sucesso:');
    console.log(`ID: ${client.id}`);
    console.log(`Nome: ${client.name}`);
    console.log(`Email: ${client.email}`);
    console.log(`Empresa: ${client.company}`);
    console.log('\nCredenciais de login:');
    console.log(`Email: ${client.email}`);
    console.log(`Senha: ${clientData.password}`);
    
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
  } finally {
    await sequelize.close();
  }
}

// Executar se o script for chamado diretamente
if (require.main === module) {
  createClient();
}

module.exports = createClient;