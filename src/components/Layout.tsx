import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Ruler, FileText,
  Receipt, Calendar, BarChart3, Image, LogOut, Menu, X, ChevronRight, Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes',       icon: Users,           label: 'Clientes' },
  { to: '/medidas',        icon: Ruler,           label: 'Ficha da Noiva' },
  { to: '/contratos',      icon: FileText,        label: 'Contratos' },
  { to: '/orcamentos',     icon: Receipt,         label: 'Orçamentos' },
  { to: '/agenda',         icon: Calendar,        label: 'Agenda de Provas' },
  { to: '/financeiro',     icon: BarChart3,       label: 'Financeiro' },
  { to: '/inspiracoes',    icon: Image,           label: 'Painel de Inspiração' },
  { to: '/configuracoes',  icon: Settings,        label: 'Configurações' },
];

// MissBO logo mark — minimal diamond/ring icon
function MissboLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" stroke="#C9A96E" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="6"  stroke="white"   strokeWidth="1.5" />
      <path d="M11 16 L16 10 L21 16 L16 22 Z" stroke="white" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <MissboLogo size={32} />
          <div>
            <p className="text-xl font-bold tracking-widest text-white leading-none"
               style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '0.15em' }}>
              MISS<span style={{ color: '#C9A96E' }}>BO</span>
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'rgba(255,255,255,0.45)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <LogOut size={17} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F3F0' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 shadow-sidebar"
             style={{ background: '#0A0A0A' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 shadow-2xl z-50" style={{ background: '#0A0A0A' }}>
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
        <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <Menu size={20} />
          </button>
          <p className="text-sm font-bold tracking-widest" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '0.15em' }}>
            MISS<span style={{ color: '#C9A96E' }}>BO</span>
          </p>
          <div className="w-9" />
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
