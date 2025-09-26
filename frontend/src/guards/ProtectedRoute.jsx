// frontend/src/guards/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useMe } from '../../hooks/useMe';

export default function ProtectedRoute({ allowRoles, children }) {
  const { loading, authenticated, user } = useMe();

  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (!authenticated) {
    // manda para o login do backend
    window.location.href = 'http://localhost:3000/auth/google';
    return null;
  }

  if (allowRoles && !allowRoles.includes(user?.role)) {
    // Se logou como CLIENT e tentou /suno, manda pro /cliente (e vice-versa)
    return <Navigate to={user?.role === 'SUNO' ? '/cliente' : '/suno'} replace />;
  }

  return children;
}
