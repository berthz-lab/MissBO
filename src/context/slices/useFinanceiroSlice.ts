import { useCallback } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Pagamento, Inspiracao } from '../../types';
import { pagamentoDb, inspiracaoDb, upsertArr } from '../../utils/db';
import { BgFn } from './useClienteSlice';

type S<T> = Dispatch<SetStateAction<T>>;

export function useFinanceiroSlice(
  pagamentos: Pagamento[],
  inspiracoes: Inspiracao[],
  bg: BgFn,
  s: {
    setPagamentos: S<Pagamento[]>;
    setInspiracoes: S<Inspiracao[]>;
  },
) {
  // ── Pagamentos ─────────────────────────────────────────────────────────────
  const savePagamento = useCallback((p: Pagamento) => {
    s.setPagamentos(prev => upsertArr(prev, p));
    bg(() => pagamentoDb.save(p));
  }, [bg, s]);

  const deletePagamento = useCallback((id: string) => {
    s.setPagamentos(prev => prev.filter(p => p.id !== id));
    bg(() => pagamentoDb.delete(id));
  }, [bg, s]);

  const getPagamentosByCliente = useCallback(
    (clienteId: string) => pagamentos.filter(p => p.clienteId === clienteId),
    [pagamentos],
  );

  // ── Inspirações ────────────────────────────────────────────────────────────
  const saveInspiracao = useCallback((i: Inspiracao) => {
    s.setInspiracoes(prev => upsertArr(prev, i));
    bg(() => inspiracaoDb.save(i));
  }, [bg, s]);

  const deleteInspiracao = useCallback((id: string) => {
    s.setInspiracoes(prev => prev.filter(i => i.id !== id));
    bg(() => inspiracaoDb.delete(id));
  }, [bg, s]);

  const getInspiracoesCliente = useCallback(
    (clienteId: string) => inspiracoes.filter(i => i.clienteId === clienteId),
    [inspiracoes],
  );

  return {
    savePagamento, deletePagamento, getPagamentosByCliente,
    saveInspiracao, deleteInspiracao, getInspiracoesCliente,
  };
}
