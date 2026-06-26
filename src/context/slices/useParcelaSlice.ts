import { useCallback } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Agendamento, Contrato, Pagamento, ParcelaProva, TipoAgendamento } from '../../types';
import { agendamentoDb, pagamentoDb, parcelaProvaDb, upsertArr } from '../../utils/db';
import { BgFn } from './useClienteSlice';

type S<T> = Dispatch<SetStateAction<T>>;

const PROVA_TIPOS: TipoAgendamento[] = [
  'primeira_prova', 'segunda_prova', 'terceira_prova',
  'quarta_prova', 'quinta_prova', 'sexta_prova',
];
const provaTipo = (num: number): TipoAgendamento =>
  num >= 1 && num <= 6 ? PROVA_TIPOS[num - 1] : 'prova_final';

const provaPagementoId = (p: ParcelaProva) => `prov-${p.contratoId}-${p.numero}`;

export function useParcelaSlice(
  parcelasProva: ParcelaProva[],
  agendamentos: Agendamento[],
  contratos: Contrato[],
  bg: BgFn,
  s: {
    setParcelasProva: S<ParcelaProva[]>;
    setAgendamentos: S<Agendamento[]>;
    setPagamentos: S<Pagamento[]>;
  },
) {
  const saveParcelaProva = useCallback((p: ParcelaProva) => {
    let updated = { ...p };

    if (p.pago && p.dataPagamento) {
      const pagId = p.pagamentoId || provaPagementoId(p);
      const contrato = contratos.find(c => c.id === p.contratoId);
      const valorEfetivo = p.valorPago ?? p.valorParcela;
      const pag: Pagamento = {
        id: pagId, clienteId: p.clienteId, contratoId: p.contratoId,
        descricao: `${p.numero}ª Prova — ${contrato?.descricaoPecas || 'Vestido'}`,
        valor: valorEfetivo, data: p.dataPagamento, tipo: 'parcela',
        status: 'pago', formaPagamento: p.formaPagamento,
        createdAt: new Date().toISOString(),
      };
      s.setPagamentos(prev => upsertArr(prev, pag));
      updated = { ...updated, pagamentoId: pagId };
      bg(() => pagamentoDb.save(pag));
    } else if (!p.pago) {
      const idToDelete = p.pagamentoId || provaPagementoId(p);
      s.setPagamentos(prev => prev.filter(x => x.id !== idToDelete));
      updated = {
        ...updated,
        pagamentoId: undefined, valorPago: undefined,
        dataPagamento: undefined, formaPagamento: undefined,
      };
      bg(() => pagamentoDb.delete(idToDelete));
    }

    // Redistribuir saldo restante entre parcelas não pagas do mesmo contrato
    const contratoObj = contratos.find(c => c.id === updated.contratoId);
    const redistribuidas: ParcelaProva[] = [];
    if (contratoObj) {
      const todasDoContrato = parcelasProva
        .filter(x => x.contratoId === updated.contratoId)
        .map(x => x.id === updated.id ? updated : x);
      const pagas     = todasDoContrato.filter(x => x.pago);
      const naoPagas  = todasDoContrato.filter(x => !x.pago && x.statusProva !== 'cancelada');
      if (naoPagas.length > 0) {
        const totalPagoProvas = pagas.reduce((acc, x) => acc + (x.valorPago ?? x.valorParcela), 0);
        const saldo = Math.max(0, contratoObj.valorTotal - contratoObj.valorEntrada - totalPagoProvas);
        const base  = Math.floor((saldo / naoPagas.length) * 100) / 100;
        naoPagas.forEach((x, i) => {
          const valorParcela = i === naoPagas.length - 1
            ? Math.round((saldo - base * (naoPagas.length - 1)) * 100) / 100
            : base;
          redistribuidas.push({ ...x, valorParcela });
        });
      }
    }

    s.setParcelasProva(prev => {
      let result = upsertArr(prev, updated);
      for (const r of redistribuidas) result = upsertArr(result, r);
      return result;
    });
    bg(() => parcelaProvaDb.save(updated));
    redistribuidas.forEach(r => bg(() => parcelaProvaDb.save(r)));

    // Sync: cria/atualiza agendamento vinculado quando a parcela tem data
    const agId = `ag-${updated.id}`;
    if (updated.dataProva) {
      const existingAg = agendamentos.find(a => a.id === agId);
      const ag: Agendamento = {
        id: agId,
        clienteId: updated.clienteId,
        tipo: provaTipo(updated.numero),
        data: updated.dataProva,
        hora: updated.horaProva || '10:00',
        duracao: existingAg?.duracao || 60,
        descricao: existingAg?.descricao || `${updated.numero}ª Prova`,
        status: updated.statusProva === 'realizada' ? 'concluido'
          : updated.statusProva === 'cancelada' ? 'cancelado'
          : 'agendado',
        createdAt: existingAg?.createdAt || new Date().toISOString(),
      };
      s.setAgendamentos(prev => upsertArr(prev, ag));
      bg(() => agendamentoDb.save(ag));
    } else {
      const existingAg = agendamentos.find(a => a.id === agId);
      if (existingAg) {
        s.setAgendamentos(prev => prev.filter(a => a.id !== agId));
        bg(() => agendamentoDb.delete(agId));
      }
    }
  }, [bg, s, parcelasProva, agendamentos, contratos]);

  const deleteParcelaProva = useCallback((id: string) => {
    const parcela = parcelasProva.find(p => p.id === id);
    if (parcela?.pagamentoId) {
      s.setPagamentos(prev => prev.filter(p => p.id !== parcela.pagamentoId));
      bg(() => pagamentoDb.delete(parcela.pagamentoId!));
    }
    s.setParcelasProva(prev => prev.filter(p => p.id !== id));
    bg(() => parcelaProvaDb.delete(id));
    // Sync: deleta agendamento vinculado
    const agId = `ag-${id}`;
    const existingAg = agendamentos.find(a => a.id === agId);
    if (existingAg) {
      s.setAgendamentos(prev => prev.filter(a => a.id !== agId));
      bg(() => agendamentoDb.delete(agId));
    }
  }, [bg, s, parcelasProva, agendamentos]);

  const getParcelasProvaByContrato = useCallback(
    (contratoId: string) => parcelasProva.filter(p => p.contratoId === contratoId),
    [parcelasProva],
  );

  const getParcelasProvaByCliente = useCallback(
    (clienteId: string) => parcelasProva.filter(p => p.clienteId === clienteId),
    [parcelasProva],
  );

  return {
    saveParcelaProva, deleteParcelaProva,
    getParcelasProvaByContrato, getParcelasProvaByCliente,
  };
}
