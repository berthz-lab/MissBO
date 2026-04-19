import React, { useState } from 'react';
import {
  Settings, MapPin, Car, Fuel, Save, ChevronRight,
  TrendingDown, Navigation, Info, Plus, Trash2, Package,
  ShieldCheck, Smartphone, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ConfigSistema, ItemPadraoOrcamento } from '../types';
import { genId } from '../utils/storage';
import { generateTotpSecret, generateQRCode, verifyTotp } from '../utils/totp';

const fmtMoney = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Configuracoes() {
  const app = useApp();
  const [form, setForm] = useState<ConfigSistema>({ ...app.config });
  const [saved, setSaved] = useState(false);

  /* Estado para novo item padrão */
  const [novoItem, setNovoItem] = useState({ descricao: '', quantidade: '1', valorUnitario: '' });

  /* ── TOTP enrollment ── */
  type TotpPhase = 'idle' | 'generating' | 'scanning' | 'verified';
  const [totpPhase, setTotpPhase]           = useState<TotpPhase>('idle');
  const [totpTempSecret, setTotpTempSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl]           = useState('');
  const [totpCode, setTotpCode]             = useState('');
  const [totpError, setTotpError]           = useState('');
  const [totpVerifying, setTotpVerifying]   = useState(false);

  const startTotpEnrollment = async () => {
    setTotpPhase('generating');
    const secret = generateTotpSecret();
    const qr     = await generateQRCode(secret);
    setTotpTempSecret(secret);
    setTotpQrUrl(qr);
    setTotpCode('');
    setTotpError('');
    setTotpPhase('scanning');
  };

  const confirmTotpCode = () => {
    setTotpError('');
    setTotpVerifying(true);
    const code = totpCode.replace(/\D/g, '');
    if (code.length !== 6) { setTotpError('Digite os 6 dígitos do código.'); setTotpVerifying(false); return; }
    const ok = verifyTotp(totpTempSecret, code);
    setTotpVerifying(false);
    if (!ok) { setTotpError('Código incorreto. Tente novamente — o código renova a cada 30s.'); return; }
    // Enrollment confirmed — save secret into form (handleSave will persist)
    setForm(p => ({ ...p, mfaEnabled: true, totpSecret: totpTempSecret }));
    setTotpPhase('verified');
  };

  const disableTotp = () => {
    setForm(p => ({ ...p, mfaEnabled: false, totpSecret: undefined }));
    setTotpPhase('idle');
    setTotpCode('');
    setTotpError('');
    setTotpTempSecret('');
    setTotpQrUrl('');
  };

  const set = (key: keyof ConfigSistema, val: string | number) =>
    setForm(p => ({ ...p, [key]: val }));

  /* Gerenciar itens padrão */
  const addItemPadrao = () => {
    if (!novoItem.descricao.trim() || !novoItem.valorUnitario) return;
    const item: ItemPadraoOrcamento = {
      id: genId(),
      descricao: novoItem.descricao.trim(),
      quantidade: Number(novoItem.quantidade) || 1,
      valorUnitario: Number(novoItem.valorUnitario),
    };
    setForm(p => ({ ...p, itensPadraoOrcamento: [...(p.itensPadraoOrcamento || []), item] }));
    setNovoItem({ descricao: '', quantidade: '1', valorUnitario: '' });
  };

  const removeItemPadrao = (id: string) =>
    setForm(p => ({ ...p, itensPadraoOrcamento: p.itensPadraoOrcamento.filter(i => i.id !== id) }));

  const handleSave = () => {
    app.saveConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  /* ── custo calculado em tempo real ── */
  const deprecKm  = form.vidaUtilKm > 0 ? form.valorVeiculo / form.vidaUtilKm : 0;
  const fuelKm    = form.consumoKmL > 0 ? form.precoCombustivel / form.consumoKmL : 0;
  const totalKm   = deprecKm + fuelKm + form.custoManutencaoKm;
  const visitaCusto = (km: number) => totalKm * km * 2; // ida e volta

  /* ── Maps preview link ── */
  const mapsOriginUrl = form.enderecoOrigem
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.enderecoOrigem)}`
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-black flex items-center justify-center flex-shrink-0">
          <Settings size={18} className="text-brand-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-black"
              style={{ fontFamily: "'Playfair Display', serif" }}>
            Configurações
          </h1>
          <p className="text-sm text-gray-400">Dados globais do sistema e do veículo</p>
        </div>
      </div>

      {/* ── Origem ── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={16} className="text-brand-gold" />
          <h2 className="font-bold text-brand-charcoal">Endereço de Origem</h2>
        </div>
        <p className="text-xs text-gray-400">
          Endereço do ateliê ou residência da estilista — ponto de partida para calcular rotas.
        </p>
        <div>
          <label className="label">Endereço completo *</label>
          <input
            className="input-field"
            placeholder="Rua, Nº, Bairro, Cidade — SP"
            value={form.enderecoOrigem}
            onChange={e => set('enderecoOrigem', e.target.value)}
          />
        </div>
        {mapsOriginUrl && (
          <a
            href={mapsOriginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            <Navigation size={12} /> Ver no Google Maps
          </a>
        )}
      </div>

      {/* ── Veículo ── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Car size={16} className="text-brand-gold" />
          <h2 className="font-bold text-brand-charcoal">Dados do Veículo</h2>
        </div>
        <p className="text-xs text-gray-400">
          Usados para calcular a depreciação e o custo real de cada visita às clientes.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Nome / modelo do veículo</label>
            <input
              className="input-field"
              placeholder="Ex: Fiat Argo 2022"
              value={form.nomeVeiculo}
              onChange={e => set('nomeVeiculo', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Valor do veículo (R$)</label>
            <input
              type="number" min="0" step="1000" className="input-field"
              placeholder="65000"
              value={form.valorVeiculo || ''}
              onChange={e => set('valorVeiculo', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Vida útil estimada (km)</label>
            <input
              type="number" min="1" step="10000" className="input-field"
              placeholder="150000"
              value={form.vidaUtilKm || ''}
              onChange={e => set('vidaUtilKm', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* ── Combustível e Manutenção ── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Fuel size={16} className="text-brand-gold" />
          <h2 className="font-bold text-brand-charcoal">Combustível &amp; Manutenção</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Consumo (km/L)</label>
            <input
              type="number" min="1" step="0.5" className="input-field"
              placeholder="12"
              value={form.consumoKmL || ''}
              onChange={e => set('consumoKmL', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Preço comb. (R$/L)</label>
            <input
              type="number" min="0" step="0.01" className="input-field"
              placeholder="6.50"
              value={form.precoCombustivel || ''}
              onChange={e => set('precoCombustivel', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Manutenção (R$/km)</label>
            <input
              type="number" min="0" step="0.01" className="input-field"
              placeholder="0.10"
              value={form.custoManutencaoKm || ''}
              onChange={e => set('custoManutencaoKm', Number(e.target.value))}
            />
            <p className="text-xs text-gray-400 mt-1">Óleos, pneus, revisões…</p>
          </div>
        </div>
      </div>

      {/* ── Custo calculado ── */}
      {totalKm > 0 && (
        <div className="card bg-brand-black text-white space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-brand-gold" />
            <h2 className="font-bold">Custo estimado por km</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xs opacity-50 mb-1">Depreciação</p>
              <p className="font-bold text-brand-gold">{fmtMoney(deprecKm)}<span className="text-xs font-normal opacity-50">/km</span></p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xs opacity-50 mb-1">Combustível</p>
              <p className="font-bold text-brand-gold">{fmtMoney(fuelKm)}<span className="text-xs font-normal opacity-50">/km</span></p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xs opacity-50 mb-1">Manutenção</p>
              <p className="font-bold text-brand-gold">{fmtMoney(form.custoManutencaoKm)}<span className="text-xs font-normal opacity-50">/km</span></p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <span className="text-sm opacity-60">Custo total por km (ida)</span>
            <span className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#b38779' }}>
              {fmtMoney(totalKm)}
            </span>
          </div>
          {/* Exemplos de visita */}
          <div>
            <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">Exemplos de visita (ida + volta)</p>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 30].map(km => (
                <div key={km} className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-xs opacity-50">{km} km</p>
                  <p className="text-sm font-semibold text-brand-gold">{fmtMoney(visitaCusto(km))}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
            <Info size={13} className="text-brand-gold flex-shrink-0 mt-0.5" />
            <p className="text-xs opacity-50">
              A distância (km) de cada cliente é cadastrada no perfil da cliente.
              O custo aparece na aba <strong className="opacity-80">Provas</strong> de cada cliente.
            </p>
          </div>
        </div>
      )}

      {/* ── Itens padrão do orçamento ── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Package size={16} className="text-brand-gold" />
          <h2 className="font-bold text-brand-charcoal">Itens padrão do Orçamento</h2>
        </div>
        <p className="text-xs text-gray-400">
          Estes itens são <strong>pré-adicionados automaticamente</strong> em todo novo orçamento criado.
          Inclua mão de obra, custos fixos, materiais base ou qualquer serviço recorrente.
        </p>

        {/* Lista de itens existentes */}
        {(form.itensPadraoOrcamento || []).length > 0 && (
          <div className="space-y-2">
            {form.itensPadraoOrcamento.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-charcoal truncate">{item.descricao}</p>
                  <p className="text-xs text-gray-400">
                    {item.quantidade}x · {item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    <span className="ml-2 text-gray-300">→</span>
                    <span className="ml-2 font-semibold text-gray-600">
                      {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => removeItemPadrao(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Remover item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulário para novo item */}
        <div className="p-4 bg-brand-gold/10 rounded-xl border border-brand-silver/30 space-y-3">
          <p className="text-xs font-semibold text-brand-gold uppercase tracking-wide">Adicionar item padrão</p>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6">
              <label className="label text-xs">Descrição</label>
              <input
                className="input-field text-sm"
                placeholder="Ex: Mão de obra, Aluguel…"
                value={novoItem.descricao}
                onChange={e => setNovoItem(p => ({ ...p, descricao: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItemPadrao()}
              />
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Qtd</label>
              <input
                type="number" min="1" className="input-field text-sm"
                placeholder="1"
                value={novoItem.quantidade}
                onChange={e => setNovoItem(p => ({ ...p, quantidade: e.target.value }))}
              />
            </div>
            <div className="col-span-3">
              <label className="label text-xs">Valor unit. (R$)</label>
              <input
                type="number" step="0.01" min="0" className="input-field text-sm"
                placeholder="0,00"
                value={novoItem.valorUnitario}
                onChange={e => setNovoItem(p => ({ ...p, valorUnitario: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItemPadrao()}
              />
            </div>
            <div className="col-span-1">
              <button
                onClick={addItemPadrao}
                disabled={!novoItem.descricao.trim() || !novoItem.valorUnitario}
                className="w-full btn-primary p-2.5 justify-center disabled:opacity-40"
                title="Adicionar item"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {(form.itensPadraoOrcamento || []).length === 0 && (
          <p className="text-xs text-gray-300 text-center italic py-2">
            Nenhum item padrão cadastrado. Adicione acima para pré-preencher orçamentos automaticamente.
          </p>
        )}
      </div>

      {/* ── Segurança ── */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-gold" />
          <h2 className="font-bold text-brand-charcoal">Segurança</h2>
        </div>

        {/* ── Estado: MFA ativo e já configurado ── */}
        {form.mfaEnabled && form.totpSecret && totpPhase !== 'scanning' && totpPhase !== 'generating' && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                <p className="text-sm font-medium text-brand-charcoal">Verificação em 2 etapas ativa</p>
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-5">
                Cada login exige o código do <strong>Google Authenticator</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={disableTotp}
              className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors"
            >
              Desativar
            </button>
          </div>
        )}

        {/* ── Estado: MFA desativado — botão para ativar ── */}
        {!form.mfaEnabled && totpPhase === 'idle' && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-charcoal">Verificação em 2 etapas (MFA)</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Proteja o login com o <strong>Google Authenticator</strong>. Gratuito e sem dependência de e-mail.
              </p>
            </div>
            <button
              type="button"
              onClick={startTotpEnrollment}
              className="flex-shrink-0 btn-primary text-xs px-4 py-1.5"
            >
              Ativar
            </button>
          </div>
        )}

        {/* ── Estado: gerando QR ── */}
        {totpPhase === 'generating' && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <Loader2 size={15} className="animate-spin" />
            Gerando código QR…
          </div>
        )}

        {/* ── Estado: exibir QR + campo de verificação ── */}
        {totpPhase === 'scanning' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-brand-gold" />
              <p className="text-sm font-semibold text-brand-charcoal">Configure o Google Authenticator</p>
            </div>

            <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
              <li>Abra o <strong>Google Authenticator</strong> no seu celular.</li>
              <li>Toque em <strong>"+"</strong> e escolha <strong>"Escanear código QR"</strong>.</li>
              <li>Aponte a câmera para o QR abaixo.</li>
              <li>Digite o código de 6 dígitos gerado para confirmar.</li>
            </ol>

            {totpQrUrl && (
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-2xl shadow border border-gray-100 inline-block">
                  <img src={totpQrUrl} alt="QR Code TOTP" className="w-48 h-48" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="label">Código de verificação (6 dígitos)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={e => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpError(''); }}
                  onKeyDown={e => e.key === 'Enter' && confirmTotpCode()}
                  className={`input-field text-center tracking-[0.4em] text-lg font-bold ${totpError ? 'border-red-400' : ''}`}
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  onClick={confirmTotpCode}
                  disabled={totpVerifying || totpCode.length !== 6}
                  className="btn-primary px-4 flex-shrink-0 disabled:opacity-50"
                >
                  {totpVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verificar'}
                </button>
              </div>
              {totpError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle size={12} /> {totpError}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setTotpPhase('idle'); setTotpCode(''); setTotpError(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Cancelar
            </button>
          </div>
        )}

        {/* ── Estado: verificação concluída ── */}
        {totpPhase === 'verified' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Google Authenticator configurado!</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Clique em <strong>Salvar configurações</strong> abaixo para ativar o MFA permanentemente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`btn-primary px-8 transition-all ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
        >
          {saved ? <><ChevronRight size={15}/> Salvo!</> : <><Save size={15}/> Salvar configurações</>}
        </button>
      </div>
    </div>
  );
}
