// Em: frontend/src/hooks/useMe.js (VERSÃO MELHORADA)
import { useEffect, useState } from 'react';

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
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/me`,
          { credentials: 'include' }
        );

        if (!res.ok) {
          if (!cancelled) setData({ loading: false, authenticated: false, user: null, error: null });
          return;
        }

        const json = await res.json();

        // MUDANÇA AQUI: Lendo a chave 'authenticated' que o backend envia
        if (!cancelled) setData({ loading: false, authenticated: json.authenticated, user: json.user, error: null });
      } catch (e) {
        if (!cancelled) setData({ loading: false, authenticated: false, user: null, error: String(e) });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return data;
}