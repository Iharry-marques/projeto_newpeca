// Em: frontend/src/pages/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "../guards/ProtectedRoute";
import LoginPageSuno from "./LoginPageSuno";
import LoginPageProduceria from "./LoginPageProduceria";
import HomePage from "./HomePage";
import ClientLoginPage from "./ClientLoginPage";
import ClientDashboard from "./ClientDashboard";
import ClientApprovalPage from "./ClientApprovalPage";
import ClientManagementPage from "./ClientManagementPage";
import { useMe } from "../hooks/useMe";
import Spinner from "../components/Spinner";

function App() {
  const { authenticated, loading } = useMe();
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const [needsDriveConsent, setNeedsDriveConsent] = useState(false);

  useEffect(() => {
    // Só tenta buscar o token quando:
    // - já terminou o loading do /me
    // - o usuário está autenticado
    if (loading || !authenticated) {
      setGoogleAccessToken(null);
      setNeedsDriveConsent(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/me/token`,
          { credentials: "include" }
        );

        if (!res.ok) {
          // 401 => sem token do Drive
          if (res.status === 401 && !cancelled) {
            setNeedsDriveConsent(true);
            setGoogleAccessToken(null);
          }
          return;
        }

        const { accessToken } = await res.json();
        if (!cancelled) {
          setGoogleAccessToken(accessToken || null);
          setNeedsDriveConsent(false);
        }
      } catch (err) {
        console.error("Erro na requisição para /me/token:", err);
        if (!cancelled) {
          setGoogleAccessToken(null);
          setNeedsDriveConsent(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authenticated, loading]);

  function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

useEffect(() => {
  let cancelled = false;

  async function bootPicker() {
    if (!googleAccessToken) return;
    try {
      // carrega api.js uma única vez
      await loadScriptOnce('https://apis.google.com/js/api.js');

      // garante que a lib 'picker' esteja carregada
      await new Promise((resolve) => {
        window.gapi.load('picker', resolve);
      });
    } catch (e) {
      if (!cancelled) console.error('Falha ao preparar Google Picker', e);
    }
  }

  bootPicker();
  return () => { cancelled = true; };
}, [googleAccessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: "0.95rem" },
        }}
      />
      {/* Banner de consentimento do Drive */}
      {needsDriveConsent && (
        <div className="my-4 p-3 rounded-md border border-yellow-400 bg-yellow-50 text-yellow-800">
          <p className="mb-2">
            Não foi possível obter a permissão para acessar o Google Drive.
            Conecte sua conta e tente novamente.
          </p>
          <a
            className="btn"
            href={`${import.meta.env.VITE_BACKEND_URL}/auth/google/drive-consent`}
          >
            Conectar ao Google Drive
          </a>
        </div>
      )}

      <Routes>
        {/* Login Suno */}
        <Route
          path="/login"
          element={
            authenticated ? <Navigate to="/" replace /> : <LoginPageSuno />
          }
        />

        {/* Login Produceria */}
        <Route
          path="/login/produceria"
          element={
            authenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPageProduceria />
            )
          }
        />

        {/* Home protegida */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage googleAccessToken={googleAccessToken} />
            </ProtectedRoute>
          }
        />

        {/* Gestão de clientes (protegida) */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <ClientManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Rotas públicas para clientes externos */}
        <Route path="/client/login" element={<ClientLoginPage />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/approval/:hash" element={<ClientApprovalPage />} />
      </Routes>
    </>
  );
}

export default App;
