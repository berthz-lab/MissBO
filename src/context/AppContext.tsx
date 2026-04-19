import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Cliente, MedidasNoiva, FichaTecnica, Contrato,
  Orcamento, Agendamento, TipoAgendamento, Pagamento, Inspiracao, ParcelaProva,
  ConfigSistema,
} from '../types';
import { configStorage, calcCustoPorKm } from '../utils/storage';
import {
  clienteDb, medidasDb, fichaDb, contratoDb,
  orcamentoDb, agendamentoDb, pagamentoDb, inspiracaoDb,
  parcelaProvaDb, configDb, upsertArr,
} from '../utils/db';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { verifyTotp } from '../utils/totp';
import { useClienteSlice } from './slices/useClienteSlice';
import { useFichasSlice } from './slices/useFichasSlice';
import { useOrcamentoSlice } from './slices/useOrcamentoSlice';
import { useContratoSlice } from './slices/useContratoSlice';
import { useAgendaSlice } from './slices/useAgendaSlice';
import { useParcelaSlice } from './slices/useParcelaSlice';
import { useFinanceiroSlice } from './slices/useFinanceiroSlice';

// ── Tipo público do contexto ───────────────────────────────────────────────────
interface AppContextType {
  loading: boolean;
  toast: { msg: string; type: 'error' | 'success' } | null;
  clearToast: () => void;
  // Config
  config: ConfigSistema;
  saveConfig: (c: ConfigSistema) => void;
  custoPorKm: number;
  // Auth
  isLoggedIn: boolean;
  login: (email: string, senha: string) => Promise<{ error: string | null; mfaRequired: boolean }>;
  verifyOtpMfa: (code: string) => Promise<{ error: string | null }>;
  verifyTotpCode: (code: string) => boolean;
  logout: () => Promise<void>;
  // Valores ocultos
  valoresOcultos: boolean;
  toggleValores: () => void;
  // Clientes
  clientes: Cliente[];
  saveCliente: (c: Cliente) => void;
  deleteCliente: (id: string) => void;
  getCliente: (id: string) => Cliente | undefined;
  // Medidas
  medidas: MedidasNoiva[];
  saveMedidas: (m: MedidasNoiva) => void;
  deleteMedidas: (id: string) => void;
  getMedidasByCliente: (clienteId: string) => MedidasNoiva[];
  // Fichas técnicas
  fichasTecnicas: FichaTecnica[];
  saveFicha: (f: FichaTecnica) => void;
  deleteFicha: (id: string) => void;
  getFichasByCliente: (clienteId: string) => FichaTecnica[];
  // Contratos
  contratos: Contrato[];
  saveContrato: (c: Contrato) => void;
  deleteContrato: (id: string) => void;
  getContratosByCliente: (clienteId: string) => Contrato[];
  nextNumeroContrato: () => string;
  // Orçamentos
  orcamentos: Orcamento[];
  saveOrcamento: (o: Orcamento) => void;
  deleteOrcamento: (id: string) => void;
  getOrcamentosByCliente: (clienteId: string) => Orcamento[];
  nextNumeroOrcamento: () => string;
  // Agendamentos
  agendamentos: Agendamento[];
  saveAgendamento: (a: Agendamento) => void;
  deleteAgendamento: (id: string) => void;
  getAgendamentosByCliente: (clienteId: string) => Agendamento[];
  // Pagamentos
  pagamentos: Pagamento[];
  savePagamento: (p: Pagamento) => void;
  deletePagamento: (id: string) => void;
  getPagamentosByCliente: (clienteId: string) => Pagamento[];
  // Parcelas de Prova
  parcelasProva: ParcelaProva[];
  saveParcelaProva: (p: ParcelaProva) => void;
  deleteParcelaProva: (id: string) => void;
  getParcelasProvaByContrato: (contratoId: string) => ParcelaProva[];
  getParcelasProvaByCliente: (clienteId: string) => ParcelaProva[];
  // Inspirações
  inspiracoes: Inspiracao[];
  saveInspiracao: (i: Inspiracao) => void;
  deleteInspiracao: (id: string) => void;
  getInspiracoesCliente: (clienteId: string) => Inspiracao[];
  // Refresh
  refresh: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  // ── UI / Auth ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [valoresOcultos, setValoresOcultos] = useState(true);
  const toggleValores = useCallback(() => setValoresOcultos(v => !v), []);
  // MFA: ref evita stale closure no onAuthStateChange
  const mfaPendingRef = useRef(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [config, setConfig] = useState<ConfigSistema>(configStorage.get());

  // ── Estado de dados ────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [medidas, setMedidas] = useState<MedidasNoiva[]>([]);
  const [fichasTecnicas, setFichasTecnicas] = useState<FichaTecnica[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [parcelasProva, setParcelasProva] = useState<ParcelaProva[]>([]);
  const [inspiracoes, setInspiracoes] = useState<Inspiracao[]>([]);

  // ── Carregamento inicial ───────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        console.warn('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
        setLoading(false);
        return;
      }
      const [cls, meds, fichas, conts, orcs, ags, pags, parcelas, insps, cfg] = await Promise.all([
        clienteDb.getAll(), medidasDb.getAll(), fichaDb.getAll(),
        contratoDb.getAll(), orcamentoDb.getAll(), agendamentoDb.getAll(),
        pagamentoDb.getAll(), parcelaProvaDb.getAll(), inspiracaoDb.getAll(),
        configDb.get(),
      ]);

      // ── Reconciliação: cria agendamentos para provas com data ainda sem vínculo ──
      const provaTipoArr: TipoAgendamento[] = [
        'primeira_prova', 'segunda_prova', 'terceira_prova',
        'quarta_prova', 'quinta_prova', 'sexta_prova',
      ];
      const provaTipoMap = (num: number): TipoAgendamento =>
        num >= 1 && num <= 6 ? provaTipoArr[num - 1] : 'prova_final';
      const agsMap = new Map(ags.map(a => [a.id, a]));
      const novasAgs: Agendamento[] = [];
      const agsToUpdate: Agendamento[] = [];

      for (const p of parcelas) {
        if (!p.dataProva) continue;
        const agId = `ag-${p.id}`;
        const existing = agsMap.get(agId);
        const correctTipo = provaTipoMap(p.numero);
        if (existing && existing.tipo !== correctTipo) {
          const fixed = { ...existing, tipo: correctTipo };
          agsMap.set(agId, fixed);
          agsToUpdate.push(fixed);
          agendamentoDb.save(fixed).catch(console.error);
        }
        if (existing) continue;
        const ag: Agendamento = {
          id: agId, clienteId: p.clienteId, tipo: provaTipoMap(p.numero),
          data: p.dataProva, hora: p.horaProva || '10:00', duracao: 60,
          descricao: `${p.numero}ª Prova`,
          status: p.statusProva === 'realizada' ? 'concluido'
            : p.statusProva === 'cancelada' ? 'cancelado' : 'agendado',
          createdAt: new Date().toISOString(),
        };
        novasAgs.push(ag);
        agendamentoDb.save(ag).catch(console.error);
      }
      const updatedAgsMap = new Map(agsToUpdate.map(a => [a.id, a]));
      const correctedAgs = ags.map(a => updatedAgsMap.get(a.id) || a);

      setClientes(cls); setMedidas(meds); setFichasTecnicas(fichas);
      setContratos(conts); setOrcamentos(orcs);
      setAgendamentos([...correctedAgs, ...novasAgs]);
      setPagamentos(pags); setParcelasProva(parcelas); setInspiracoes(insps);
      setConfig(cfg); configStorage.save(cfg);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sessão Supabase ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      const logged = !!data.session;
      setIsLoggedIn(logged);
      if (logged) loadAll().catch(console.error);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mfaPendingRef.current) return; // MFA em andamento — ignora eventos intermediários
      setIsLoggedIn(!!session);
      if (event === 'SIGNED_IN') loadAll().catch(console.error);
      if (event === 'SIGNED_OUT') {
        setClientes([]); setMedidas([]); setFichasTecnicas([]);
        setContratos([]); setOrcamentos([]); setAgendamentos([]);
        setPagamentos([]); setParcelasProva([]); setInspiracoes([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadAll]);

  // ── bg: executa operação em background; em erro exibe toast ───────────────
  const bg = useCallback((op: () => Promise<void>) => {
    op().catch(err => {
      console.error('DB error:', err);
      const detail = err?.message || err?.details || err?.hint || '';
      const isPermission = detail.toLowerCase().includes('permission') ||
                           detail.toLowerCase().includes('policy') ||
                           detail.toLowerCase().includes('rls') ||
                           err?.code === '42501';
      const msg = isPermission
        ? 'Sem permissão no banco de dados — execute o schema SQL no Supabase.'
        : `Erro ao salvar: ${detail || 'verifique sua conexão.'}`;
      setToast({ msg, type: 'error' });
      loadAll().catch(console.error);
    });
  }, [loadAll]);

  // ── Config ─────────────────────────────────────────────────────────────────
  const saveConfig = useCallback((c: ConfigSistema) => {
    configStorage.save(c);
    setConfig(c);
    bg(() => configDb.save(c));
  }, [bg]);
  const custoPorKm = calcCustoPorKm(config);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, senha: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase não configurado.', mfaRequired: false };

    // ⚠️ Bloqueia onAuthStateChange ANTES do signInWithPassword.
    // O evento SIGNED_IN dispara durante o await — se o flag só fosse setado depois,
    // o listener consideraria o usuário logado e pularia o TOTP.
    if (config.mfaEnabled) mfaPendingRef.current = true;

    const { error: pwError } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (pwError) {
      mfaPendingRef.current = false; // senha errada — libera o listener
      return { error: 'E-mail ou senha incorretos.', mfaRequired: false };
    }

    // Se MFA desativado → login direto
    if (!config.mfaEnabled) {
      setIsLoggedIn(true);
      loadAll().catch(console.error);
      return { error: null, mfaRequired: false };
    }

    // MFA via TOTP — aguarda verificação do código antes de liberar a sessão
    return { error: null, mfaRequired: true };
  }, [config.mfaEnabled, loadAll]);

  /** Verifica código TOTP (Google Authenticator) — chamado pela tela de login */
  const verifyTotpCode = useCallback((code: string): boolean => {
    const secret = config.totpSecret;
    if (!secret) return false;
    const valid = verifyTotp(secret, code);
    if (valid) {
      mfaPendingRef.current = false;
      setIsLoggedIn(true);
      loadAll().catch(console.error);
    }
    return valid;
  }, [config.totpSecret, loadAll]);

  /** Mantido para compatibilidade — não usado com TOTP */
  const verifyOtpMfa = useCallback(async (_code: string) => {
    return { error: 'MFA via e-mail desativado. Use o Google Authenticator.' };
  }, []);

  const logout = useCallback(async () => {
    mfaPendingRef.current = false;
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setIsLoggedIn(false);
  }, []);

  // ── Setters compartilhados (objeto estável via useMemo seria ideal, ────────
  //    mas manter a ref aqui é seguro pois os slices só usam setState functions
  //    que são estáveis por definição do React)
  const setters = {
    setClientes, setContratos, setMedidas, setFichasTecnicas,
    setOrcamentos, setAgendamentos, setPagamentos, setParcelasProva, setInspiracoes,
  };

  // ── Slices ─────────────────────────────────────────────────────────────────
  const clienteSlice  = useClienteSlice(clientes, bg, setters);
  const fichasSlice   = useFichasSlice(medidas, fichasTecnicas, bg, { setMedidas, setFichasTecnicas });
  const orcSlice      = useOrcamentoSlice(orcamentos, bg, { setOrcamentos });
  const contratoSlice = useContratoSlice(contratos, orcamentos, bg, { setContratos, setParcelasProva, setOrcamentos });
  const agendaSlice   = useAgendaSlice(agendamentos, parcelasProva, bg, { setAgendamentos, setParcelasProva });
  const parcelaSlice  = useParcelaSlice(parcelasProva, agendamentos, contratos, bg, { setParcelasProva, setAgendamentos, setPagamentos });
  const finSlice      = useFinanceiroSlice(pagamentos, inspiracoes, bg, { setPagamentos, setInspiracoes });

  // ── Provider ───────────────────────────────────────────────────────────────
  return (
    <AppContext.Provider value={{
      loading,
      toast, clearToast,
      config, saveConfig, custoPorKm,
      isLoggedIn, login, verifyOtpMfa, verifyTotpCode, logout, valoresOcultos, toggleValores,
      clientes, ...clienteSlice,
      medidas, fichasTecnicas, ...fichasSlice,
      contratos, ...contratoSlice,
      orcamentos, ...orcSlice,
      agendamentos, ...agendaSlice,
      pagamentos, ...finSlice,
      parcelasProva, ...parcelaSlice,
      inspiracoes,
      refresh: () => { loadAll().catch(console.error); },
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
