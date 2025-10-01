// Em: frontend/src/pages/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importe suas páginas e componentes
// Os caminhos aqui estão corretos porque todos os arquivos estão na mesma pasta 'pages'
import ProtectedRoute from '../guards/ProtectedRoute'; 
import LoginPage from './Login'; 
import HomePage from './HomePage'; 
import ClientLoginPage from './ClientLoginPage';
import ClientDashboard from './ClientDashboard';
import ClientApprovalPage from './ClientApprovalPage';
import ClientManagementPage from './ClientManagementPage';

function App() {
  return (
    <Routes>
      {/* Rota Raiz e de Login do Suno */}
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } 
      />
      
      {/* Outras rotas do Suno (Admin) */}
      <Route 
        path="/clients" 
        element={
          <ProtectedRoute>
            <ClientManagementPage />
          </ProtectedRoute>
        } 
      />

      {/* Rotas do Portal do Cliente */}
      <Route path="/client/login" element={<ClientLoginPage />} />
      <Route path="/client/dashboard" element={<ClientDashboard />} />
      <Route path="/client/approval/:hash" element={<ClientApprovalPage />} />

      {/* Adicione outras rotas aqui conforme necessário */}
    </Routes>
  );
}

export default App;