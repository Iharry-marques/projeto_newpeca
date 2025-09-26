// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './guards/ProtectedRoute';
import Login from './pages/Login.jsx';

/** 
 * 👉 AQUI você aponta para as SUAS PÁGINAS reais.
 * Exemplo de estrutura comum (ajuste os imports):
 */
// SUNO
// import SunoDashboard from './pages/Suno/Dashboard.jsx';
// import SunoCampanhas from './pages/Suno/Campanhas.jsx';
// import SunoCampanhaDetalhe from './pages/Suno/CampanhaDetalhe.jsx';

// CLIENTE
// import ClienteDashboard from './pages/Cliente/Dashboard.jsx';
// import ClienteCampanha from './pages/Cliente/Campanha.jsx';

// Enquanto você ajusta os imports/acertos de nome, deixo placeholders:
function SunoDashboard() { return <div style={{ padding: 24 }}><h1>Suno • Dashboard</h1></div>; }
function SunoCampanhas() { return <div style={{ padding: 24 }}><h1>Suno • Campanhas</h1></div>; }
function SunoCampanhaDetalhe() { return <div style={{ padding: 24 }}><h1>Suno • Campanha Detalhe</h1></div>; }

function ClienteDashboard() { return <div style={{ padding: 24 }}><h1>Cliente • Dashboard</h1></div>; }
function ClienteCampanha() { return <div style={{ padding: 24 }}><h1>Cliente • Campanha</h1></div>; }

function NotFound() { return <div style={{ padding: 24 }}><h1>404</h1></div>; }

export default function App() {
  return (
    <Routes>
      {/* raiz manda para /suno por padrão (ajuste se quiser) */}
      <Route path="/" element={<Navigate to="/suno" replace />} />

      {/* rota livre (quase não usada, o guard já redireciona) */}
      <Route path="/login" element={<Login />} />

      {/* Área Suno (apenas usuários com role SUNO) */}
      <Route
        path="/suno"
        element={
          <ProtectedRoute allowRoles={['SUNO']}>
            <SunoDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suno/campanhas"
        element={
          <ProtectedRoute allowRoles={['SUNO']}>
            <SunoCampanhas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suno/campanhas/:id"
        element={
          <ProtectedRoute allowRoles={['SUNO']}>
            <SunoCampanhaDetalhe />
          </ProtectedRoute>
        }
      />

      {/* Área Cliente (apenas CLIENT) */}
      <Route
        path="/cliente"
        element={
          <ProtectedRoute allowRoles={['CLIENT']}>
            <ClienteDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cliente/campanhas/:id"
        element={
          <ProtectedRoute allowRoles={['CLIENT']}>
            <ClienteCampanha />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
