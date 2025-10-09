// Em: frontend/src/hooks/useMe.js (VERSÃO FINAL CORRIGIDA)
import { useEffect, useState } from 'react';
import api from '../api/client';

export function useMe() {
  const [data, setData] = useState({
    loading: true,
    authenticated: false,
    user: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/me');
        if (!cancelled) {
          setData({
            loading: false,
            authenticated: res.data.authenticated,
            user: res.data.user,
            error: null,
          });
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status === 401) {
          setData({ loading: false, authenticated: false, user: null, error: null });
          return;
        }
        setData({
          loading: false,
          authenticated: false,
          user: null,
          error: err?.message ?? String(err),
        });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return data;
}
