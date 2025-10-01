import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/client';

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/me');
        if (mounted) setState({ loading: false, ok: !!data?.user });
      } catch {
        if (mounted) setState({ loading: false, ok: false });
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (state.loading) return null; // opcional: spinner
  if (!state.ok) return <Navigate to="/login" replace />;
  return children;
}
