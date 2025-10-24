// frontend/src/pages/LoginPage.jsx

export default function LoginPage() {
  const handleLogin = () => {
    // vai direto pro backend iniciar o OAuth
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Aprobi • Login</h1>
      <p>Entre com sua conta Suno.</p>
      <button onClick={handleLogin}>Entrar com SUNO</button>
    </div>
  );
}
