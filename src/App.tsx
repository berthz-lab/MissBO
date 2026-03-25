import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { ClientePerfil } from './pages/ClientePerfil';
import { FichaNoiva } from './pages/FichaNoiva';
import { Contratos } from './pages/Contratos';
import { Orcamentos } from './pages/Orcamentos';
import { Agenda } from './pages/Agenda';
import { Financeiro } from './pages/Financeiro';
import { Inspiracoes } from './pages/Inspiracoes';
import { Configuracoes } from './pages/Configuracoes';
import { FichasTecnicas } from './pages/FichasTecnicas';
import logoEscuroCentro from './assets/logo-escuro-centro.png';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F3F0' }}>
      <div className="text-center">
        <img src={logoEscuroCentro} alt="Miss Bô Ateliê" className="h-36 w-auto mx-auto mb-8 animate-pulse" />
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#b38779',
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useApp();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (loading) return <LoadingScreen />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isLoggedIn } = useApp();

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/clientes"       element={<PrivateRoute><Clientes /></PrivateRoute>} />
      <Route path="/clientes/:id"   element={<PrivateRoute><ClientePerfil /></PrivateRoute>} />
      <Route path="/medidas"        element={<PrivateRoute><FichaNoiva /></PrivateRoute>} />
      <Route path="/contratos"      element={<PrivateRoute><Contratos /></PrivateRoute>} />
      <Route path="/orcamentos"     element={<PrivateRoute><Orcamentos /></PrivateRoute>} />
      <Route path="/agenda"         element={<PrivateRoute><Agenda /></PrivateRoute>} />
      <Route path="/financeiro"     element={<PrivateRoute><Financeiro /></PrivateRoute>} />
      <Route path="/fichas-tecnicas" element={<PrivateRoute><FichasTecnicas /></PrivateRoute>} />
      <Route path="/inspiracoes"    element={<PrivateRoute><Inspiracoes /></PrivateRoute>} />
      <Route path="/configuracoes"  element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
