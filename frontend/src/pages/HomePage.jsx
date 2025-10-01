// frontend/src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useMe } from '../hooks/useMe';

export default function HomePage() {
  const { data, loading, error } = useMe();

  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>Erro: {error.message}</div>;

  const user = data?.user;

  return (
    <div style={{ padding: 24 }}>
      <h1>Área Suno</h1>
      {user ? (
        <>
          <p>Bem-vindo, <strong>{user.name || user.email}</strong></p>
          <nav style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <Link to="/clients">Gerenciar Clientes</Link>
            <Link to="/client">Área do Cliente (demo)</Link>
          </nav>
        </>
      ) : (
        <>
          <p>Você não está autenticado.</p>
          <a href="http://localhost:3000/auth/google">Entrar com Google</a>
        </>
      )}
    </div>
  );
}
