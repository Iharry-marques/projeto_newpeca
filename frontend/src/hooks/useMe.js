// frontend/src/hooks/useMe.js
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

      // se 401, não autenticado
        if (!res.ok) {
          if (!cancelled) setData({ loading: false, authenticated: false, user: null, error: null });
          return;
        }

        const json = await res.json();
        const isAuth = !!json?.user;   // 👈 chave da correção
        if (!cancelled) setData({ loading: false, authenticated: isAuth, user: json.user, error: null });
      } catch (e) {
        if (!cancelled) setData({ loading: false, authenticated: false, user: null, error: String(e) });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return data;
}
