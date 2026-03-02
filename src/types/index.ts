// ─── CONFIGURAÇÃO DO SISTEMA ─────────────────────────────────────────────────

/** Item que é pré-adicionado automaticamente a todo novo orçamento */
export interface ItemPadraoOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface ConfigSistema {
  // Origem da estilista
  enderecoOrigem: string;
  // Veículo
  nomeVeiculo: string;        // ex: "Fiat Argo 2022"
  valorVeiculo: number;       // R$ (para depreciação)
  vidaUtilKm: number;         // km total esperada do veículo
  consumoKmL: number;         // km/litro
  precoCombustivel: number;   // R$/litro
  custoManutencaoKm: number;  // R$/km (óleos, pneus, etc)
  // Itens padrão do orçamento
  itensPadraoOrcamento: ItemPadraoOrcamento[];
}

export const defaultConfig: ConfigSistema = {
  enderecoOrigem: '',
  nomeVeiculo: '',
  valorVeiculo: 0,
  vidaUtilKm: 150000,
  consumoKmL: 12,
  precoCombustivel: 6.5,
  custoManutencaoKm: 0.10,
  itensPadraoOrcamento: [],
};

// ─── CLIENTE ────────────────────────────────────────────────────────────────
export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf?: string;
  dataContato: string;
  dataCasamento?: string;
  local?: string;
  endereco?: string;          // endereço completo para navegação
  distanciaKm?: number;       // distância do ateliê até a cliente (km, ida)
  instagram?: string;         // @ do Instagram da cliente
  indicacao?: string;
  status: 'lead' | 'ativo' | 'concluido' | 'cancelado';
  observacoes?: string;
  createdAt: string;
}

// ─── MEDIDAS ─────────────────────────────────────────────────────────────────
export interface MedidasNoiva {
  id: string;
  clienteId: string;
  data: string;
  createdAt?: string;
  // Medidas
  busto?: number;
  cavaAcavasCostas?: number;
  abaixoDoBusto?: number;
  cavaAcavasFrente?: number;
  quadril?: number;
  colarinho?: number;
  ombroAOmbro?: number;
  altCentroFrente?: number;
  altOmbroFrente?: number;
  altOmbroCostas?: number;
  altCentroCostas?: number;
  separacaoBusto?: number;
  cintura?: number;
  altBusto?: number;
  altGanchoFrente?: number;
  altQuadril?: number;
  altDesejadaSaia?: number;
  altCinturaAoJoelho?: number;
  punho?: number;
  largJoelho?: number;
  alturaLateral?: number;
  largBraco?: number;
  cumprimentoBraco?: number;
  altManga34?: number;
  alturaMangaCurta?: number;
  ombro?: number;
  observacoes?: string;
}

// ─── FICHA TÉCNICA ───────────────────────────────────────────────────────────
export interface FichaTecnica {
  id: string;
  clienteId: string;
  nomePeca: string;
  categoria: 'vestido' | 'veu' | 'acessorio' | 'roupa_cerimonia' | 'outro';
  tecido: string;
  cor: string;
  modelagem: string;
  detalhes: string;
  status: 'aguardando' | 'em_corte' | 'costura' | 'prova' | 'ajuste' | 'concluida';
  dataEntrega?: string;
  valorCusto?: number;
  valorVenda?: number;
  observacoes?: string;
  createdAt: string;
}

// ─── CONTRATO ────────────────────────────────────────────────────────────────
export interface Contrato {
  id: string;
  clienteId: string;
  numero: string;
  orcamentoId?: string;             // orçamento que originou este contrato (opcional)
  dataAssinatura: string;
  dataEntrega: string;
  valorTotal: number;
  valorEntrada: number;
  parcelasRestantes?: number;
  quantidadeProvas?: number;        // ← número de provas definido no contrato
  status: 'rascunho' | 'assinado' | 'em_andamento' | 'concluido' | 'cancelado';
  descricaoPecas: string;
  clausulasEspeciais?: string;
  // Anexo de arquivo (base64)
  anexoBase64?: string;
  anexoNome?: string;
  anexoTipo?: string;
  createdAt: string;
}

// ─── PARCELA DE PROVA ─────────────────────────────────────────────────────────
export type FormaPagamentoProva = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia';

export interface ParcelaProva {
  id: string;
  contratoId: string;
  clienteId: string;
  numero: number;                   // 1, 2, 3 …
  dataProva?: string;               // data agendada para a prova
  horaProva?: string;               // hora agendada
  statusProva: 'pendente' | 'agendada' | 'realizada' | 'cancelada';
  valorParcela: number;             // valor negociado para esta prova
  valorPago?: number;               // valor efetivamente pago (pode diferir do negociado)
  pago: boolean;
  dataPagamento?: string;           // data em que foi pago
  formaPagamento?: FormaPagamentoProva;
  observacoes?: string;
  pagamentoId?: string;             // ID do Pagamento gerado automaticamente ao pagar
  createdAt: string;
}

// ─── ORÇAMENTO ───────────────────────────────────────────────────────────────
export interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface Orcamento {
  id: string;
  clienteId: string;
  numero: string;
  data: string;
  validade: string;
  itens: ItemOrcamento[];
  desconto: number;
  status: 'pendente' | 'aprovado' | 'recusado' | 'expirado';
  observacoes?: string;
  createdAt: string;
}

// ─── AGENDAMENTO ─────────────────────────────────────────────────────────────
export type TipoAgendamento =
  | 'consulta'
  | 'primeira_prova'
  | 'segunda_prova'
  | 'prova_final'
  | 'ajuste'
  | 'entrega'
  | 'reuniao';

export interface Agendamento {
  id: string;
  clienteId: string;
  tipo: TipoAgendamento;
  data: string;
  hora: string;
  duracao: number;
  descricao?: string;
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado';
  createdAt: string;
}

// ─── PAGAMENTO ───────────────────────────────────────────────────────────────
export interface Pagamento {
  id: string;
  clienteId: string;
  contratoId?: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'entrada' | 'parcela' | 'saldo' | 'outro';
  status: 'pendente' | 'pago' | 'vencido';
  formaPagamento?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia';
  createdAt: string;
}

// ─── INSPIRAÇÃO ──────────────────────────────────────────────────────────────
export type CategoriaInspiracao =
  | 'vestido'
  | 'acessorio'
  | 'penteado'
  | 'maquiagem'
  | 'decoracao'
  | 'bouquet'
  | 'outro';

export interface Inspiracao {
  id: string;
  clienteId: string;
  titulo: string;
  imagemBase64?: string;
  imagemUrl?: string;
  categoria: CategoriaInspiracao;
  observacoes?: string;
  favorito: boolean;
  createdAt: string;
}
