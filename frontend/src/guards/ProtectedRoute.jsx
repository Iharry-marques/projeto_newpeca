// Em: frontend/src/guards/ProtectedRoute.jsx (VERSÃO CORRIGIDA)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import Spinner from '../components/Spinner';

function ProtectedRoute({ children }) {
  const authState = useMe();

  if (authState.loading) {
    return <Spinner />;
  }

  if (authState.error || !authState.authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;