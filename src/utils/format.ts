/** Formata valor monetário em Real Brasileiro */
export const fmtMoney = (v: number): string =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Formata telefone brasileiro:
 * "27998016927"  → "(27) 99801-6927"  (celular 11 dígitos)
 * "2733012345"   → "(27) 3301-2345"   (fixo 10 dígitos)
 * Qualquer outro → retorna o original sem modificação
 */
export const fmtTelefone = (tel: string): string => {
  const d = tel.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
};
