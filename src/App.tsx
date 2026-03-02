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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isLoggedIn } = useApp();

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
      <Route path="/clientes/:id" element={<PrivateRoute><ClientePerfil /></PrivateRoute>} />
      <Route path="/medidas" element={<PrivateRoute><FichaNoiva /></PrivateRoute>} />
      <Route path="/contratos" element={<PrivateRoute><Contratos /></PrivateRoute>} />
      <Route path="/orcamentos" element={<PrivateRoute><Orcamentos /></PrivateRoute>} />
      <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
      <Route path="/financeiro" element={<PrivateRoute><Financeiro /></PrivateRoute>} />
      <Route path="/inspiracoes" element={<PrivateRoute><Inspiracoes /></PrivateRoute>} />
      <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
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
