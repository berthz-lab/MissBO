import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Ruler, FileText,
  Receipt, Calendar, BarChart3, Image, LogOut, Menu, X, ChevronRight, Settings,
  AlertCircle, CheckCircle2, Moon, Sun, ClipboardList,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import logoClaro from '../assets/logo-claro.png';
import logoClaroCentro from '../assets/logo-claro-centro.png';
import logoEscuro from '../assets/logo-escuro.png';

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes',       icon: Users,           label: 'Clientes' },
  { to: '/medidas',        icon: Ruler,           label: 'Ficha da Noiva' },
  { to: '/contratos',      icon: FileText,        label: 'Contratos' },
  { to: '/orcamentos',     icon: Receipt,         label: 'Orçamentos' },
  { to: '/agenda',         icon: Calendar,        label: 'Agenda de Provas' },
  { to: '/fichas-tecnicas', icon: ClipboardList,  label: 'Fichas Técnicas' },
  { to: '/financeiro',     icon: BarChart3,       label: 'Financeiro' },
  { to: '/inspiracoes',    icon: Image,           label: 'Painel de Inspiração' },
  { to: '/configuracoes',  icon: Settings,        label: 'Configurações' },
];


export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, toast, clearToast } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-10 pb-8 flex flex-col items-center flex-shrink-0">
        <img src={logoClaroCentro} alt="Miss Bô Ateliê" className="h-24 w-auto mb-1" />
        <div className="w-12 h-px mt-3" style={{ background: 'linear-gradient(to right, transparent, #b38779, transparent)' }} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto min-h-0">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span className="flex-1 text-sm">{label}</span>
            <ChevronRight size={13} className="opacity-30" />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 space-y-0.5 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/8"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden transition-colors ${isDark ? 'bg-[#121212]' : 'bg-brand-pearl'}`}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 shadow-sidebar"
             style={{ background: '#25282a' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 shadow-2xl z-50" style={{ background: '#25282a' }}>
            <button onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className={`lg:hidden flex items-center justify-between px-4 py-4 border-b shadow-sm transition-colors ${
          isDark ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-brand-silver/20'
        }`}>
          <button onClick={() => setSidebarOpen(true)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-brand-pearl text-brand-smoke'}`}>
            <Menu size={20} />
          </button>
          <img src={isDark ? logoClaro : logoEscuro} alt="Miss Bô Ateliê" className="h-16 w-auto" />
          <button onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-brand-pearl text-brand-smoke'}`}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium transition-all animate-fade-in ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error'
            ? <AlertCircle size={16} className="flex-shrink-0" />
            : <CheckCircle2 size={16} className="flex-shrink-0" />}
          <span>{toast.msg}</span>
          <button onClick={clearToast} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
