// Em: frontend/src/guards/ProtectedRoute.jsx (VERSÃO CORRIGIDA)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import Spinner from '../components/Spinner';

function ProtectedRoute({ children }) {
  // MUDANÇA AQUI: Recebemos o objeto inteiro do hook
  const authState = useMe();

  if (authState.loading) {
    return <Spinner />;
  }

  // MUDANÇA AQUI: Agora verificamos o 'authState.authenticated' diretamente
  if (authState.error || !authState.authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver tudo certo, mostra a página solicitada
  return children;
}

export default ProtectedRoute;