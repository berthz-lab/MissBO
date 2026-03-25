import { useCallback } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Agendamento, ParcelaProva, TipoAgendamento } from '../../types';
import { agendamentoDb, parcelaProvaDb, upsertArr } from '../../utils/db';
import { BgFn } from './useClienteSlice';

type S<T> = Dispatch<SetStateAction<T>>;

const PROVA_TIPOS: TipoAgendamento[] = [
  'primeira_prova', 'segunda_prova', 'terceira_prova',
  'quarta_prova', 'quinta_prova', 'sexta_prova',
];
const isProvaTipo = (t: TipoAgendamento) => [...PROVA_TIPOS, 'prova_final'].includes(t);

export function useAgendaSlice(
  agendamentos: Agendamento[],
  parcelasProva: ParcelaProva[],
  bg: BgFn,
  s: {
    setAgendamentos: S<Agendamento[]>;
    setParcelasProva: S<ParcelaProva[]>;
  },
) {
  const saveAgendamento = useCallback((a: Agendamento) => {
    s.setAgendamentos(prev => upsertArr(prev, a));
    bg(() => agendamentoDb.save(a));

    // Sync: se vinculado a parcela (ag-{parcelaId}), atualiza a parcela
    if (a.id.startsWith('ag-')) {
      const parcelaId = a.id.slice(3);
      const parcela = parcelasProva.find(p => p.id === parcelaId);
      if (parcela) {
        const updated: ParcelaProva = {
          ...parcela,
          dataProva: a.data,
          horaProva: a.hora,
          statusProva: a.status === 'cancelado' ? 'cancelada'
            : a.status === 'concluido' ? 'realizada'
            : a.data ? 'agendada' : 'pendente',
        };
        s.setParcelasProva(prev => upsertArr(prev, updated));
        bg(() => parcelaProvaDb.save(updated));
      }
    } else if (isProvaTipo(a.tipo)) {
      // Agendamento de prova criado pela Agenda (sem vínculo): tenta vincular a parcela pendente
      const parcelaSemData = parcelasProva.find(p =>
        p.clienteId === a.clienteId && !p.dataProva && p.statusProva === 'pendente',
      );
      if (parcelaSemData) {
        const updated: ParcelaProva = {
          ...parcelaSemData,
          dataProva: a.data,
          horaProva: a.hora,
          statusProva: 'agendada',
        };
        s.setParcelasProva(prev => upsertArr(prev, updated));
        bg(() => parcelaProvaDb.save(updated));
        // Renomeia o agendamento para vincular
        const linked: Agendamento = { ...a, id: `ag-${parcelaSemData.id}` };
        s.setAgendamentos(prev => prev.filter(x => x.id !== a.id).concat(linked));
        bg(async () => {
          await agendamentoDb.delete(a.id);
          await agendamentoDb.save(linked);
        });
      }
    }
  }, [bg, s, parcelasProva]);

  const deleteAgendamento = useCallback((id: string) => {
    s.setAgendamentos(prev => prev.filter(a => a.id !== id));
    bg(() => agendamentoDb.delete(id));

    // Sync: se era vinculado a prova, limpa a data da parcela
    if (id.startsWith('ag-')) {
      const parcelaId = id.slice(3);
      const parcela = parcelasProva.find(p => p.id === parcelaId);
      if (parcela && !parcela.pago) {
        const updated: ParcelaProva = {
          ...parcela,
          dataProva: undefined,
          horaProva: undefined,
          statusProva: 'pendente',
        };
        s.setParcelasProva(prev => upsertArr(prev, updated));
        bg(() => parcelaProvaDb.save(updated));
      }
    }
  }, [bg, s, parcelasProva]);

  const getAgendamentosByCliente = useCallback(
    (clienteId: string) => agendamentos.filter(a => a.clienteId === clienteId),
    [agendamentos],
  );

  return { saveAgendamento, deleteAgendamento, getAgendamentosByCliente };
}
