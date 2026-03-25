import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Cliente, MedidasNoiva, FichaTecnica, Contrato,
  Orcamento, Agendamento, TipoAgendamento, Pagamento, Inspiracao, ParcelaProva,
  ConfigSistema,
} from '../types';
import { configStorage, calcCustoPorKm, authStorage } from '../utils/storage';
import {
  clienteDb, medidasDb, fichaDb, contratoDb,
  orcamentoDb, agendamentoDb, pagamentoDb, inspiracaoDb,
  parcelaProvaDb, gerarParcelasDb, configDb, upsertArr,
} from '../utils/db';
import { isSupabaseConfigured } from '../utils/supabase';

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
      // ── Reconciliação: cria agendamentos para provas com data que ainda não têm vínculo
      const provaTipoMapArr: TipoAgendamento[] = [
        'primeira_prova', 'segunda_prova', 'terceira_prova',
        'quarta_prova', 'quinta_prova', 'sexta_prova',
      ];
      const provaTipoMap = (num: number): TipoAgendamento =>
        num >= 1 && num <= 6 ? provaTipoMapArr[num - 1] : 'prova_final';
      const agsMap = new Map(ags.map(a => [a.id, a]));
      const novasAgs: Agendamento[] = [];
      const agsToUpdate: Agendamento[] = [];
      for (const p of parcelas) {
        if (!p.dataProva) continue;
        const agId = `ag-${p.id}`;
        const existing = agsMap.get(agId);
        const correctTipo = provaTipoMap(p.numero);
        // Corrige tipo se mudou (ex: prova_final → terceira_prova)
        if (existing && existing.tipo !== correctTipo) {
          const fixed = { ...existing, tipo: correctTipo };
          agsMap.set(agId, fixed);
          agsToUpdate.push(fixed);
          agendamentoDb.save(fixed).catch(console.error);
        }
        if (existing) continue; // já vinculado
        const ag: Agendamento = {
          id: agId,
          clienteId: p.clienteId,
          tipo: provaTipoMap(p.numero),
          data: p.dataProva,
          hora: p.horaProva || '10:00',
          duracao: 60,
          descricao: `${p.numero}ª Prova`,
          status: p.statusProva === 'realizada' ? 'concluido'
            : p.statusProva === 'cancelada' ? 'cancelado'
            : 'agendado',
          createdAt: new Date().toISOString(),
        };
        novasAgs.push(ag);
        // Persiste no banco em background
        agendamentoDb.save(ag).catch(console.error);
      }
      // Aplica correções de tipo nos agendamentos existentes
      const updatedAgsMap = new Map(agsToUpdate.map(a => [a.id, a]));
      const correctedAgs = ags.map(a => updatedAgsMap.get(a.id) || a);
      const allAgs = [...correctedAgs, ...novasAgs];

      setClientes(cls); setMedidas(meds); setFichasTecnicas(fichas);
      setContratos(conts); setOrcamentos(orcs); setAgendamentos(allAgs);
      setPagamentos(pags); setParcelasProva(parcelas); setInspiracoes(insps);
      setConfig(cfg); configStorage.save(cfg);
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
    bg(() => configDb.save(c));
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
  };

  // ── Clientes ─────────────────────────────────────────────────────────────
  const saveCliente = (c: Cliente) => {
    setClientes(prev => upsertArr(prev, c));
    bg(() => clienteDb.save(c));
  };

  const deleteCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    setContratos(prev => prev.filter(c => c.clienteId !== id));
    setMedidas(prev => prev.filter(m => m.clienteId !== id));
    setFichasTecnicas(prev => prev.filter(f => f.clienteId !== id));
    setOrcamentos(prev => prev.filter(o => o.clienteId !== id));
    setAgendamentos(prev => prev.filter(a => a.clienteId !== id));
    setPagamentos(prev => prev.filter(p => p.clienteId !== id));
    setParcelasProva(prev => prev.filter(p => p.clienteId !== id));
    setInspiracoes(prev => prev.filter(i => i.clienteId !== id));
    bg(() => clienteDb.delete(id)); // ON DELETE CASCADE cuida dos filhos
  };
  const getCliente = (id: string) => clientes.find(c => c.id === id);

  // ── Medidas ───────────────────────────────────────────────────────────────
  const saveMedidas = (m: MedidasNoiva) => {
    setMedidas(prev => upsertArr(prev, m));
    bg(() => medidasDb.save(m));
  };
  const deleteMedidas = (id: string) => {
    setMedidas(prev => prev.filter(m => m.id !== id));
    bg(() => medidasDb.delete(id));
  };
  const getMedidasByCliente = (clienteId: string) => medidas.filter(m => m.clienteId === clienteId);

  // ── Fichas ────────────────────────────────────────────────────────────────
  const saveFicha = (f: FichaTecnica) => {
    setFichasTecnicas(prev => upsertArr(prev, f));
    bg(() => fichaDb.save(f));
  };
  const deleteFicha = (id: string) => {
    setFichasTecnicas(prev => prev.filter(f => f.id !== id));
    bg(() => fichaDb.delete(id));
  };
  const getFichasByCliente = (clienteId: string) => fichasTecnicas.filter(f => f.clienteId === clienteId);

  // ── Contratos ─────────────────────────────────────────────────────────────
  const saveContrato = (c: Contrato) => {
    setContratos(prev => upsertArr(prev, c));
    bg(async () => {
      await contratoDb.save(c);
      if (c.quantidadeProvas && c.quantidadeProvas > 0) {
        const novas = await gerarParcelasDb(c.id, c.clienteId, c.quantidadeProvas, c.valorTotal, c.valorEntrada);
        if (novas.length > 0) {
          setParcelasProva(prev => {
            const sem = prev.filter(p => p.contratoId !== c.id);
            return [...sem, ...novas];
          });
        }
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
  };
  const deleteContrato = (id: string) => {
    setContratos(prev => prev.filter(c => c.id !== id));
    setParcelasProva(prev => prev.filter(p => p.contratoId !== id));
    bg(() => contratoDb.delete(id)); // CASCADE apaga parcelas_prova
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
    bg(() => orcamentoDb.save(o));
  };
  const deleteOrcamento = (id: string) => {
    setOrcamentos(prev => prev.filter(o => o.id !== id));
    bg(() => orcamentoDb.delete(id));
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
  // Helper: mapeia número da prova para tipo de agendamento
  const provaTipoArr: TipoAgendamento[] = [
    'primeira_prova', 'segunda_prova', 'terceira_prova',
    'quarta_prova', 'quinta_prova', 'sexta_prova',
  ];
  const provaTipo = (num: number): TipoAgendamento =>
    num >= 1 && num <= 6 ? provaTipoArr[num - 1] : 'prova_final';

  // Helper: verifica se um tipo é de prova
  const isProvaTipo = (tipo: TipoAgendamento) =>
    [...provaTipoArr, 'prova_final'].includes(tipo);

  const saveAgendamento = (a: Agendamento) => {
    setAgendamentos(prev => upsertArr(prev, a));
    bg(() => agendamentoDb.save(a));

    // Sync: se o agendamento está vinculado a uma parcela de prova, atualiza a parcela
    if (a.id.startsWith('ag-')) {
      const parcelaId = a.id.slice(3);
      const parcela = parcelasProva.find(p => p.id === parcelaId);
      if (parcela) {
        const updated: ParcelaProva = {
          ...parcela,
          dataProva: a.data,
          horaProva: a.hora,
          statusProva: a.status === 'cancelado' ? 'cancelada'
            : a.status === 'concluido' ? 'realizada'
            : a.data ? 'agendada' : 'pendente',
        };
        setParcelasProva(prev => upsertArr(prev, updated));
        bg(() => parcelaProvaDb.save(updated));
      }
    } else if (isProvaTipo(a.tipo)) {
      // Agendamento de prova criado pela Agenda (sem vínculo direto):
      // tenta encontrar uma parcela pendente sem data para vincular
      const parcelaSemData = parcelasProva.find(p =>
        p.clienteId === a.clienteId && !p.dataProva &&
        p.statusProva === 'pendente'
      );
      if (parcelaSemData) {
        const updated: ParcelaProva = {
          ...parcelaSemData,
          dataProva: a.data,
          horaProva: a.hora,
          statusProva: 'agendada',
        };
        setParcelasProva(prev => upsertArr(prev, updated));
        bg(() => parcelaProvaDb.save(updated));
        // Renomeia o agendamento para vincular
        const linked: Agendamento = { ...a, id: `ag-${parcelaSemData.id}` };
        // Remove o antigo e salva o vinculado
        setAgendamentos(prev => prev.filter(x => x.id !== a.id).concat(linked));
        bg(async () => {
          await agendamentoDb.delete(a.id);
          await agendamentoDb.save(linked);
        });
      }
    }
  };
  const deleteAgendamento = (id: string) => {
    setAgendamentos(prev => prev.filter(a => a.id !== id));
    bg(() => agendamentoDb.delete(id));

    // Sync: se era um agendamento vinculado a prova, limpa a data da parcela
    if (id.startsWith('ag-')) {
      const parcelaId = id.slice(3);
      const parcela = parcelasProva.find(p => p.id === parcelaId);
      if (parcela && !parcela.pago) {
        const updated: ParcelaProva = {
          ...parcela,
          dataProva: undefined,
          horaProva: undefined,
          statusProva: 'pendente',
        };
        setParcelasProva(prev => upsertArr(prev, updated));
        bg(() => parcelaProvaDb.save(updated));
      }
    }
  };
  const getAgendamentosByCliente = (clienteId: string) => agendamentos.filter(a => a.clienteId === clienteId);

  // ── Pagamentos ────────────────────────────────────────────────────────────
  const savePagamento = (p: Pagamento) => {
    setPagamentos(prev => upsertArr(prev, p));
    bg(() => pagamentoDb.save(p));
  };
  const deletePagamento = (id: string) => {
    setPagamentos(prev => prev.filter(p => p.id !== id));
    bg(() => pagamentoDb.delete(id));
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
      bg(() => pagamentoDb.save(pag));
    } else if (!p.pago) {
      const idToDelete = p.pagamentoId || provaParamentoId(p);
      setPagamentos(prev => prev.filter(x => x.id !== idToDelete));
      updated = { ...updated, pagamentoId: undefined, valorPago: undefined,
        dataPagamento: undefined, formaPagamento: undefined };
      bg(() => pagamentoDb.delete(idToDelete));
    }

    setParcelasProva(prev => upsertArr(prev, updated));
    bg(() => parcelaProvaDb.save(updated));

    // Sync: cria/atualiza agendamento vinculado quando a parcela tem data
    const agId = `ag-${updated.id}`;
    if (updated.dataProva) {
      const existingAg = agendamentos.find(a => a.id === agId);
      const ag: Agendamento = {
        id: agId,
        clienteId: updated.clienteId,
        tipo: provaTipo(updated.numero),
        data: updated.dataProva,
        hora: updated.horaProva || '10:00',
        duracao: existingAg?.duracao || 60,
        descricao: existingAg?.descricao || `${updated.numero}ª Prova`,
        status: updated.statusProva === 'realizada' ? 'concluido'
          : updated.statusProva === 'cancelada' ? 'cancelado'
          : 'agendado',
        createdAt: existingAg?.createdAt || new Date().toISOString(),
      };
      setAgendamentos(prev => upsertArr(prev, ag));
      bg(() => agendamentoDb.save(ag));
    } else {
      // Se a data foi removida, deleta o agendamento vinculado
      const existingAg = agendamentos.find(a => a.id === agId);
      if (existingAg) {
        setAgendamentos(prev => prev.filter(a => a.id !== agId));
        bg(() => agendamentoDb.delete(agId));
      }
    }
  };

  const deleteParcelaProva = (id: string) => {
    const parcela = parcelasProva.find(p => p.id === id);
    if (parcela?.pagamentoId) {
      setPagamentos(prev => prev.filter(p => p.id !== parcela.pagamentoId));
      bg(() => pagamentoDb.delete(parcela.pagamentoId!));
    }
    setParcelasProva(prev => prev.filter(p => p.id !== id));
    bg(() => parcelaProvaDb.delete(id));
    // Sync: deleta agendamento vinculado
    const agId = `ag-${id}`;
    const existingAg = agendamentos.find(a => a.id === agId);
    if (existingAg) {
      setAgendamentos(prev => prev.filter(a => a.id !== agId));
      bg(() => agendamentoDb.delete(agId));
    }
  };
  const getParcelasProvaByContrato = (contratoId: string) =>
    parcelasProva.filter(p => p.contratoId === contratoId);
  const getParcelasProvaByCliente = (clienteId: string) =>
    parcelasProva.filter(p => p.clienteId === clienteId);

  // ── Inspirações ───────────────────────────────────────────────────────────
  const saveInspiracao = (i: Inspiracao) => {
    setInspiracoes(prev => upsertArr(prev, i));
    bg(() => inspiracaoDb.save(i));
  };
  const deleteInspiracao = (id: string) => {
    setInspiracoes(prev => prev.filter(i => i.id !== id));
    bg(() => inspiracaoDb.delete(id));
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
