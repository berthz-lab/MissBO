import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Lock, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import logoClaroCentro from '../assets/logo-claro-centro.png';
import logoEscuroCentro from '../assets/logo-escuro-centro.png';

type Step = 'credentials' | 'totp';

export function Login() {
  const { login, verifyTotpCode } = useApp();

  // Etapa 1 — credenciais
  const [step, setStep]           = useState<Step>('credentials');
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [showSenha, setShowSenha] = useState(false);

  // Etapa 2 — TOTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs       = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 'totp') setTimeout(() => otpRefs[0].current?.focus(), 50);
  }, [step]);

  // ── Etapa 1: verificar e-mail + senha ─────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err, mfaRequired } = await login(email, senha);
    setLoading(false);
    if (err) { setError(err); return; }
    if (mfaRequired) setStep('totp');
  };

  // ── Etapa 2: verificar código TOTP (Google Authenticator) ─────────────────
  const submitTotp = (code: string) => {
    setError('');
    const valid = verifyTotpCode(code);
    if (!valid) {
      setError('Código inválido. Verifique o Google Authenticator.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs[0].current?.focus(), 50);
    }
    // Se válido, AppContext seta isLoggedIn=true e a rota redireciona
  };

  const handleOtpInput = (idx: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = char;
    setOtp(next);
    setError('');
    if (char && idx < 5) otpRefs[idx + 1].current?.focus();
    if (next.every(d => d !== '') && char) submitTotp(next.join(''));
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs[5].current?.focus();
      submitTotp(pasted);
    }
  };

  // ── Painel esquerdo (brand) ────────────────────────────────────────────────
  const BrandPanel = () => (
    <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center p-16 overflow-hidden"
         style={{ background: '#0A0A0A' }}>
      {[260, 400, 560].map((r, i) => (
        <div key={i} className="absolute rounded-full border border-white/5 pointer-events-none"
             style={{ width: r, height: r, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      ))}
      <div className="absolute top-1/2 w-full h-px pointer-events-none"
           style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.25), transparent)' }} />
      <div className="relative z-10 text-center">
        <div className="mb-16 flex justify-center">
          <img src={logoClaroCentro} alt="Miss Bô Ateliê" className="h-52 w-auto" />
        </div>
        <div className="space-y-4 text-left max-w-xs mx-auto">
          {['Gestão completa de noivas','Fichas de medidas detalhadas','Contratos e orçamentos',
            'Agenda de provas com alertas','Painel de inspirações','Dashboard financeiro'].map(item => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#b38779' }} />
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
  );

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#F5F3F0' }}>
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-10">
            <img src={logoEscuroCentro} alt="Miss Bô Ateliê" className="h-32 w-auto mx-auto" />
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8 border border-gray-100">

            {/* ── Etapa 1: e-mail + senha ── */}
            {step === 'credentials' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-4">
                    <Lock size={18} className="text-gray-600" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Bem-vinda de volta
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">Entre com seu e-mail e senha para continuar</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-5">
                  <div>
                    <label className="label">E-MAIL</label>
                    <input type="email" value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="seu@email.com"
                      className={`input-field ${error ? 'border-red-400' : ''}`}
                      autoFocus autoComplete="email" />
                  </div>
                  <div>
                    <label className="label">SENHA</label>
                    <div className="relative">
                      <input type={showSenha ? 'text' : 'password'} value={senha}
                        onChange={e => { setSenha(e.target.value); setError(''); }}
                        placeholder="Digite sua senha"
                        className={`input-field pr-12 ${error ? 'border-red-400' : ''}`}
                        autoComplete="current-password" />
                      <button type="button" onClick={() => setShowSenha(!showSenha)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 transition-colors">
                        {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                  </div>
                  <button type="submit" disabled={loading || !email || !senha}
                          className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <span className="inline-flex items-center gap-2"><Spinner /> Verificando...</span> : 'Entrar'}
                  </button>
                </form>
              </>
            )}

            {/* ── Etapa 2: código TOTP (Google Authenticator) ── */}
            {step === 'totp' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-4">
                    <Smartphone size={18} className="text-gray-600" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Verificação em 2 etapas
                  </h2>
                  <p className="text-sm text-gray-400 mt-2">
                    Abra o <span className="font-medium text-gray-600">Google Authenticator</span><br />
                    e insira o código de 6 dígitos
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="label text-center block mb-3">CÓDIGO DO AUTHENTICATOR</label>
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input key={idx}
                          ref={otpRefs[idx]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpInput(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                          className={`w-11 h-14 text-center text-xl font-bold border rounded-xl transition-all outline-none
                            ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-brand-gold bg-gray-50 focus:bg-white'}`}
                        />
                      ))}
                    </div>
                    {error && <p className="mt-3 text-xs text-red-500 text-center">{error}</p>}
                  </div>

                  <button type="button"
                          onClick={() => { if (otp.every(d => d !== '')) submitTotp(otp.join('')); }}
                          disabled={otp.some(d => !d)}
                          className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirmar
                  </button>

                  <button type="button" onClick={() => { setStep('credentials'); setError(''); setOtp(['','','','','','']); }}
                          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    ← Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
