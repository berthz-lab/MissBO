import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

function DiamondIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" stroke="#C9A96E" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="11" stroke="white"   strokeWidth="1.5" />
      <path d="M15 24 L24 14 L33 24 L24 34 Z" stroke="white" strokeWidth="1.8" fill="none" />
      <path d="M15 24 L24 20 L33 24" stroke="white" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 500));
    if (login(senha)) { navigate('/dashboard'); }
    else { setError('Senha incorreta. Tente novamente.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: dark brand panel ────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center p-16 overflow-hidden"
           style={{ background: '#0A0A0A' }}>
        {/* Decorative rings */}
        {[260, 400, 560].map((r, i) => (
          <div key={i} className="absolute rounded-full border border-white/5 pointer-events-none"
               style={{ width: r, height: r, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        ))}
        {/* Gold horizontal line */}
        <div className="absolute top-1/2 w-full h-px pointer-events-none"
             style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.25), transparent)' }} />

        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <DiamondIcon />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2"
              style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '0.2em' }}>
            MISS<span style={{ color: '#C9A96E' }}>BO</span>
          </h1>
          <p className="text-xs mb-16" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em' }}>
            HAUTE COUTURE
          </p>

          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              'Gestão completa de noivas',
              'Fichas de medidas detalhadas',
              'Contratos e orçamentos',
              'Agenda de provas com alertas',
              'Painel de inspirações',
              'Dashboard financeiro',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#C9A96E' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-10 text-center text-xs italic"
           style={{ color: 'rgba(255,255,255,0.18)', fontFamily: "'Playfair Display', serif" }}>
          "Cada vestido conta uma história única."
        </p>
      </div>

      {/* ── Right: form ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#F5F3F0' }}>
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '0.18em' }}>
              MISS<span style={{ color: '#C9A96E' }}>BO</span>
            </h1>
            <p className="text-xs mt-1" style={{ color: '#8A8A8A', letterSpacing: '0.25em' }}>HAUTE COUTURE</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-4">
                <Lock size={18} className="text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                Bem-vinda de volta
              </h2>
              <p className="text-sm text-gray-400 mt-1">Entre com sua senha para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Usuário</label>
                <input type="text" value="missbo" readOnly
                       className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>

              <div>
                <label className="label">Senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => { setSenha(e.target.value); setError(''); }}
                    placeholder="Digite sua senha"
                    className={`input-field pr-12 ${error ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 transition-colors">
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              </div>

              <button type="submit" disabled={loading || !senha}
                      className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading
                  ? <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Entrando...
                    </span>
                  : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
