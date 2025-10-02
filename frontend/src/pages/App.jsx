// Em: frontend/src/pages/App.jsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../guards/ProtectedRoute';
import Login from './Login';
import HomePage from './HomePage';
import ClientLoginPage from './ClientLoginPage';
import ClientDashboard from './ClientDashboard';
import ClientApprovalPage from './ClientApprovalPage';
import ClientManagementPage from './ClientManagementPage';
import { useMe } from '../hooks/useMe';
import Spinner from '../components/Spinner';

function App() {
  const { authenticated, loading } = useMe();
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (authenticated && !googleAccessToken) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/me/token`,
            { credentials: 'include' }
          );
          if (response.ok) {
            const data = await response.json();
            setGoogleAccessToken(data.accessToken);
          } else {
            console.error('Falha ao buscar token, resposta não OK:', response.status);
          }
        } catch (error) {
          console.error('Erro na requisição para /me/token:', error);
        }
      }
    };

    if (!loading) fetchToken();
  }, [authenticated, loading, googleAccessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <Routes>
      {/* Login interno */}
      <Route
        path="/login"
        element={authenticated ? <Navigate to="/" /> : <Login />}
      />

      {/* Home protegida */}
      <Route
        path="/"
        element={
          <ProtectedRoute authenticated={authenticated}>
            <HomePage googleAccessToken={googleAccessToken} />
          </ProtectedRoute>
        }
      />

      {/* Gestão de clientes (protegida) */}
      <Route
        path="/clients"
        element={
          <ProtectedRoute authenticated={authenticated}>
            <ClientManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Rotas públicas para clientes externos */}
      <Route path="/client/login" element={<ClientLoginPage />} />
      <Route path="/client/dashboard" element={<ClientDashboard />} />
      <Route path="/client/approval/:hash" element={<ClientApprovalPage />} />
    </Routes>
  );
}

export default App;
