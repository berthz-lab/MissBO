import { ConfigSistema, defaultConfig } from '../types';

const KEYS = {
  config: 'atelie_config',
};

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Config do Sistema (cache local) ──────────────────────────────────────────
export const configStorage = {
  get: (): ConfigSistema => {
    try {
      const raw = localStorage.getItem(KEYS.config);
      return raw ? { ...defaultConfig, ...JSON.parse(raw) } : { ...defaultConfig };
    } catch {
      return { ...defaultConfig };
    }
  },
  save: (cfg: ConfigSistema) => {
    localStorage.setItem(KEYS.config, JSON.stringify(cfg));
  },
};

/** Calcula o custo estimado por km (ida) com base na config. */
export function calcCustoPorKm(cfg: ConfigSistema): number {
  const depreciation = cfg.vidaUtilKm > 0 ? cfg.valorVeiculo / cfg.vidaUtilKm : 0;
  const fuel = cfg.consumoKmL > 0 ? cfg.precoCombustivel / cfg.consumoKmL : 0;
  return depreciation + fuel + cfg.custoManutencaoKm;
}

