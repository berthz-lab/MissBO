import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z" />
          </svg>
        </div>
        <p className="text-rose-400 text-sm font-medium tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
          Carregando…
        </p>
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
      <Route path="/inspiracoes"    element={<PrivateRoute><Inspiracoes /></PrivateRoute>} />
      <Route path="/configuracoes"  element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
