import { useCallback } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Orcamento } from '../../types';
import { orcamentoDb, upsertArr } from '../../utils/db';
import { BgFn } from './useClienteSlice';

type S<T> = Dispatch<SetStateAction<T>>;

export function useOrcamentoSlice(
  orcamentos: Orcamento[],
  bg: BgFn,
  s: { setOrcamentos: S<Orcamento[]> },
) {
  const saveOrcamento = useCallback((o: Orcamento) => {
    s.setOrcamentos(prev => upsertArr(prev, o));
    bg(() => orcamentoDb.save(o));
  }, [bg, s]);

  const deleteOrcamento = useCallback((id: string) => {
    s.setOrcamentos(prev => prev.filter(o => o.id !== id));
    bg(() => orcamentoDb.delete(id));
  }, [bg, s]);

  const getOrcamentosByCliente = useCallback(
    (clienteId: string) => orcamentos.filter(o => o.clienteId === clienteId),
    [orcamentos],
  );

  const nextNumeroOrcamento = useCallback(() => {
    const max = orcamentos.reduce((acc, o) => {
      const n = parseInt(o.numero.replace(/\D/g, ''));
      return n > acc ? n : acc;
    }, 0);
    return `ORC-${String(max + 1).padStart(4, '0')}`;
  }, [orcamentos]);

  return { saveOrcamento, deleteOrcamento, getOrcamentosByCliente, nextNumeroOrcamento };
}
