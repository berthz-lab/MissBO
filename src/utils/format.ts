/** Formata valor monetário em Real Brasileiro */
export const fmtMoney = (v: number): string =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Valor mascarado */
export const HIDDEN_VALUE = 'R$ •••••';

/**
 * Formata telefone:
 * Internacional (começa com +) → retorna como está
 * Brasileiro 11 dígitos → "(27) 99801-6927"
 * Brasileiro 10 dígitos → "(27) 3301-2345"
 * Outro → retorna original
 */
export const fmtTelefone = (tel: string): string => {
  if (!tel) return '';
  if (tel.trim().startsWith('+')) return tel; // internacional — exibe como digitado
  const d = tel.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
};
