import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import logoEscuroCentro from './assets/logo-escuro-centro.png';

// Páginas carregadas sob demanda (lazy) — cada uma vira um chunk separado
const Login         = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard     = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Clientes      = lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));
const ClientePerfil = lazy(() => import('./pages/ClientePerfil').then(m => ({ default: m.ClientePerfil })));
const FichaNoiva    = lazy(() => import('./pages/FichaNoiva').then(m => ({ default: m.FichaNoiva })));
const Contratos     = lazy(() => import('./pages/Contratos').then(m => ({ default: m.Contratos })));
const Orcamentos    = lazy(() => import('./pages/Orcamentos').then(m => ({ default: m.Orcamentos })));
const Agenda        = lazy(() => import('./pages/Agenda').then(m => ({ default: m.Agenda })));
const Financeiro    = lazy(() => import('./pages/Financeiro').then(m => ({ default: m.Financeiro })));
const Inspiracoes   = lazy(() => import('./pages/Inspiracoes').then(m => ({ default: m.Inspiracoes })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then(m => ({ default: m.Configuracoes })));
const FichasTecnicas = lazy(() => import('./pages/FichasTecnicas').then(m => ({ default: m.FichasTecnicas })));

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
  // Enquanto Supabase verifica a sessão, exibe loading
  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
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
          <Suspense fallback={<LoadingScreen />}>
            <AppRoutes />
          </Suspense>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
