import { useCallback } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { MedidasNoiva, FichaTecnica } from '../../types';
import { medidasDb, fichaDb, upsertArr } from '../../utils/db';
import { BgFn } from './useClienteSlice';

type S<T> = Dispatch<SetStateAction<T>>;

export function useFichasSlice(
  medidas: MedidasNoiva[],
  fichasTecnicas: FichaTecnica[],
  bg: BgFn,
  s: {
    setMedidas: S<MedidasNoiva[]>;
    setFichasTecnicas: S<FichaTecnica[]>;
  },
) {
  // ── Medidas ────────────────────────────────────────────────────────────────
  const saveMedidas = useCallback((m: MedidasNoiva) => {
    s.setMedidas(prev => upsertArr(prev, m));
    bg(() => medidasDb.save(m));
  }, [bg, s]);

  const deleteMedidas = useCallback((id: string) => {
    s.setMedidas(prev => prev.filter(m => m.id !== id));
    bg(() => medidasDb.delete(id));
  }, [bg, s]);

  const getMedidasByCliente = useCallback(
    (clienteId: string) => medidas.filter(m => m.clienteId === clienteId),
    [medidas],
  );

  // ── Fichas Técnicas ────────────────────────────────────────────────────────
  const saveFicha = useCallback((f: FichaTecnica) => {
    s.setFichasTecnicas(prev => upsertArr(prev, f));
    bg(() => fichaDb.save(f));
  }, [bg, s]);

  const deleteFicha = useCallback((id: string) => {
    s.setFichasTecnicas(prev => prev.filter(f => f.id !== id));
    bg(() => fichaDb.delete(id));
  }, [bg, s]);

  const getFichasByCliente = useCallback(
    (clienteId: string) => fichasTecnicas.filter(f => f.clienteId === clienteId),
    [fichasTecnicas],
  );

  return {
    saveMedidas, deleteMedidas, getMedidasByCliente,
    saveFicha, deleteFicha, getFichasByCliente,
  };
}
