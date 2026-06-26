import { useCallback } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Contrato, Orcamento, Pagamento, ParcelaProva } from '../../types';
import { contratoDb, orcamentoDb, pagamentoDb, gerarParcelasDb, upsertArr } from '../../utils/db';
import { BgFn } from './useClienteSlice';

type S<T> = Dispatch<SetStateAction<T>>;

export function useContratoSlice(
  contratos: Contrato[],
  orcamentos: Orcamento[],
  bg: BgFn,
  s: {
    setContratos: S<Contrato[]>;
    setParcelasProva: S<ParcelaProva[]>;
    setOrcamentos: S<Orcamento[]>;
    setPagamentos: S<Pagamento[]>;
  },
) {
  const saveContrato = useCallback((c: Contrato) => {
    s.setContratos(prev => upsertArr(prev, c));
    bg(async () => {
      await contratoDb.save(c);
      if (c.quantidadeProvas && c.quantidadeProvas > 0) {
        const novas = await gerarParcelasDb(
          c.id, c.clienteId, c.quantidadeProvas, c.valorTotal, c.valorEntrada,
        );
        if (novas.length > 0) {
          s.setParcelasProva(prev => {
            const sem = prev.filter(p => p.contratoId !== c.id);
            return [...sem, ...novas];
          });
        }
      }
      if (c.orcamentoId) {
        const orc = orcamentos.find(o => o.id === c.orcamentoId);
        if (orc && orc.status === 'pendente') {
          const updated = { ...orc, status: 'aprovado' as const };
          s.setOrcamentos(prev => upsertArr(prev, updated));
          await orcamentoDb.save(updated);
        }
      }
    });
  // orcamentos incluso para leitura (status do orçamento)
  }, [bg, s, orcamentos]);

  const deleteContrato = useCallback((id: string) => {
    s.setContratos(prev => prev.filter(c => c.id !== id));
    s.setParcelasProva(prev => prev.filter(p => p.contratoId !== id));
    s.setPagamentos(prev => prev.filter(p => !p.id.startsWith(`prov-${id}-`)));
    bg(async () => {
      await contratoDb.delete(id); // CASCADE apaga parcelas_prova no DB
      await pagamentoDb.deleteByContratoProvas(id); // apaga prov-* sem FK cascade
    });
  }, [bg, s]);

  const getContratosByCliente = useCallback(
    (clienteId: string) => contratos.filter(c => c.clienteId === clienteId),
    [contratos],
  );

  const nextNumeroContrato = useCallback(() => {
    const max = contratos.reduce((acc, c) => {
      const n = parseInt(c.numero.replace(/\D/g, ''));
      return n > acc ? n : acc;
    }, 0);
    return String(max + 1).padStart(4, '0');
  }, [contratos]);

  return { saveContrato, deleteContrato, getContratosByCliente, nextNumeroContrato };
}
