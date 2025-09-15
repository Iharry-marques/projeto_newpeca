// frontend/src/App.jsx - Versão atualizada

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import ClientLoginPage from './ClientLoginPage';
import ClientApprovalPage from './ClientApprovalPage';
import Spinner from './Spinner';
import './App.css';

// Componente para rotas protegidas de usuários Suno
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/status`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.isAuthenticated);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isAuthenticated === null) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente para rotas protegidas de clientes
function ClientProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkClientAuth = async () => {
      const token = localStorage.getItem('clientToken');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/client-auth/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('clientToken');
          localStorage.removeItem('clientData');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação do cliente:', error);
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientData');
        setIsAuthenticated(false);
      }
    };

    checkClientAuth();
  }, []);

  if (isAuthenticated === null) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/client/login" replace />;
  }

  return children;
}

// Página de sucesso para clientes
function ClientSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Aprovação Enviada!</h1>
        <p className="text-slate-600 mb-6">
          Seu feedback foi registrado com sucesso. A agência será notificada sobre suas aprovações e sugestões.
        </p>
        <p className="text-sm text-slate-500">
          Você pode fechar esta janela.
        </p>
      </div>
    </div>
  );
}

// Página de dashboard para clientes (lista de campanhas)
function ClientDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Portal do Cliente</h1>
        <p className="text-slate-600">
          Esta área será desenvolvida para mostrar suas campanhas disponíveis para aprovação.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Rotas para usuários Suno */}
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Rotas para clientes */}
      <Route path="/client/login" element={<ClientLoginPage />} />
      <Route path="/client/success" element={<ClientSuccessPage />} />
      <Route
        path="/client/dashboard"
        element={
          <ClientProtectedRoute>
            <ClientDashboard />
          </ClientProtectedRoute>
        }
      />
      
      {/* Rota pública para aprovação via hash */}
      <Route path="/client/approval/:hash" element={<ClientApprovalPage />} />

      {/* Redirecionamentos */}
      <Route path="/client" element={<Navigate to="/client/login" replace />} />
    </Routes>
  );
}

export default App;