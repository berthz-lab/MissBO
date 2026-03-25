/**
 * Tipos que representam as linhas do Supabase (snake_case).
 * Usados internamente em db.ts — não expostos para o resto do app.
 */

export interface ClienteRow {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string | null;
  data_contato: string;
  data_casamento: string | null;
  local: string | null;
  endereco: string | null;
  distancia_km: number | null;
  instagram: string | null;
  indicacao: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
}

export interface MedidasRow {
  id: string;
  cliente_id: string;
  data: string;
  created_at: string;
  busto: number | null;
  cava_a_cavas_costas: number | null;
  abaixo_do_busto: number | null;
  cava_a_cavas_frente: number | null;
  quadril: number | null;
  colarinho: number | null;
  ombro_a_ombro: number | null;
  alt_centro_frente: number | null;
  alt_ombro_frente: number | null;
  alt_ombro_costas: number | null;
  alt_centro_costas: number | null;
  separacao_busto: number | null;
  cintura: number | null;
  alt_busto: number | null;
  alt_gancho_frente: number | null;
  alt_quadril: number | null;
  alt_desejada_saia: number | null;
  alt_cintura_ao_joelho: number | null;
  punho: number | null;
  larg_joelho: number | null;
  altura_lateral: number | null;
  larg_braco: number | null;
  cumprimento_braco: number | null;
  alt_manga_34: number | null;
  altura_manga_curta: number | null;
  ombro: number | null;
  observacoes: string | null;
}

export interface FichaRow {
  id: string;
  cliente_id: string;
  nome_peca: string;
  categoria: string;
  tecido: string | null;
  cor: string | null;
  modelagem: string | null;
  detalhes: string | null;
  status: string;
  data_entrega: string | null;
  valor_custo: number | null;
  valor_venda: number | null;
  observacoes: string | null;
  created_at: string;
}

export interface ContratoRow {
  id: string;
  cliente_id: string;
  numero: string;
  orcamento_id: string | null;
  data_assinatura: string;
  data_entrega: string | null;
  valor_total: number;
  valor_entrada: number;
  parcelas_restantes: number | null;
  quantidade_provas: number | null;
  status: string;
  descricao_pecas: string | null;
  clausulas_especiais: string | null;
  anexo_base64: string | null;
  anexo_nome: string | null;
  anexo_tipo: string | null;
  created_at: string;
}

export interface ItemOrcamentoRow {
  id: string;
  orcamento_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

export interface OrcamentoRow {
  id: string;
  cliente_id: string;
  numero: string;
  titulo: string | null;
  tipo_vestido: string | null;
  data: string;
  validade: string | null;
  desconto: number;
  status: string;
  observacoes: string | null;
  custos: string | null;      // JSON stringificado
  margem_lucro: number | null;
  created_at: string;
  itens: ItemOrcamentoRow[];  // join via select('*, itens:orcamento_itens(*)')
}

export interface AgendamentoRow {
  id: string;
  cliente_id: string;
  tipo: string;
  data: string;
  hora: string;
  duracao: number;
  descricao: string | null;
  status: string;
  created_at: string;
}

export interface PagamentoRow {
  id: string;
  cliente_id: string;
  contrato_id: string | null;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  status: string;
  forma_pagamento: string | null;
  created_at: string;
}

export interface ParcelaProvaRow {
  id: string;
  contrato_id: string;
  cliente_id: string;
  numero: number;
  data_prova: string | null;
  hora_prova: string | null;
  status_prova: string;
  valor_parcela: number;
  valor_pago: number | null;
  pago: boolean;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  pagamento_id: string | null;
  created_at: string;
}

export interface InspiacaoRow {
  id: string;
  cliente_id: string;
  titulo: string;
  imagem_base64: string | null;
  imagem_url: string | null;
  categoria: string;
  observacoes: string | null;
  favorito: boolean;
  created_at: string;
}

export interface ConfigRow {
  id: string;
  endereco_origem: string;
  nome_veiculo: string;
  valor_veiculo: number;
  vida_util_km: number;
  consumo_km_l: number;
  preco_combustivel: number;
  custo_manutencao_km: number;
  itens_padrao: unknown[];
  updated_at: string;
}
