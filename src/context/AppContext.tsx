import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Cliente, MedidasNoiva, FichaTecnica, Contrato,
  Orcamento, Agendamento, Pagamento, Inspiracao, ParcelaProva,
  ConfigSistema,
} from '../types';
import {
  clienteStorage, medidasStorage, fichaStorage, contratoStorage,
  orcamentoStorage, agendamentoStorage, pagamentoStorage, inspiracaoStorage,
  parcelaProvaStorage, gerarParcelasContrato,
  configStorage, calcCustoPorKm,
  authStorage, seedDemoData,
} from '../utils/storage';
import {
  clienteDb, medidasDb, fichaDb, contratoDb,
  orcamentoDb, agendamentoDb, pagamentoDb, inspiracaoDb,
  parcelaProvaDb, gerarParcelasDb, configDb, upsertArr,
} from '../utils/db';
import { isSupabaseConfigured } from '../utils/supabase';

/** true quando as variáveis VITE_SUPABASE_* estão configuradas */
const USE_DB = isSupabaseConfigured();

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
  login: (senha: string) => boolean;
  logout: () => void;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const clearToast = () => setToast(null);
  const [isLoggedIn, setIsLoggedIn] = useState(authStorage.isLoggedIn());
  const [config, setConfig] = useState<ConfigSistema>(configStorage.get());
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [medidas, setMedidas] = useState<MedidasNoiva[]>([]);
  const [fichasTecnicas, setFichasTecnicas] = useState<FichaTecnica[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [parcelasProva, setParcelasProva] = useState<ParcelaProva[]>([]);
  const [inspiracoes, setInspiracoes] = useState<Inspiracao[]>([]);

  // ── Carregamento inicial ──────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      if (USE_DB) {
        const [cls, meds, fichas, conts, orcs, ags, pags, parcelas, insps, cfg] = await Promise.all([
          clienteDb.getAll(), medidasDb.getAll(), fichaDb.getAll(),
          contratoDb.getAll(), orcamentoDb.getAll(), agendamentoDb.getAll(),
          pagamentoDb.getAll(), parcelaProvaDb.getAll(), inspiracaoDb.getAll(),
          configDb.get(),
        ]);
        setClientes(cls); setMedidas(meds); setFichasTecnicas(fichas);
        setContratos(conts); setOrcamentos(orcs); setAgendamentos(ags);
        setPagamentos(pags); setParcelasProva(parcelas); setInspiracoes(insps);
        setConfig(cfg); configStorage.save(cfg); // mantém localStorage em sincronia
      } else {
        seedDemoData();
        setClientes(clienteStorage.getAll()); setMedidas(medidasStorage.getAll());
        setFichasTecnicas(fichaStorage.getAll()); setContratos(contratoStorage.getAll());
        setOrcamentos(orcamentoStorage.getAll()); setAgendamentos(agendamentoStorage.getAll());
        setPagamentos(pagamentoStorage.getAll()); setParcelasProva(parcelaProvaStorage.getAll());
        setInspiracoes(inspiracaoStorage.getAll());
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll().catch(console.error); }, [loadAll]);

  const saveConfig = (c: ConfigSistema) => {
    configStorage.save(c);
    setConfig(c);
    if (USE_DB) bg(() => configDb.save(c));
  };
  const custoPorKm = calcCustoPorKm(config);

  const login = (senha: string): boolean => {
    if (senha === 'atelie2024') { authStorage.login(); setIsLoggedIn(true); return true; }
    return false;
  };
  const logout = () => { authStorage.logout(); setIsLoggedIn(false); };

  // ── Helpers internos ──────────────────────────────────────────────────────
  /** Executa operação no Supabase; em caso de erro, exibe toast e recarrega o estado */
  const bg = (op: () => Promise<void>) => {
    op().catch(err => {
      console.error('DB error:', err);
      setToast({ msg: 'Erro ao salvar — verifique sua conexão.', type: 'error' });
      loadAll().catch(console.error);
    });
  };

  // ── Clientes ─────────────────────────────────────────────────────────────
  const saveCliente = (c: Cliente) => {
    setClientes(prev => upsertArr(prev, c));
    if (USE_DB) bg(() => clienteDb.save(c));
    else clienteStorage.save(c);
  };

  const deleteCliente = (id: string) => {
    // Optimistic: remove todos os dados associados do estado
    setClientes(prev => prev.filter(c => c.id !== id));
    setContratos(prev => prev.filter(c => c.clienteId !== id));
    setMedidas(prev => prev.filter(m => m.clienteId !== id));
    setFichasTecnicas(prev => prev.filter(f => f.clienteId !== id));
    setOrcamentos(prev => prev.filter(o => o.clienteId !== id));
    setAgendamentos(prev => prev.filter(a => a.clienteId !== id));
    setPagamentos(prev => prev.filter(p => p.clienteId !== id));
    setParcelasProva(prev => prev.filter(p => p.clienteId !== id));
    setInspiracoes(prev => prev.filter(i => i.clienteId !== id));

    if (USE_DB) {
      // ON DELETE CASCADE no banco cuida dos registros filhos
      bg(() => clienteDb.delete(id));
    } else {
      // localStorage: cascade manual
      contratoStorage.getAll()
        .filter(c => c.clienteId === id)
        .forEach(c => {
          parcelaProvaStorage.deleteByContrato(c.id);
          pagamentoStorage.getAll()
            .filter(p => p.id.startsWith(`prov-${c.id}-`))
            .forEach(p => pagamentoStorage.delete(p.id));
          contratoStorage.delete(c.id);
        });
      pagamentoStorage.getAll().filter(p => p.clienteId === id).forEach(p => pagamentoStorage.delete(p.id));
      medidasStorage.getAll().filter(m => m.clienteId === id).forEach(m => medidasStorage.delete(m.id));
      fichaStorage.getAll().filter(f => f.clienteId === id).forEach(f => fichaStorage.delete(f.id));
      orcamentoStorage.getAll().filter(o => o.clienteId === id).forEach(o => orcamentoStorage.delete(o.id));
      agendamentoStorage.getAll().filter(a => a.clienteId === id).forEach(a => agendamentoStorage.delete(a.id));
      inspiracaoStorage.getAll().filter(i => i.clienteId === id).forEach(i => inspiracaoStorage.delete(i.id));
      clienteStorage.delete(id);
    }
  };
  const getCliente = (id: string) => clientes.find(c => c.id === id);

  // ── Medidas ───────────────────────────────────────────────────────────────
  const saveMedidas = (m: MedidasNoiva) => {
    setMedidas(prev => upsertArr(prev, m));
    if (USE_DB) bg(() => medidasDb.save(m));
    else { medidasStorage.save(m); }
  };
  const deleteMedidas = (id: string) => {
    setMedidas(prev => prev.filter(m => m.id !== id));
    if (USE_DB) bg(() => medidasDb.delete(id));
    else medidasStorage.delete(id);
  };
  const getMedidasByCliente = (clienteId: string) => medidas.filter(m => m.clienteId === clienteId);

  // ── Fichas ────────────────────────────────────────────────────────────────
  const saveFicha = (f: FichaTecnica) => {
    setFichasTecnicas(prev => upsertArr(prev, f));
    if (USE_DB) bg(() => fichaDb.save(f));
    else fichaStorage.save(f);
  };
  const deleteFicha = (id: string) => {
    setFichasTecnicas(prev => prev.filter(f => f.id !== id));
    if (USE_DB) bg(() => fichaDb.delete(id));
    else fichaStorage.delete(id);
  };
  const getFichasByCliente = (clienteId: string) => fichasTecnicas.filter(f => f.clienteId === clienteId);

  // ── Contratos ─────────────────────────────────────────────────────────────
  const saveContrato = (c: Contrato) => {
    setContratos(prev => upsertArr(prev, c));

    if (USE_DB) {
      bg(async () => {
        await contratoDb.save(c);
        if (c.quantidadeProvas && c.quantidadeProvas > 0) {
          const novas = await gerarParcelasDb(c.id, c.clienteId, c.quantidadeProvas, c.valorTotal, c.valorEntrada);
          setParcelasProva(novas.length > 0
            ? prev => {
                const sem = prev.filter(p => p.contratoId !== c.id);
                return [...sem, ...novas];
              }
            : p => p,
          );
        }
        if (c.orcamentoId) {
          const orc = orcamentos.find(o => o.id === c.orcamentoId);
          if (orc && orc.status === 'pendente') {
            const updated = { ...orc, status: 'aprovado' as const };
            setOrcamentos(prev => upsertArr(prev, updated));
            await orcamentoDb.save(updated);
          }
        }
      });
    } else {
      contratoStorage.save(c);
      if (c.quantidadeProvas && c.quantidadeProvas > 0) {
        gerarParcelasContrato(c.id, c.clienteId, c.quantidadeProvas, c.valorTotal, c.valorEntrada);
        setParcelasProva(parcelaProvaStorage.getAll());
      }
      if (c.orcamentoId) {
        const orc = orcamentoStorage.getAll().find(o => o.id === c.orcamentoId);
        if (orc && orc.status === 'pendente') {
          orcamentoStorage.save({ ...orc, status: 'aprovado' });
          setOrcamentos(orcamentoStorage.getAll());
        }
      }
    }
  };
  const deleteContrato = (id: string) => {
    setContratos(prev => prev.filter(c => c.id !== id));
    setParcelasProva(prev => prev.filter(p => p.contratoId !== id));
    if (USE_DB) bg(() => contratoDb.delete(id)); // CASCADE apaga parcelas_prova
    else {
      parcelaProvaStorage.deleteByContrato(id);
      contratoStorage.delete(id);
    }
  };
  const getContratosByCliente = (clienteId: string) => contratos.filter(c => c.clienteId === clienteId);
  const nextNumeroContrato = () => {
    const max = contratos.reduce((acc, c) => {
      const n = parseInt(c.numero.replace(/\D/g, ''));
      return n > acc ? n : acc;
    }, 0);
    return String(max + 1).padStart(4, '0');
  };

  // ── Orçamentos ────────────────────────────────────────────────────────────
  const saveOrcamento = (o: Orcamento) => {
    setOrcamentos(prev => upsertArr(prev, o));
    if (USE_DB) bg(() => orcamentoDb.save(o));
    else orcamentoStorage.save(o);
  };
  const deleteOrcamento = (id: string) => {
    setOrcamentos(prev => prev.filter(o => o.id !== id));
    if (USE_DB) bg(() => orcamentoDb.delete(id));
    else orcamentoStorage.delete(id);
  };
  const getOrcamentosByCliente = (clienteId: string) => orcamentos.filter(o => o.clienteId === clienteId);
  const nextNumeroOrcamento = () => {
    const max = orcamentos.reduce((acc, o) => {
      const n = parseInt(o.numero.replace(/\D/g, ''));
      return n > acc ? n : acc;
    }, 0);
    return `ORC-${String(max + 1).padStart(4, '0')}`;
  };

  // ── Agendamentos ──────────────────────────────────────────────────────────
  const saveAgendamento = (a: Agendamento) => {
    setAgendamentos(prev => upsertArr(prev, a));
    if (USE_DB) bg(() => agendamentoDb.save(a));
    else agendamentoStorage.save(a);
  };
  const deleteAgendamento = (id: string) => {
    setAgendamentos(prev => prev.filter(a => a.id !== id));
    if (USE_DB) bg(() => agendamentoDb.delete(id));
    else agendamentoStorage.delete(id);
  };
  const getAgendamentosByCliente = (clienteId: string) => agendamentos.filter(a => a.clienteId === clienteId);

  // ── Pagamentos ────────────────────────────────────────────────────────────
  const savePagamento = (p: Pagamento) => {
    setPagamentos(prev => upsertArr(prev, p));
    if (USE_DB) bg(() => pagamentoDb.save(p));
    else pagamentoStorage.save(p);
  };
  const deletePagamento = (id: string) => {
    setPagamentos(prev => prev.filter(p => p.id !== id));
    if (USE_DB) bg(() => pagamentoDb.delete(id));
    else pagamentoStorage.delete(id);
  };
  const getPagamentosByCliente = (clienteId: string) => pagamentos.filter(p => p.clienteId === clienteId);

  // ── Parcelas de Prova ─────────────────────────────────────────────────────
  const provaParamentoId = (p: ParcelaProva) => `prov-${p.contratoId}-${p.numero}`;

  const saveParcelaProva = (p: ParcelaProva) => {
    let updated = { ...p };

    if (p.pago && p.dataPagamento) {
      const pagId = p.pagamentoId || provaParamentoId(p);
      const contrato = contratos.find(c => c.id === p.contratoId);
      const valorEfetivo = p.valorPago ?? p.valorParcela;
      const pag: Pagamento = {
        id: pagId, clienteId: p.clienteId, contratoId: p.contratoId,
        descricao: `${p.numero}ª Prova — ${contrato?.descricaoPecas || 'Vestido'}`,
        valor: valorEfetivo, data: p.dataPagamento, tipo: 'parcela',
        status: 'pago', formaPagamento: p.formaPagamento,
        createdAt: new Date().toISOString(),
      };
      setPagamentos(prev => upsertArr(prev, pag));
      updated = { ...updated, pagamentoId: pagId };
      if (USE_DB) bg(() => pagamentoDb.save(pag));
      else { pagamentoStorage.save(pag); }
    } else if (!p.pago) {
      const idToDelete = p.pagamentoId || provaParamentoId(p);
      setPagamentos(prev => prev.filter(x => x.id !== idToDelete));
      updated = { ...updated, pagamentoId: undefined, valorPago: undefined,
        dataPagamento: undefined, formaPagamento: undefined };
      if (USE_DB) bg(() => pagamentoDb.delete(idToDelete));
      else pagamentoStorage.delete(idToDelete);
    }

    setParcelasProva(prev => upsertArr(prev, updated));
    if (USE_DB) bg(() => parcelaProvaDb.save(updated));
    else { parcelaProvaStorage.save(updated); setPagamentos(pagamentoStorage.getAll()); }
  };

  const deleteParcelaProva = (id: string) => {
    const parcela = parcelasProva.find(p => p.id === id);
    if (parcela?.pagamentoId) {
      setPagamentos(prev => prev.filter(p => p.id !== parcela.pagamentoId));
      if (USE_DB) bg(() => pagamentoDb.delete(parcela.pagamentoId!));
      else pagamentoStorage.delete(parcela.pagamentoId);
    }
    setParcelasProva(prev => prev.filter(p => p.id !== id));
    if (USE_DB) bg(() => parcelaProvaDb.delete(id));
    else parcelaProvaStorage.delete(id);
  };
  const getParcelasProvaByContrato = (contratoId: string) =>
    parcelasProva.filter(p => p.contratoId === contratoId);
  const getParcelasProvaByCliente = (clienteId: string) =>
    parcelasProva.filter(p => p.clienteId === clienteId);

  // ── Inspirações ───────────────────────────────────────────────────────────
  const saveInspiracao = (i: Inspiracao) => {
    setInspiracoes(prev => upsertArr(prev, i));
    if (USE_DB) bg(() => inspiracaoDb.save(i));
    else inspiracaoStorage.save(i);
  };
  const deleteInspiracao = (id: string) => {
    setInspiracoes(prev => prev.filter(i => i.id !== id));
    if (USE_DB) bg(() => inspiracaoDb.delete(id));
    else inspiracaoStorage.delete(id);
  };
  const getInspiracoesCliente = (clienteId: string) => inspiracoes.filter(i => i.clienteId === clienteId);

  return (
    <AppContext.Provider value={{
      loading,
      toast, clearToast,
      config, saveConfig, custoPorKm,
      isLoggedIn, login, logout,
      clientes, saveCliente, deleteCliente, getCliente,
      medidas, saveMedidas, deleteMedidas, getMedidasByCliente,
      fichasTecnicas, saveFicha, deleteFicha, getFichasByCliente,
      contratos, saveContrato, deleteContrato, getContratosByCliente, nextNumeroContrato,
      orcamentos, saveOrcamento, deleteOrcamento, getOrcamentosByCliente, nextNumeroOrcamento,
      agendamentos, saveAgendamento, deleteAgendamento, getAgendamentosByCliente,
      pagamentos, savePagamento, deletePagamento, getPagamentosByCliente,
      parcelasProva, saveParcelaProva, deleteParcelaProva,
      getParcelasProvaByContrato, getParcelasProvaByCliente,
      inspiracoes, saveInspiracao, deleteInspiracao, getInspiracoesCliente,
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
