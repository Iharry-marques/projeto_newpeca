// frontend/src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import aprobiLogo from "../assets/aprobi-logo.jpg"; // <- caminho certo (pages -> assets)

const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function LoginPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // Se já estiver autenticado, manda pra /suno
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/me`, { credentials: "include" });
        if (!res.ok) return setChecking(false);
        const json = await res.json();
        if (!cancelled) {
          if (json?.user) {
            navigate("/suno", { replace: true });
          } else {
            setChecking(false);
          }
        }
      } catch {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleGoogle = () => {
    setRedirecting(true);
    window.location.assign(`${BACKEND}/auth/google`);
  };

  if (checking) {
    // tela bem simples enquanto checa sessão
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#334155",
        }}
      >
        Verificando sessão…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
        fontFamily: "sans-serif",
        color: "#0f172a",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          boxShadow:
            "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)",
          padding: 28,
          textAlign: "center",
        }}
      >
        <img
          src={aprobiLogo}
          alt="Aprobi"
          style={{
            width: 120,
            height: "auto",
            borderRadius: 12,
            display: "block",
            margin: "0 auto 16px auto",
            objectFit: "cover",
          }}
        />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          Aprobi • Login
        </h1>
        <p style={{ marginTop: 8, color: "#475569" }}>
          Entre com sua conta Google Suno.
        </p>

        <button
          onClick={handleGoogle}
          disabled={redirecting}
          style={{
            marginTop: 16,
            width: "100%",
            height: 44,
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: redirecting
              ? "#f1f5f9"
              : "linear-gradient(90deg, #ffc801, #ffb700)",
            color: redirecting ? "#64748b" : "#18181b",
            fontWeight: 700,
            cursor: redirecting ? "not-allowed" : "pointer",
          }}
        >
          {redirecting ? "Redirecionando…" : "Entrar com Google"}
        </button>
      </div>
    </div>
  );
}
