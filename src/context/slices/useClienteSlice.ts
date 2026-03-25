import { useCallback } from 'react';
import { Dispatch, SetStateAction } from 'react';
import {
  Cliente, MedidasNoiva, FichaTecnica, Contrato,
  Orcamento, Agendamento, Pagamento, ParcelaProva, Inspiracao,
} from '../../types';
import { clienteDb, upsertArr } from '../../utils/db';

type S<T> = Dispatch<SetStateAction<T>>;
export type BgFn = (op: () => Promise<void>) => void;

interface Setters {
  setClientes: S<Cliente[]>;
  setContratos: S<Contrato[]>;
  setMedidas: S<MedidasNoiva[]>;
  setFichasTecnicas: S<FichaTecnica[]>;
  setOrcamentos: S<Orcamento[]>;
  setAgendamentos: S<Agendamento[]>;
  setPagamentos: S<Pagamento[]>;
  setParcelasProva: S<ParcelaProva[]>;
  setInspiracoes: S<Inspiracao[]>;
}

export function useClienteSlice(
  clientes: Cliente[],
  bg: BgFn,
  s: Setters,
) {
  const saveCliente = useCallback((c: Cliente) => {
    s.setClientes(prev => upsertArr(prev, c));
    bg(() => clienteDb.save(c));
  }, [bg, s]);

  const deleteCliente = useCallback((id: string) => {
    s.setClientes(prev => prev.filter(c => c.id !== id));
    s.setContratos(prev => prev.filter(c => c.clienteId !== id));
    s.setMedidas(prev => prev.filter(m => m.clienteId !== id));
    s.setFichasTecnicas(prev => prev.filter(f => f.clienteId !== id));
    s.setOrcamentos(prev => prev.filter(o => o.clienteId !== id));
    s.setAgendamentos(prev => prev.filter(a => a.clienteId !== id));
    s.setPagamentos(prev => prev.filter(p => p.clienteId !== id));
    s.setParcelasProva(prev => prev.filter(p => p.clienteId !== id));
    s.setInspiracoes(prev => prev.filter(i => i.clienteId !== id));
    bg(() => clienteDb.delete(id)); // ON DELETE CASCADE cuida dos filhos
  }, [bg, s]);

  const getCliente = useCallback(
    (id: string) => clientes.find(c => c.id === id),
    [clientes],
  );

  return { saveCliente, deleteCliente, getCliente };
}
