import {
  Cliente, MedidasNoiva, FichaTecnica, Contrato,
  Orcamento, Agendamento, Pagamento, Inspiracao, ParcelaProva,
  ConfigSistema, defaultConfig
} from '../types';

const KEYS = {
  clientes: 'atelie_clientes',
  medidas: 'atelie_medidas',
  fichasTecnicas: 'atelie_fichas_tecnicas',
  contratos: 'atelie_contratos',
  orcamentos: 'atelie_orcamentos',
  agendamentos: 'atelie_agendamentos',
  pagamentos: 'atelie_pagamentos',
  inspiracoes: 'atelie_inspiracoes',
  parcelasProva: 'atelie_parcelas_prova',
  config: 'atelie_config',
  auth: 'atelie_auth',
};

function get<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Clientes ──────────────────────────────────────────────────────────────────
export const clienteStorage = {
  getAll: (): Cliente[] => get<Cliente>(KEYS.clientes),
  save: (item: Cliente) => {
    const all = get<Cliente>(KEYS.clientes);
    const idx = all.findIndex(c => c.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.clientes, all);
  },
  delete: (id: string) => {
    set(KEYS.clientes, get<Cliente>(KEYS.clientes).filter(c => c.id !== id));
  },
};

// ── Medidas ───────────────────────────────────────────────────────────────────
export const medidasStorage = {
  getAll: (): MedidasNoiva[] => get<MedidasNoiva>(KEYS.medidas),
  getByCliente: (clienteId: string): MedidasNoiva[] =>
    get<MedidasNoiva>(KEYS.medidas).filter(m => m.clienteId === clienteId),
  save: (item: MedidasNoiva) => {
    const all = get<MedidasNoiva>(KEYS.medidas);
    const idx = all.findIndex(m => m.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.medidas, all);
  },
  delete: (id: string) => {
    set(KEYS.medidas, get<MedidasNoiva>(KEYS.medidas).filter(m => m.id !== id));
  },
};

// ── Fichas Técnicas ───────────────────────────────────────────────────────────
export const fichaStorage = {
  getAll: (): FichaTecnica[] => get<FichaTecnica>(KEYS.fichasTecnicas),
  getByCliente: (clienteId: string): FichaTecnica[] =>
    get<FichaTecnica>(KEYS.fichasTecnicas).filter(f => f.clienteId === clienteId),
  save: (item: FichaTecnica) => {
    const all = get<FichaTecnica>(KEYS.fichasTecnicas);
    const idx = all.findIndex(f => f.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.fichasTecnicas, all);
  },
  delete: (id: string) => {
    set(KEYS.fichasTecnicas, get<FichaTecnica>(KEYS.fichasTecnicas).filter(f => f.id !== id));
  },
};

// ── Contratos ─────────────────────────────────────────────────────────────────
export const contratoStorage = {
  getAll: (): Contrato[] => get<Contrato>(KEYS.contratos),
  getByCliente: (clienteId: string): Contrato[] =>
    get<Contrato>(KEYS.contratos).filter(c => c.clienteId === clienteId),
  save: (item: Contrato) => {
    const all = get<Contrato>(KEYS.contratos);
    const idx = all.findIndex(c => c.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.contratos, all);
  },
  delete: (id: string) => {
    set(KEYS.contratos, get<Contrato>(KEYS.contratos).filter(c => c.id !== id));
  },
  nextNumber: (): string => {
    const all = get<Contrato>(KEYS.contratos);
    const max = all.reduce((acc, c) => {
      const n = parseInt(c.numero.replace(/\D/g, ''));
      return n > acc ? n : acc;
    }, 0);
    return String(max + 1).padStart(4, '0');
  },
};

// ── Orçamentos ────────────────────────────────────────────────────────────────
export const orcamentoStorage = {
  getAll: (): Orcamento[] => get<Orcamento>(KEYS.orcamentos),
  getByCliente: (clienteId: string): Orcamento[] =>
    get<Orcamento>(KEYS.orcamentos).filter(o => o.clienteId === clienteId),
  save: (item: Orcamento) => {
    const all = get<Orcamento>(KEYS.orcamentos);
    const idx = all.findIndex(o => o.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.orcamentos, all);
  },
  delete: (id: string) => {
    set(KEYS.orcamentos, get<Orcamento>(KEYS.orcamentos).filter(o => o.id !== id));
  },
  nextNumber: (): string => {
    const all = get<Orcamento>(KEYS.orcamentos);
    const max = all.reduce((acc, o) => {
      const n = parseInt(o.numero.replace(/\D/g, ''));
      return n > acc ? n : acc;
    }, 0);
    return `ORC-${String(max + 1).padStart(4, '0')}`;
  },
};

// ── Agendamentos ──────────────────────────────────────────────────────────────
export const agendamentoStorage = {
  getAll: (): Agendamento[] => get<Agendamento>(KEYS.agendamentos),
  getByCliente: (clienteId: string): Agendamento[] =>
    get<Agendamento>(KEYS.agendamentos).filter(a => a.clienteId === clienteId),
  save: (item: Agendamento) => {
    const all = get<Agendamento>(KEYS.agendamentos);
    const idx = all.findIndex(a => a.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.agendamentos, all);
  },
  delete: (id: string) => {
    set(KEYS.agendamentos, get<Agendamento>(KEYS.agendamentos).filter(a => a.id !== id));
  },
};

// ── Pagamentos ────────────────────────────────────────────────────────────────
export const pagamentoStorage = {
  getAll: (): Pagamento[] => get<Pagamento>(KEYS.pagamentos),
  getByCliente: (clienteId: string): Pagamento[] =>
    get<Pagamento>(KEYS.pagamentos).filter(p => p.clienteId === clienteId),
  save: (item: Pagamento) => {
    const all = get<Pagamento>(KEYS.pagamentos);
    const idx = all.findIndex(p => p.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.pagamentos, all);
  },
  delete: (id: string) => {
    set(KEYS.pagamentos, get<Pagamento>(KEYS.pagamentos).filter(p => p.id !== id));
  },
};

// ── Parcelas de Prova ────────────────────────────────────────────────────────
export const parcelaProvaStorage = {
  getAll: (): ParcelaProva[] => get<ParcelaProva>(KEYS.parcelasProva),
  getByContrato: (contratoId: string): ParcelaProva[] =>
    get<ParcelaProva>(KEYS.parcelasProva).filter(p => p.contratoId === contratoId),
  getByCliente: (clienteId: string): ParcelaProva[] =>
    get<ParcelaProva>(KEYS.parcelasProva).filter(p => p.clienteId === clienteId),
  save: (item: ParcelaProva) => {
    const all = get<ParcelaProva>(KEYS.parcelasProva);
    const idx = all.findIndex(p => p.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.parcelasProva, all);
  },
  delete: (id: string) => {
    set(KEYS.parcelasProva, get<ParcelaProva>(KEYS.parcelasProva).filter(p => p.id !== id));
  },
  deleteByContrato: (contratoId: string) => {
    set(KEYS.parcelasProva, get<ParcelaProva>(KEYS.parcelasProva).filter(p => p.contratoId !== contratoId));
  },
};

/** Gera (ou re-gera) as parcelas de prova de um contrato.
 *  Só deleta parcelas existentes se nenhuma já foi paga. */
export function gerarParcelasContrato(
  contratoId: string,
  clienteId: string,
  quantidadeProvas: number,
  valorTotal: number,
  valorEntrada: number,
): void {
  const existing = parcelaProvaStorage.getByContrato(contratoId);
  const hasPaid  = existing.some(p => p.pago);
  if (hasPaid && existing.length === quantidadeProvas) return; // nada a fazer

  // Remove as que não foram pagas e regenera
  existing.filter(p => !p.pago).forEach(p => parcelaProvaStorage.delete(p.id));

  const saldo        = valorTotal - valorEntrada;
  const jaExistemPagas = existing.filter(p => p.pago);
  const jaExisteQtd  = jaExistemPagas.length;
  const restante     = saldo - jaExistemPagas.reduce((a, p) => a + p.valorParcela, 0);
  const novasQtd     = quantidadeProvas - jaExisteQtd;
  const valorParcela = novasQtd > 0 ? restante / novasQtd : 0;

  for (let i = jaExisteQtd + 1; i <= quantidadeProvas; i++) {
    parcelaProvaStorage.save({
      id: genId(),
      contratoId,
      clienteId,
      numero: i,
      statusProva: 'pendente',
      valorParcela,
      pago: false,
      createdAt: new Date().toISOString(),
    });
  }
}

// ── Inspirações ───────────────────────────────────────────────────────────────
export const inspiracaoStorage = {
  getAll: (): Inspiracao[] => get<Inspiracao>(KEYS.inspiracoes),
  getByCliente: (clienteId: string): Inspiracao[] =>
    get<Inspiracao>(KEYS.inspiracoes).filter(i => i.clienteId === clienteId),
  save: (item: Inspiracao) => {
    const all = get<Inspiracao>(KEYS.inspiracoes);
    const idx = all.findIndex(i => i.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    set(KEYS.inspiracoes, all);
  },
  delete: (id: string) => {
    set(KEYS.inspiracoes, get<Inspiracao>(KEYS.inspiracoes).filter(i => i.id !== id));
  },
};

// ── Config do Sistema ─────────────────────────────────────────────────────────
export const configStorage = {
  get: (): ConfigSistema => {
    try {
      const raw = localStorage.getItem(KEYS.config);
      return raw ? { ...defaultConfig, ...JSON.parse(raw) } : { ...defaultConfig };
    } catch {
      return { ...defaultConfig };
    }
  },
  save: (cfg: ConfigSistema) => {
    localStorage.setItem(KEYS.config, JSON.stringify(cfg));
  },
};

/** Calcula o custo estimado por km (ida) com base na config. */
export function calcCustoPorKm(cfg: ConfigSistema): number {
  const depreciation = cfg.vidaUtilKm > 0 ? cfg.valorVeiculo / cfg.vidaUtilKm : 0;
  const fuel = cfg.consumoKmL > 0 ? cfg.precoCombustivel / cfg.consumoKmL : 0;
  return depreciation + fuel + cfg.custoManutencaoKm;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authStorage = {
  isLoggedIn: (): boolean => localStorage.getItem(KEYS.auth) === 'true',
  login: () => localStorage.setItem(KEYS.auth, 'true'),
  logout: () => localStorage.removeItem(KEYS.auth),
};

// ── Seed Data ─────────────────────────────────────────────────────────────────
export function seedDemoData() {
  if (clienteStorage.getAll().length > 0) return;

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const clientes: Cliente[] = [
    {
      id: 'c1', nome: 'Isabela Ferreira', telefone: '(11) 99234-5678',
      email: 'isabela@email.com', dataContato: fmt(addDays(today, -60)),
      dataCasamento: fmt(addDays(today, 90)), local: 'Espaço Villa Jardins',
      indicacao: 'Instagram', status: 'ativo', createdAt: fmt(addDays(today, -60)),
    },
    {
      id: 'c2', nome: 'Mariana Santos', telefone: '(11) 98765-4321',
      email: 'mariana@email.com', dataContato: fmt(addDays(today, -45)),
      dataCasamento: fmt(addDays(today, 120)), local: 'Chácara Recanto',
      indicacao: 'Amiga', status: 'ativo', createdAt: fmt(addDays(today, -45)),
    },
    {
      id: 'c3', nome: 'Amanda Oliveira', telefone: '(11) 97654-3210',
      email: 'amanda@email.com', dataContato: fmt(addDays(today, -30)),
      dataCasamento: fmt(addDays(today, 200)), local: 'Hotel Grand',
      indicacao: 'Google', status: 'lead', createdAt: fmt(addDays(today, -30)),
    },
    {
      id: 'c4', nome: 'Letícia Alves', telefone: '(11) 96543-2109',
      email: 'leticia@email.com', dataContato: fmt(addDays(today, -90)),
      dataCasamento: fmt(addDays(today, -10)), local: 'Fazenda Bela Vista',
      indicacao: 'Instagram', status: 'concluido', createdAt: fmt(addDays(today, -90)),
    },
  ];

  clientes.forEach(c => clienteStorage.save(c));

  const pagamentos: Pagamento[] = [
    { id: 'p1', clienteId: 'c1', descricao: 'Entrada vestido', valor: 3500, data: fmt(addDays(today, -55)), tipo: 'entrada', status: 'pago', formaPagamento: 'pix', createdAt: fmt(addDays(today, -55)) },
    { id: 'p2', clienteId: 'c1', descricao: '2ª Parcela', valor: 2000, data: fmt(addDays(today, -25)), tipo: 'parcela', status: 'pago', formaPagamento: 'cartao_credito', createdAt: fmt(addDays(today, -25)) },
    { id: 'p3', clienteId: 'c1', descricao: 'Saldo final', valor: 2500, data: fmt(addDays(today, 80)), tipo: 'saldo', status: 'pendente', formaPagamento: 'pix', createdAt: fmt(addDays(today, -55)) },
    { id: 'p4', clienteId: 'c2', descricao: 'Entrada vestido', valor: 4000, data: fmt(addDays(today, -40)), tipo: 'entrada', status: 'pago', formaPagamento: 'pix', createdAt: fmt(addDays(today, -40)) },
    { id: 'p5', clienteId: 'c4', descricao: 'Pagamento integral', valor: 8500, data: fmt(addDays(today, -15)), tipo: 'saldo', status: 'pago', formaPagamento: 'transferencia', createdAt: fmt(addDays(today, -15)) },
    { id: 'p6', clienteId: 'c2', descricao: 'Parcela 2', valor: 3000, data: fmt(addDays(today, -10)), tipo: 'parcela', status: 'pago', formaPagamento: 'cartao_credito', createdAt: fmt(addDays(today, -10)) },
    { id: 'p7', clienteId: 'c3', descricao: 'Entrada orçamento', valor: 1500, data: fmt(addDays(today, -5)), tipo: 'entrada', status: 'pendente', formaPagamento: 'pix', createdAt: fmt(addDays(today, -5)) },
  ];
  pagamentos.forEach(p => pagamentoStorage.save(p));

  const agendamentos: Agendamento[] = [
    { id: 'a1', clienteId: 'c1', tipo: 'primeira_prova', data: fmt(addDays(today, 5)), hora: '10:00', duracao: 90, descricao: 'Primeira prova do vestido principal', status: 'confirmado', createdAt: fmt(today) },
    { id: 'a2', clienteId: 'c2', tipo: 'consulta', data: fmt(addDays(today, 2)), hora: '14:00', duracao: 60, descricao: 'Consulta de estilo e definição do modelo', status: 'agendado', createdAt: fmt(today) },
    { id: 'a3', clienteId: 'c1', tipo: 'segunda_prova', data: fmt(addDays(today, 20)), hora: '11:00', duracao: 60, status: 'agendado', createdAt: fmt(today) },
    { id: 'a4', clienteId: 'c3', tipo: 'reuniao', data: fmt(addDays(today, 1)), hora: '15:30', duracao: 45, descricao: 'Apresentação de orçamento e portfólio', status: 'agendado', createdAt: fmt(today) },
  ];
  agendamentos.forEach(a => agendamentoStorage.save(a));
}
