import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Cliente, MedidasNoiva, FichaTecnica, Contrato,
  Orcamento, Agendamento, Pagamento, Inspiracao, ParcelaProva,
  ConfigSistema
} from '../types';
import {
  clienteStorage, medidasStorage, fichaStorage, contratoStorage,
  orcamentoStorage, agendamentoStorage, pagamentoStorage, inspiracaoStorage,
  parcelaProvaStorage, gerarParcelasContrato,
  configStorage, calcCustoPorKm,
  authStorage, seedDemoData
} from '../utils/storage';

interface AppContextType {
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

  const loadAll = useCallback(() => {
    setClientes(clienteStorage.getAll());
    setMedidas(medidasStorage.getAll());
    setFichasTecnicas(fichaStorage.getAll());
    setContratos(contratoStorage.getAll());
    setOrcamentos(orcamentoStorage.getAll());
    setAgendamentos(agendamentoStorage.getAll());
    setPagamentos(pagamentoStorage.getAll());
    setParcelasProva(parcelaProvaStorage.getAll());
    setInspiracoes(inspiracaoStorage.getAll());
  }, []);

  useEffect(() => {
    seedDemoData();
    loadAll();
  }, [loadAll]);

  const saveConfig = (c: ConfigSistema) => { configStorage.save(c); setConfig(c); };
  const custoPorKm = calcCustoPorKm(config);

  const login = (senha: string): boolean => {
    if (senha === 'atelie2024') {
      authStorage.login();
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    authStorage.logout();
    setIsLoggedIn(false);
  };

  // ─── Clientes ───────────────────────────────────────────────────────────────
  const saveCliente = (c: Cliente) => { clienteStorage.save(c); setClientes(clienteStorage.getAll()); };

  /** Exclui o cliente e todos os dados associados (cascade). */
  const deleteCliente = (id: string) => {
    // Contratos → parcelas de prova + pagamentos gerados por prova
    contratoStorage.getAll()
      .filter(c => c.clienteId === id)
      .forEach(c => {
        parcelaProvaStorage.deleteByContrato(c.id);
        // Remove pagamentos gerados automaticamente pelas provas (prefixo prov-)
        pagamentoStorage.getAll()
          .filter(p => p.id.startsWith(`prov-${c.id}-`))
          .forEach(p => pagamentoStorage.delete(p.id));
        contratoStorage.delete(c.id);
      });
    // Pagamentos manuais do cliente
    pagamentoStorage.getAll().filter(p => p.clienteId === id).forEach(p => pagamentoStorage.delete(p.id));
    // Demais dados do cliente
    medidasStorage.getAll().filter(m => m.clienteId === id).forEach(m => medidasStorage.delete(m.id));
    fichaStorage.getAll().filter(f => f.clienteId === id).forEach(f => fichaStorage.delete(f.id));
    orcamentoStorage.getAll().filter(o => o.clienteId === id).forEach(o => orcamentoStorage.delete(o.id));
    agendamentoStorage.getAll().filter(a => a.clienteId === id).forEach(a => agendamentoStorage.delete(a.id));
    inspiracaoStorage.getAll().filter(i => i.clienteId === id).forEach(i => inspiracaoStorage.delete(i.id));
    // Por fim, o próprio cliente
    clienteStorage.delete(id);
    // Recarrega todo o estado de uma vez
    setClientes(clienteStorage.getAll());
    setContratos(contratoStorage.getAll());
    setParcelasProva(parcelaProvaStorage.getAll());
    setPagamentos(pagamentoStorage.getAll());
    setMedidas(medidasStorage.getAll());
    setFichasTecnicas(fichaStorage.getAll());
    setOrcamentos(orcamentoStorage.getAll());
    setAgendamentos(agendamentoStorage.getAll());
    setInspiracoes(inspiracaoStorage.getAll());
  };
  const getCliente = (id: string) => clientes.find(c => c.id === id);

  // ─── Medidas ─────────────────────────────────────────────────────────────────
  const saveMedidas = (m: MedidasNoiva) => { medidasStorage.save(m); setMedidas(medidasStorage.getAll()); };
  const deleteMedidas = (id: string) => { medidasStorage.delete(id); setMedidas(medidasStorage.getAll()); };
  const getMedidasByCliente = (clienteId: string) => medidas.filter(m => m.clienteId === clienteId);

  // ─── Fichas ──────────────────────────────────────────────────────────────────
  const saveFicha = (f: FichaTecnica) => { fichaStorage.save(f); setFichasTecnicas(fichaStorage.getAll()); };
  const deleteFicha = (id: string) => { fichaStorage.delete(id); setFichasTecnicas(fichaStorage.getAll()); };
  const getFichasByCliente = (clienteId: string) => fichasTecnicas.filter(f => f.clienteId === clienteId);

  // ─── Contratos ───────────────────────────────────────────────────────────────
  const saveContrato = (c: Contrato) => {
    contratoStorage.save(c);
    // Gerar/atualizar parcelas de prova automaticamente
    if (c.quantidadeProvas && c.quantidadeProvas > 0) {
      gerarParcelasContrato(c.id, c.clienteId, c.quantidadeProvas, c.valorTotal, c.valorEntrada);
      setParcelasProva(parcelaProvaStorage.getAll());
    }
    // Marcar orçamento vinculado como aprovado
    if (c.orcamentoId) {
      const orc = orcamentoStorage.getAll().find(o => o.id === c.orcamentoId);
      if (orc && orc.status === 'pendente') {
        orcamentoStorage.save({ ...orc, status: 'aprovado' });
        setOrcamentos(orcamentoStorage.getAll());
      }
    }
    setContratos(contratoStorage.getAll());
  };
  const deleteContrato = (id: string) => {
    parcelaProvaStorage.deleteByContrato(id);
    contratoStorage.delete(id);
    setContratos(contratoStorage.getAll());
    setParcelasProva(parcelaProvaStorage.getAll());
  };
  const getContratosByCliente = (clienteId: string) => contratos.filter(c => c.clienteId === clienteId);
  const nextNumeroContrato = () => contratoStorage.nextNumber();

  // ─── Orçamentos ──────────────────────────────────────────────────────────────
  const saveOrcamento = (o: Orcamento) => { orcamentoStorage.save(o); setOrcamentos(orcamentoStorage.getAll()); };
  const deleteOrcamento = (id: string) => { orcamentoStorage.delete(id); setOrcamentos(orcamentoStorage.getAll()); };
  const getOrcamentosByCliente = (clienteId: string) => orcamentos.filter(o => o.clienteId === clienteId);
  const nextNumeroOrcamento = () => orcamentoStorage.nextNumber();

  // ─── Agendamentos ────────────────────────────────────────────────────────────
  const saveAgendamento = (a: Agendamento) => { agendamentoStorage.save(a); setAgendamentos(agendamentoStorage.getAll()); };
  const deleteAgendamento = (id: string) => { agendamentoStorage.delete(id); setAgendamentos(agendamentoStorage.getAll()); };
  const getAgendamentosByCliente = (clienteId: string) => agendamentos.filter(a => a.clienteId === clienteId);

  // ─── Pagamentos ──────────────────────────────────────────────────────────────
  const savePagamento = (p: Pagamento) => { pagamentoStorage.save(p); setPagamentos(pagamentoStorage.getAll()); };
  const deletePagamento = (id: string) => { pagamentoStorage.delete(id); setPagamentos(pagamentoStorage.getAll()); };
  const getPagamentosByCliente = (clienteId: string) => pagamentos.filter(p => p.clienteId === clienteId);

  // ─── Parcelas de Prova ────────────────────────────────────────────────────────
  // ID determinístico para o Pagamento gerado por uma prova (evita duplicatas)
  const provaParamentoId = (p: ParcelaProva) => `prov-${p.contratoId}-${p.numero}`;

  const saveParcelaProva = (p: ParcelaProva) => {
    let updated = { ...p };

    if (p.pago && p.dataPagamento) {
      // ── Criar / atualizar o Pagamento vinculado ──────────────────────────
      const pagId = p.pagamentoId || provaParamentoId(p);
      const contrato = contratoStorage.getAll().find(c => c.id === p.contratoId);
      const valorEfetivo = p.valorPago ?? p.valorParcela;
      const pag: Pagamento = {
        id: pagId,
        clienteId: p.clienteId,
        contratoId: p.contratoId,
        descricao: `${p.numero}ª Prova — ${contrato?.descricaoPecas || 'Vestido'}`,
        valor: valorEfetivo,
        data: p.dataPagamento,
        tipo: 'parcela',
        status: 'pago',
        formaPagamento: p.formaPagamento,
        createdAt: new Date().toISOString(),
      };
      pagamentoStorage.save(pag);
      setPagamentos(pagamentoStorage.getAll());
      updated = { ...updated, pagamentoId: pagId };
    } else if (!p.pago) {
      // ── Remover Pagamento vinculado ao desfazer o pagamento ──────────────
      const idToDelete = p.pagamentoId || provaParamentoId(p);
      pagamentoStorage.delete(idToDelete);
      setPagamentos(pagamentoStorage.getAll());
      updated = { ...updated, pagamentoId: undefined, valorPago: undefined,
                  dataPagamento: undefined, formaPagamento: undefined };
    }

    parcelaProvaStorage.save(updated);
    setParcelasProva(parcelaProvaStorage.getAll());
  };

  const deleteParcelaProva = (id: string) => {
    // Apagar também o Pagamento vinculado (se houver)
    const parcela = parcelaProvaStorage.getAll().find(p => p.id === id);
    if (parcela?.pagamentoId) {
      pagamentoStorage.delete(parcela.pagamentoId);
      setPagamentos(pagamentoStorage.getAll());
    }
    parcelaProvaStorage.delete(id);
    setParcelasProva(parcelaProvaStorage.getAll());
  };
  const getParcelasProvaByContrato = (contratoId: string) =>
    parcelasProva.filter(p => p.contratoId === contratoId);
  const getParcelasProvaByCliente = (clienteId: string) =>
    parcelasProva.filter(p => p.clienteId === clienteId);

  // ─── Inspirações ─────────────────────────────────────────────────────────────
  const saveInspiracao = (i: Inspiracao) => { inspiracaoStorage.save(i); setInspiracoes(inspiracaoStorage.getAll()); };
  const deleteInspiracao = (id: string) => { inspiracaoStorage.delete(id); setInspiracoes(inspiracaoStorage.getAll()); };
  const getInspiracoesCliente = (clienteId: string) => inspiracoes.filter(i => i.clienteId === clienteId);

  return (
    <AppContext.Provider value={{
      config, saveConfig, custoPorKm,
      isLoggedIn, login, logout,
      clientes, saveCliente, deleteCliente, getCliente,
      medidas, saveMedidas, deleteMedidas, getMedidasByCliente,
      fichasTecnicas, saveFicha, deleteFicha, getFichasByCliente,
      contratos, saveContrato, deleteContrato, getContratosByCliente, nextNumeroContrato,
      orcamentos, saveOrcamento, deleteOrcamento, getOrcamentosByCliente, nextNumeroOrcamento,
      agendamentos, saveAgendamento, deleteAgendamento, getAgendamentosByCliente,
      pagamentos, savePagamento, deletePagamento, getPagamentosByCliente,
      parcelasProva, saveParcelaProva, deleteParcelaProva, getParcelasProvaByContrato, getParcelasProvaByCliente,
      inspiracoes, saveInspiracao, deleteInspiracao, getInspiracoesCliente,
      refresh: loadAll,
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
