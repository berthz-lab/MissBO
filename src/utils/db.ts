/// <reference types="vite/client" />
/**
 * Camada de acesso ao Supabase — substitui localStorage quando configurado.
 * Todos os campos são mapeados entre snake_case (DB) ↔ camelCase (TypeScript).
 */
import { supabase } from './supabase';
import { genId } from './storage';
import {
  Cliente, MedidasNoiva, FichaTecnica, Contrato,
  Orcamento, ItemOrcamento, Agendamento, Pagamento,
  Inspiracao, ParcelaProva, ConfigSistema, ItemPadraoOrcamento, defaultConfig,
} from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const ou = <T>(v: T | null | undefined): T | undefined => (v != null ? v : undefined);
const num = (v: unknown): number | undefined => (v != null ? Number(v) : undefined);

// Array upsert helper (mantém imutabilidade)
export function upsertArr<T extends { id: string }>(arr: T[], item: T): T[] {
  const idx = arr.findIndex(x => x.id === item.id);
  if (idx >= 0) { const n = [...arr]; n[idx] = item; return n; }
  return [...arr, item];
}

// ══════════════════════════════════════════════════════════════════════════════
// MAPPERS  DB (snake_case) → TypeScript (camelCase)
// ══════════════════════════════════════════════════════════════════════════════

// ── Cliente ───────────────────────────────────────────────────────────────────
function toCliente(r: Record<string, unknown>): Cliente {
  return {
    id: r.id as string,
    nome: r.nome as string,
    telefone: r.telefone as string,
    email: (r.email as string) ?? '',
    cpf: ou(r.cpf as string),
    dataContato: r.data_contato as string,
    dataCasamento: ou(r.data_casamento as string),
    local: ou(r.local as string),
    endereco: ou(r.endereco as string),
    distanciaKm: num(r.distancia_km),
    instagram: ou(r.instagram as string),
    indicacao: ou(r.indicacao as string),
    status: r.status as Cliente['status'],
    observacoes: ou(r.observacoes as string),
    createdAt: r.created_at as string,
  };
}
function fromCliente(c: Cliente): Record<string, unknown> {
  return {
    id: c.id, nome: c.nome, telefone: c.telefone,
    email: c.email || null, cpf: c.cpf ?? null,
    data_contato: c.dataContato, data_casamento: c.dataCasamento ?? null,
    local: c.local ?? null, endereco: c.endereco ?? null,
    distancia_km: c.distanciaKm ?? null, instagram: c.instagram ?? null, indicacao: c.indicacao ?? null,
    status: c.status, observacoes: c.observacoes ?? null,
    created_at: c.createdAt,
  };
}

// ── MedidasNoiva ──────────────────────────────────────────────────────────────
function toMedidas(r: Record<string, unknown>): MedidasNoiva {
  return {
    id: r.id as string, clienteId: r.cliente_id as string,
    data: r.data as string, createdAt: r.created_at as string,
    busto: num(r.busto), cavaAcavasCostas: num(r.cava_a_cavas_costas),
    abaixoDoBusto: num(r.abaixo_do_busto), cavaAcavasFrente: num(r.cava_a_cavas_frente),
    quadril: num(r.quadril), colarinho: num(r.colarinho),
    ombroAOmbro: num(r.ombro_a_ombro), altCentroFrente: num(r.alt_centro_frente),
    altOmbroFrente: num(r.alt_ombro_frente), altOmbroCostas: num(r.alt_ombro_costas),
    altCentroCostas: num(r.alt_centro_costas), separacaoBusto: num(r.separacao_busto),
    cintura: num(r.cintura), altBusto: num(r.alt_busto),
    altGanchoFrente: num(r.alt_gancho_frente), altQuadril: num(r.alt_quadril),
    altDesejadaSaia: num(r.alt_desejada_saia), altCinturaAoJoelho: num(r.alt_cintura_ao_joelho),
    punho: num(r.punho), largJoelho: num(r.larg_joelho),
    alturaLateral: num(r.altura_lateral), largBraco: num(r.larg_braco),
    cumprimentoBraco: num(r.cumprimento_braco), altManga34: num(r.alt_manga_34),
    alturaMangaCurta: num(r.altura_manga_curta), ombro: num(r.ombro),
    observacoes: ou(r.observacoes as string),
  };
}
function fromMedidas(m: MedidasNoiva): Record<string, unknown> {
  return {
    id: m.id, cliente_id: m.clienteId, data: m.data,
    created_at: m.createdAt ?? new Date().toISOString(),
    busto: m.busto ?? null, cava_a_cavas_costas: m.cavaAcavasCostas ?? null,
    abaixo_do_busto: m.abaixoDoBusto ?? null, cava_a_cavas_frente: m.cavaAcavasFrente ?? null,
    quadril: m.quadril ?? null, colarinho: m.colarinho ?? null,
    ombro_a_ombro: m.ombroAOmbro ?? null, alt_centro_frente: m.altCentroFrente ?? null,
    alt_ombro_frente: m.altOmbroFrente ?? null, alt_ombro_costas: m.altOmbroCostas ?? null,
    alt_centro_costas: m.altCentroCostas ?? null, separacao_busto: m.separacaoBusto ?? null,
    cintura: m.cintura ?? null, alt_busto: m.altBusto ?? null,
    alt_gancho_frente: m.altGanchoFrente ?? null, alt_quadril: m.altQuadril ?? null,
    alt_desejada_saia: m.altDesejadaSaia ?? null, alt_cintura_ao_joelho: m.altCinturaAoJoelho ?? null,
    punho: m.punho ?? null, larg_joelho: m.largJoelho ?? null,
    altura_lateral: m.alturaLateral ?? null, larg_braco: m.largBraco ?? null,
    cumprimento_braco: m.cumprimentoBraco ?? null, alt_manga_34: m.altManga34 ?? null,
    altura_manga_curta: m.alturaMangaCurta ?? null, ombro: m.ombro ?? null,
    observacoes: m.observacoes ?? null,
  };
}

// ── FichaTecnica ──────────────────────────────────────────────────────────────
function toFicha(r: Record<string, unknown>): FichaTecnica {
  return {
    id: r.id as string, clienteId: r.cliente_id as string,
    nomePeca: r.nome_peca as string, categoria: r.categoria as FichaTecnica['categoria'],
    tecido: (r.tecido as string) ?? '', cor: (r.cor as string) ?? '',
    modelagem: (r.modelagem as string) ?? '', detalhes: (r.detalhes as string) ?? '',
    status: r.status as FichaTecnica['status'], dataEntrega: ou(r.data_entrega as string),
    valorCusto: num(r.valor_custo), valorVenda: num(r.valor_venda),
    observacoes: ou(r.observacoes as string), createdAt: r.created_at as string,
  };
}
function fromFicha(f: FichaTecnica): Record<string, unknown> {
  return {
    id: f.id, cliente_id: f.clienteId, nome_peca: f.nomePeca,
    categoria: f.categoria, tecido: f.tecido || null, cor: f.cor || null,
    modelagem: f.modelagem || null, detalhes: f.detalhes || null,
    status: f.status, data_entrega: f.dataEntrega ?? null,
    valor_custo: f.valorCusto ?? null, valor_venda: f.valorVenda ?? null,
    observacoes: f.observacoes ?? null, created_at: f.createdAt,
  };
}

// ── Contrato ──────────────────────────────────────────────────────────────────
function toContrato(r: Record<string, unknown>): Contrato {
  return {
    id: r.id as string, clienteId: r.cliente_id as string,
    numero: r.numero as string, orcamentoId: ou(r.orcamento_id as string),
    dataAssinatura: r.data_assinatura as string, dataEntrega: (r.data_entrega as string) ?? '',
    valorTotal: Number(r.valor_total), valorEntrada: Number(r.valor_entrada),
    parcelasRestantes: num(r.parcelas_restantes), quantidadeProvas: num(r.quantidade_provas),
    status: r.status as Contrato['status'], descricaoPecas: (r.descricao_pecas as string) ?? '',
    clausulasEspeciais: ou(r.clausulas_especiais as string),
    anexoBase64: ou(r.anexo_base64 as string), anexoNome: ou(r.anexo_nome as string),
    anexoTipo: ou(r.anexo_tipo as string), createdAt: r.created_at as string,
  };
}
function fromContrato(c: Contrato): Record<string, unknown> {
  return {
    id: c.id, cliente_id: c.clienteId, numero: c.numero,
    orcamento_id: c.orcamentoId ?? null, data_assinatura: c.dataAssinatura,
    data_entrega: c.dataEntrega || null, valor_total: c.valorTotal,
    valor_entrada: c.valorEntrada, parcelas_restantes: c.parcelasRestantes ?? null,
    quantidade_provas: c.quantidadeProvas ?? null, status: c.status,
    descricao_pecas: c.descricaoPecas || null, clausulas_especiais: c.clausulasEspeciais ?? null,
    anexo_base64: c.anexoBase64 ?? null, anexo_nome: c.anexoNome ?? null,
    anexo_tipo: c.anexoTipo ?? null, created_at: c.createdAt,
  };
}

// ── Orcamento ─────────────────────────────────────────────────────────────────
function toItemOrcamento(r: Record<string, unknown>): ItemOrcamento {
  return {
    id: r.id as string, descricao: r.descricao as string,
    quantidade: Number(r.quantidade), valorUnitario: Number(r.valor_unitario),
  };
}
function toOrcamento(r: Record<string, unknown>): Orcamento {
  const itensRaw = r.itens as Record<string, unknown>[] | null;
  return {
    id: r.id as string, clienteId: r.cliente_id as string,
    numero: r.numero as string, data: r.data as string,
    validade: (r.validade as string) ?? '', itens: (itensRaw ?? []).map(toItemOrcamento),
    desconto: Number(r.desconto ?? 0), status: r.status as Orcamento['status'],
    observacoes: ou(r.observacoes as string), createdAt: r.created_at as string,
  };
}
function fromOrcamento(o: Omit<Orcamento, 'itens'>): Record<string, unknown> {
  return {
    id: o.id, cliente_id: o.clienteId, numero: o.numero,
    data: o.data, validade: o.validade || null, desconto: o.desconto,
    status: o.status, observacoes: o.observacoes ?? null, created_at: o.createdAt,
  };
}
function fromItemOrcamento(orcamentoId: string, i: ItemOrcamento): Record<string, unknown> {
  return {
    id: i.id, orcamento_id: orcamentoId,
    descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valorUnitario,
  };
}

// ── Agendamento ───────────────────────────────────────────────────────────────
function toAgendamento(r: Record<string, unknown>): Agendamento {
  return {
    id: r.id as string, clienteId: r.cliente_id as string,
    tipo: r.tipo as Agendamento['tipo'], data: r.data as string,
    hora: ((r.hora as string) ?? '').slice(0, 5), // 'HH:MM:SS' → 'HH:MM'
    duracao: Number(r.duracao), descricao: ou(r.descricao as string),
    status: r.status as Agendamento['status'], createdAt: r.created_at as string,
  };
}
function fromAgendamento(a: Agendamento): Record<string, unknown> {
  return {
    id: a.id, cliente_id: a.clienteId, tipo: a.tipo, data: a.data,
    hora: a.hora, duracao: a.duracao, descricao: a.descricao ?? null,
    status: a.status, created_at: a.createdAt,
  };
}

// ── Pagamento ─────────────────────────────────────────────────────────────────
function toPagamento(r: Record<string, unknown>): Pagamento {
  return {
    id: r.id as string, clienteId: r.cliente_id as string,
    contratoId: ou(r.contrato_id as string), descricao: r.descricao as string,
    valor: Number(r.valor), data: r.data as string,
    tipo: r.tipo as Pagamento['tipo'], status: r.status as Pagamento['status'],
    formaPagamento: ou(r.forma_pagamento as Pagamento['formaPagamento']),
    createdAt: r.created_at as string,
  };
}
function fromPagamento(p: Pagamento): Record<string, unknown> {
  return {
    id: p.id, cliente_id: p.clienteId, contrato_id: p.contratoId ?? null,
    descricao: p.descricao, valor: p.valor, data: p.data, tipo: p.tipo,
    status: p.status, forma_pagamento: p.formaPagamento ?? null,
    created_at: p.createdAt,
  };
}

// ── ParcelaProva ──────────────────────────────────────────────────────────────
function toParcelaProva(r: Record<string, unknown>): ParcelaProva {
  return {
    id: r.id as string, contratoId: r.contrato_id as string,
    clienteId: r.cliente_id as string, numero: Number(r.numero),
    dataProva: ou(r.data_prova as string),
    horaProva: r.hora_prova ? ((r.hora_prova as string)).slice(0, 5) : undefined,
    statusProva: r.status_prova as ParcelaProva['statusProva'],
    valorParcela: Number(r.valor_parcela), valorPago: num(r.valor_pago),
    pago: Boolean(r.pago), dataPagamento: ou(r.data_pagamento as string),
    formaPagamento: ou(r.forma_pagamento as ParcelaProva['formaPagamento']),
    observacoes: ou(r.observacoes as string), pagamentoId: ou(r.pagamento_id as string),
    createdAt: r.created_at as string,
  };
}
function fromParcelaProva(p: ParcelaProva): Record<string, unknown> {
  return {
    id: p.id, contrato_id: p.contratoId, cliente_id: p.clienteId,
    numero: p.numero, data_prova: p.dataProva ?? null, hora_prova: p.horaProva ?? null,
    status_prova: p.statusProva, valor_parcela: p.valorParcela, valor_pago: p.valorPago ?? null,
    pago: p.pago, data_pagamento: p.dataPagamento ?? null,
    forma_pagamento: p.formaPagamento ?? null, observacoes: p.observacoes ?? null,
    pagamento_id: p.pagamentoId ?? null, created_at: p.createdAt,
  };
}

// ── Inspiracao ────────────────────────────────────────────────────────────────
function toInspiracao(r: Record<string, unknown>): Inspiracao {
  return {
    id: r.id as string, clienteId: r.cliente_id as string,
    titulo: r.titulo as string, imagemBase64: ou(r.imagem_base64 as string),
    imagemUrl: ou(r.imagem_url as string), categoria: r.categoria as Inspiracao['categoria'],
    observacoes: ou(r.observacoes as string), favorito: Boolean(r.favorito),
    createdAt: r.created_at as string,
  };
}
function fromInspiracao(i: Inspiracao): Record<string, unknown> {
  return {
    id: i.id, cliente_id: i.clienteId, titulo: i.titulo,
    imagem_base64: i.imagemBase64 ?? null, imagem_url: i.imagemUrl ?? null,
    categoria: i.categoria, observacoes: i.observacoes ?? null,
    favorito: i.favorito, created_at: i.createdAt,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const clienteDb = {
  getAll: async (): Promise<Cliente[]> => {
    const { data, error } = await supabase.from('clientes').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => toCliente(r as Record<string, unknown>));
  },
  save: async (item: Cliente): Promise<void> => {
    const { error } = await supabase.from('clientes').upsert(fromCliente(item));
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
  },
};

export const medidasDb = {
  getAll: async (): Promise<MedidasNoiva[]> => {
    const { data, error } = await supabase.from('medidas_noiva').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => toMedidas(r as Record<string, unknown>));
  },
  save: async (item: MedidasNoiva): Promise<void> => {
    const { error } = await supabase.from('medidas_noiva').upsert(fromMedidas(item));
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('medidas_noiva').delete().eq('id', id);
    if (error) throw error;
  },
};

export const fichaDb = {
  getAll: async (): Promise<FichaTecnica[]> => {
    const { data, error } = await supabase.from('fichas_tecnicas').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => toFicha(r as Record<string, unknown>));
  },
  save: async (item: FichaTecnica): Promise<void> => {
    const { error } = await supabase.from('fichas_tecnicas').upsert(fromFicha(item));
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('fichas_tecnicas').delete().eq('id', id);
    if (error) throw error;
  },
};

export const contratoDb = {
  getAll: async (): Promise<Contrato[]> => {
    const { data, error } = await supabase.from('contratos').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => toContrato(r as Record<string, unknown>));
  },
  save: async (item: Contrato): Promise<void> => {
    const { error } = await supabase.from('contratos').upsert(fromContrato(item));
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (error) throw error;
  },
};

export const orcamentoDb = {
  getAll: async (): Promise<Orcamento[]> => {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*, itens:orcamento_itens(*)')
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => toOrcamento(r as Record<string, unknown>));
  },
  save: async (item: Orcamento): Promise<void> => {
    const { itens, ...orc } = item;
    const { error: e1 } = await supabase.from('orcamentos').upsert(fromOrcamento(orc));
    if (e1) throw e1;
    const { error: e2 } = await supabase.from('orcamento_itens').delete().eq('orcamento_id', item.id);
    if (e2) throw e2;
    if (itens.length > 0) {
      const { error: e3 } = await supabase
        .from('orcamento_itens')
        .insert(itens.map(i => fromItemOrcamento(item.id, i)));
      if (e3) throw e3;
    }
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id);
    if (error) throw error;
  },
};

export const agendamentoDb = {
  getAll: async (): Promise<Agendamento[]> => {
    const { data, error } = await supabase.from('agendamentos').select('*').order('data');
    if (error) throw error;
    return (data ?? []).map(r => toAgendamento(r as Record<string, unknown>));
  },
  save: async (item: Agendamento): Promise<void> => {
    const { error } = await supabase.from('agendamentos').upsert(fromAgendamento(item));
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('agendamentos').delete().eq('id', id);
    if (error) throw error;
  },
};

export const pagamentoDb = {
  getAll: async (): Promise<Pagamento[]> => {
    const { data, error } = await supabase.from('pagamentos').select('*').order('data');
    if (error) throw error;
    return (data ?? []).map(r => toPagamento(r as Record<string, unknown>));
  },
  save: async (item: Pagamento): Promise<void> => {
    const { error } = await supabase.from('pagamentos').upsert(fromPagamento(item));
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('pagamentos').delete().eq('id', id);
    if (error) throw error;
  },
};

export const parcelaProvaDb = {
  getAll: async (): Promise<ParcelaProva[]> => {
    const { data, error } = await supabase.from('parcelas_prova').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => toParcelaProva(r as Record<string, unknown>));
  },
  getByContrato: async (contratoId: string): Promise<ParcelaProva[]> => {
    const { data, error } = await supabase
      .from('parcelas_prova').select('*').eq('contrato_id', contratoId);
    if (error) throw error;
    return (data ?? []).map(r => toParcelaProva(r as Record<string, unknown>));
  },
  save: async (item: ParcelaProva): Promise<void> => {
    const { error } = await supabase.from('parcelas_prova').upsert(fromParcelaProva(item));
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('parcelas_prova').delete().eq('id', id);
    if (error) throw error;
  },
  deleteByContrato: async (contratoId: string): Promise<void> => {
    const { error } = await supabase.from('parcelas_prova').delete().eq('contrato_id', contratoId);
    if (error) throw error;
  },
};

export const inspiracaoDb = {
  getAll: async (): Promise<Inspiracao[]> => {
    const { data, error } = await supabase.from('inspiracoes').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => toInspiracao(r as Record<string, unknown>));
  },
  save: async (item: Inspiracao): Promise<void> => {
    const { error } = await supabase.from('inspiracoes').upsert(fromInspiracao(item));
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('inspiracoes').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── ConfigSistema ─────────────────────────────────────────────────────────────
function toConfig(r: Record<string, unknown>): ConfigSistema {
  const itensRaw = (r.itens_padrao ?? []) as Array<Record<string, unknown>>;
  return {
    enderecoOrigem: (r.endereco_origem as string) ?? '',
    nomeVeiculo: (r.nome_veiculo as string) ?? '',
    valorVeiculo: Number(r.valor_veiculo ?? 0),
    vidaUtilKm: Number(r.vida_util_km ?? 150000),
    consumoKmL: Number(r.consumo_km_l ?? 12),
    precoCombustivel: Number(r.preco_combustivel ?? 6.5),
    custoManutencaoKm: Number(r.custo_manutencao_km ?? 0.1),
    itensPadraoOrcamento: itensRaw.map(i => ({
      id: i.id as string,
      descricao: i.descricao as string,
      quantidade: Number(i.quantidade),
      valorUnitario: Number(i.valorUnitario ?? i.valor_unitario ?? 0),
    })) as ItemPadraoOrcamento[],
  };
}
function fromConfig(c: ConfigSistema): Record<string, unknown> {
  return {
    id: 'singleton',
    endereco_origem: c.enderecoOrigem,
    nome_veiculo: c.nomeVeiculo,
    valor_veiculo: c.valorVeiculo,
    vida_util_km: c.vidaUtilKm,
    consumo_km_l: c.consumoKmL,
    preco_combustivel: c.precoCombustivel,
    custo_manutencao_km: c.custoManutencaoKm,
    itens_padrao: c.itensPadraoOrcamento,
    updated_at: new Date().toISOString(),
  };
}

export const configDb = {
  get: async (): Promise<ConfigSistema> => {
    const { data, error } = await supabase
      .from('config_sistema').select('*').eq('id', 'singleton').maybeSingle();
    if (error) throw error;
    if (!data) return { ...defaultConfig };
    return toConfig(data as Record<string, unknown>);
  },
  save: async (cfg: ConfigSistema): Promise<void> => {
    const { error } = await supabase.from('config_sistema').upsert(fromConfig(cfg));
    if (error) throw error;
  },
};

// ── Gera / atualiza parcelas de prova de um contrato ─────────────────────────
export async function gerarParcelasDb(
  contratoId: string,
  clienteId: string,
  quantidadeProvas: number,
  valorTotal: number,
  valorEntrada: number,
): Promise<ParcelaProva[]> {
  const existing = await parcelaProvaDb.getByContrato(contratoId);
  const pagas = existing.filter(p => p.pago);
  if (pagas.length === existing.length && existing.length === quantidadeProvas) return existing;

  // Remove não pagas
  if (existing.some(p => !p.pago)) {
    const { error } = await supabase
      .from('parcelas_prova').delete()
      .eq('contrato_id', contratoId).eq('pago', false);
    if (error) throw error;
  }

  const qtdPagas = pagas.length;
  const saldo = valorTotal - valorEntrada;
  const jaPago = pagas.reduce((acc, p) => acc + p.valorParcela, 0);
  const novasQtd = quantidadeProvas - qtdPagas;
  const valorParcela = novasQtd > 0 ? (saldo - jaPago) / novasQtd : 0;

  const novas: ParcelaProva[] = Array.from({ length: novasQtd }, (_, i) => ({
    id: genId(),
    contratoId, clienteId, numero: qtdPagas + i + 1,
    statusProva: 'pendente' as const,
    valorParcela, pago: false, createdAt: new Date().toISOString(),
  }));

  if (novas.length > 0) {
    const { error } = await supabase
      .from('parcelas_prova').insert(novas.map(p => fromParcelaProva(p)));
    if (error) throw error;
  }
  return [...pagas, ...novas];
}
