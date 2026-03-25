/** Status mappings shared across the app */

export const STATUS_CLIENTE = [
  { value: 'lead',      label: 'Lead',      color: 'yellow' as const },
  { value: 'ativo',     label: 'Ativo',     color: 'rose'   as const },
  { value: 'concluido', label: 'Concluído', color: 'green'  as const },
  { value: 'inativo',   label: 'Inativo',   color: 'gray'   as const },
] as const;

export const STATUS_CONTRATO = [
  { value: 'rascunho',     label: 'Rascunho',     color: 'gray'   as const },
  { value: 'assinado',     label: 'Assinado',     color: 'blue'   as const },
  { value: 'em_andamento', label: 'Em Andamento', color: 'yellow' as const },
  { value: 'concluido',    label: 'Concluído',    color: 'green'  as const },
  { value: 'cancelado',    label: 'Cancelado',    color: 'red'    as const },
] as const;

export const STATUS_ORCAMENTO = [
  { value: 'pendente',  label: 'Pendente',  color: 'yellow' as const },
  { value: 'aprovado',  label: 'Aprovado',  color: 'green'  as const },
  { value: 'recusado',  label: 'Recusado',  color: 'red'    as const },
  { value: 'expirado',  label: 'Expirado',  color: 'gray'   as const },
] as const;

export const STATUS_FICHA = [
  { value: 'aguardando', label: 'Aguardando', color: 'gray'   as const },
  { value: 'em_corte',   label: 'Em Corte',   color: 'yellow' as const },
  { value: 'costura',    label: 'Costura',     color: 'blue'   as const },
  { value: 'prova',      label: 'Prova',       color: 'purple' as const },
  { value: 'ajuste',     label: 'Ajuste',      color: 'rose'   as const },
  { value: 'concluida',  label: 'Concluída',   color: 'green'  as const },
] as const;

export const STATUS_PAGAMENTO = [
  { value: 'pago',     label: 'Pago',     color: 'green'  as const },
  { value: 'pendente', label: 'Pendente', color: 'yellow' as const },
  { value: 'vencido',  label: 'Vencido',  color: 'red'    as const },
] as const;

export const FORMAS_PAGAMENTO = [
  { value: 'pix',             label: 'PIX' },
  { value: 'cartao_credito',  label: 'Cartão de Crédito' },
  { value: 'cartao_debito',   label: 'Cartão de Débito' },
  { value: 'dinheiro',        label: 'Dinheiro' },
  { value: 'transferencia',   label: 'Transferência' },
  { value: 'boleto',          label: 'Boleto' },
] as const;

export const TIPOS_PAGAMENTO = [
  { value: 'entrada',   label: 'Entrada' },
  { value: 'parcela',   label: 'Parcela' },
  { value: 'adicional', label: 'Adicional' },
  { value: 'ajuste',    label: 'Ajuste' },
] as const;

export const TIPOS_VESTIDO = [
  { value: 'evasê',      label: 'Evasê' },
  { value: 'sereia',     label: 'Sereia' },
  { value: 'princesa',   label: 'Princesa' },
  { value: 'reto',       label: 'Reto' },
  { value: 'imperio',    label: 'Império' },
  { value: 'A',          label: 'Linha A' },
  { value: 'sob_medida', label: 'Sob Medida' },
  { value: 'outro',      label: 'Outro' },
] as const;

/** Helper to find label/color from a status array */
export function getStatusInfo<T extends readonly { value: string; label: string; color: string }[]>(
  list: T,
  value: string,
): { label: string; color: string } {
  const item = list.find(s => s.value === value);
  return item ? { label: item.label, color: item.color } : { label: value, color: 'gray' };
}
