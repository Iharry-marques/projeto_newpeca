// Em: frontend/src/pages/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importe suas páginas e componentes
import ProtectedRoute from '../guards/ProtectedRoute';
import Login from './Login'; // CORREÇÃO: O nome do componente é 'Login'
import HomePage from './HomePage';
import ClientLoginPage from './ClientLoginPage';
import ClientDashboard from './ClientDashboard';
import ClientApprovalPage from './ClientApprovalPage';
import ClientManagementPage from './ClientManagementPage';
import { useMe } from '../hooks/useMe';
import Spinner from './Spinner'; // CORREÇÃO: O Spinner está na mesma pasta 'pages'

function App() {
  const { authenticated, loading } = useMe();
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      // Busca o token apenas se o usuário estiver autenticado e o token ainda não foi carregado
      if (authenticated && !googleAccessToken) {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/me/token`, { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            setGoogleAccessToken(data.accessToken);
          } else {
            console.error("Falha ao buscar token, resposta não OK:", response.status);
          }
        } catch (error) {
          console.error("Erro na requisição para /me/token:", error);
        }
      }
    };

    // Roda a função apenas quando a autenticação for confirmada
    if (!loading) {
      fetchToken();
    }
  }, [authenticated, loading, googleAccessToken]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login para o usuário interno */}
        <Route path="/login" element={authenticated ? <Navigate to="/" /> : <Login />} />
        
        {/* Rota principal (Home) protegida */}
        <Route
          path="/"
          element={
            <ProtectedRoute authenticated={authenticated}>
              {/* Passa o token como propriedade para a HomePage */}
              <HomePage googleAccessToken={googleAccessToken} />
            </ProtectedRoute>
          }
        />
        
        {/* Rota de Gestão de Clientes protegida */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute authenticated={authenticated}>
              <ClientManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Rotas Públicas para Clientes Externos */}
        <Route path="/client/login" element={<ClientLoginPage />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/approval/:hash" element={<ClientApprovalPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;