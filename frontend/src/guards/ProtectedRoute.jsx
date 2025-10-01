// Em: frontend/src/guards/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '../hooks/useMe'; // Verifique se o caminho para o hook useMe está correto
import Spinner from '../pages/Spinner';

function ProtectedRoute({ children }) {
  const { data, loading, error } = useMe();

  if (loading) {
    return <Spinner />; // Mostra um spinner enquanto verifica a autenticação
  }

  if (error || !data?.authenticated) {
    // Se der erro ou não estiver autenticado, redireciona para o login
    return <Navigate to="/login" replace />;
  }

  // Se estiver tudo certo, mostra a página solicitada
  return children;
}

export default ProtectedRoute;