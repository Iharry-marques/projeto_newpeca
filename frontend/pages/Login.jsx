// frontend/src/pages/Login.jsx
export default function Login() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Entrar</h1>
      <p>Você será redirecionado para o Google.</p>
      <button onClick={() => (window.location.href = 'http://localhost:3000/auth/google')}>
        Entrar com Google
      </button>
    </div>
  );
}
