// Em: frontend/src/pages/Login.jsx (VERSÃO ATUALIZADA COM AMBOS OS LOGINS)

import React from 'react';
import { Link } from 'react-router-dom'; // Adicionamos a importação do Link
import aprobiLogo from '../assets/aprobi-logo.jpg';

// Esta variável agora aponta para a URL real do backend
const GOOGLE_AUTH_URL = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;

export default function LoginPage() {
  const handleLogin = () => {
    // Redireciona o navegador para a URL COMPLETA do backend para iniciar o login do Google
    window.location.href = GOOGLE_AUTH_URL;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
        fontFamily: 'sans-serif',
        color: '#0f172a',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
          padding: 28,
          textAlign: 'center',
        }}
      >
        <img
          src={aprobiLogo}
          alt="Aprobi"
          style={{
            width: 120,
            height: 'auto',
            borderRadius: 12,
            display: 'block',
            margin: '0 auto 16px auto',
            objectFit: 'cover',
          }}
        />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          Aprobi • Login
        </h1>
        
        {/* --- SEÇÃO PARA COLABORADORES SUNO --- */}
        <p style={{ marginTop: 16, color: '#475569', fontSize: '0.9rem' }}>
          Acesso para colaboradores Suno.
        </p>
        <button
          onClick={handleLogin}
          style={{
            marginTop: 8,
            width: '100%',
            height: 44,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(90deg, #ffc801, #ffb700)',
            color: '#18181b',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Entrar com Google
        </button>

        {/* --- DIVISOR (NOVO) --- */}
        <div style={{ margin: '24px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />

        {/* --- SEÇÃO PARA CLIENTES (NOVA) --- */}
        <p style={{ marginTop: 8, color: '#475569', fontSize: '0.9rem' }}>
          Acesso exclusivo para clientes.
        </p>
        <Link to="/client/login">
          <button
            style={{
              marginTop: 8,
              width: '100%',
              height: 44,
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: '#1e293b', // Cor escura para diferenciar
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Portal do Cliente
          </button>
        </Link>
      </div>
    </div>
  );
}