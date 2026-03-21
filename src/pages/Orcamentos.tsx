import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Receipt, Printer, Edit2, Car, TrendingUp } from 'lucide-react';
import { fmtMoney } from '../utils/format';
import { useApp } from '../context/AppContext';
import { Orcamento, CustosOrcamento, ItemOrcamento } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { format, parseISO } from 'date-fns';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_VESTIDO = [
  { value: 'noiva',     label: 'Noiva',               atendimento: 150 },
  { value: 'civil',     label: 'Civil',                atendimento: 100 },
  { value: 'madrinha',  label: 'Madrinha',             atendimento: 80  },
  { value: 'mae_noiva', label: 'Mãe de noiva/noivo',   atendimento: 80  },
  { value: 'social',    label: 'Social',               atendimento: 70  },
  { value: 'formatura', label: 'Formatura',            atendimento: 70  },
  { value: 'criativo',  label: 'Criativo',             atendimento: 90  },
];

const DIFICULDADES = [
  { value: 'facil',        label: 'Fácil'       },
  { value: 'medio',        label: 'Médio'       },
  { value: 'dificil',      label: 'Difícil'     },
  { value: 'especialista', label: 'Especialista' },
];

const STATUS_ORC = [
  { value: 'pendente', label: 'Pendente', color: 'yellow' as const },
  { value: 'aprovado', label: 'Aprovado', color: 'green'  as const },
  { value: 'recusado', label: 'Recusado', color: 'red'    as const },
  { value: 'expirado', label: 'Expirado', color: 'gray'   as const },
];

const EMPTY_FORM = {
  clienteId:           '',
  titulo:              '',
  tipoVestido:         '',
  data:                new Date().toISOString().split('T')[0],
  validade:            '',
  status:              'pendente' as Orcamento['status'],
  observacoes:         '',
  // custos
  tecidos:             '0',
  aviamentos:          '0',
  bordado:             '0',
  costura:             '0',
  dificuldade:         'medio',
  atendimentoPorProva: '80',
  quantidadeProvas:    '1',
  assinaturaContrato:  '50',
  entrega:             '30',
  gasolina:            '0',
  margemLucro:         '30',
  desconto:            '0',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildItens(custos: CustosOrcamento, margem: number): ItemOrcamento[] {
  const {
    tecidos, aviamentos, bordado, costura,
    atendimentoPorProva, quantidadeProvas,
    assinaturaContrato, entrega, gasolina,
  } = custos;
  const atTotal  = atendimentoPorProva * quantidadeProvas + assinaturaContrato + entrega;
  const custoT   = tecidos + aviamentos + bordado + costura + atTotal + gasolina;
  const lucro    = Math.round(custoT * (margem / 100) * 100) / 100;

  const mk = (desc: string, val: number, qtd = 1): ItemOrcamento =>
    ({ id: genId(), descricao: desc, quantidade: qtd, valorUnitario: val });

  const items: ItemOrcamento[] = [];
  if (tecidos > 0)            items.push(mk('Tecidos', tecidos));
  if (aviamentos > 0)         items.push(mk('Aviamentos', aviamentos));
  if (bordado > 0)            items.push(mk('Bordado', bordado));
  if (costura > 0)            items.push(mk('Costura / Mão de obra', costura));
  if (atendimentoPorProva > 0)
    items.push(mk(`Atendimento — ${quantidadeProvas} prova(s)`, atendimentoPorProva, quantidadeProvas));
  if (assinaturaContrato > 0) items.push(mk('Assinatura do contrato', assinaturaContrato));
  if (entrega > 0)            items.push(mk('Entrega', entrega));
  if (gasolina > 0)           items.push(mk('Deslocamento (gasolina)', gasolina));
  if (lucro > 0)              items.push(mk(`Lucro (${margem}%)`, lucro));

  return items;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function Orcamentos() {
  const { clientes, orcamentos, saveOrcamento, deleteOrcamento, nextNumeroOrcamento,
          custoPorKm, config } = useApp();

  const [search,        setSearch]        = useState('');
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingOrc,    setEditingOrc]    = useState<Orcamento | null>(null);
  const [form,          setForm]          = useState({ ...EMPTY_FORM });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getCliente = (id: string) => clientes.find(c => c.id === id);

  /* Auto-expirar */
  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    orcamentos.forEach(o => {
      if (o.status === 'pendente' && o.validade && o.validade < hoje)
        saveOrcamento({ ...o, status: 'expirado' });
    });
  }, [orcamentos]);

  /* Calc gasolina */
  const calcGasolina = (clienteId: string, qtdProvas: number) => {
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli?.distanciaKm || custoPorKm <= 0) return 0;
    return Math.round(custoPorKm * cli.distanciaKm * 2 * qtdProvas * 100) / 100;
  };

  /* Derived */
  const n = (k: keyof typeof EMPTY_FORM) => Number(form[k]) || 0;
  const atendimentoBase  = n('atendimentoPorProva') * n('quantidadeProvas');
  const atendimentoTotal = atendimentoBase + n('assinaturaContrato') + n('entrega');
  const custoTotal       = n('tecidos') + n('aviamentos') + n('bordado') + n('costura') + atendimentoTotal + n('gasolina');
  const lucroValor       = Math.round(custoTotal * (n('margemLucro') / 100) * 100) / 100;
  const precoSugerido    = custoTotal + lucroValor;
  const totalFinal       = precoSugerido - n('desconto');

  /* Lista filtrada */
  const filtered = orcamentos.filter(o => {
    const cli = getCliente(o.clienteId);
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.numero.toLowerCase().includes(q) ||
      (cli?.nome || '').toLowerCase().includes(q) ||
      (o.titulo || '').toLowerCase().includes(q)
    );
  });

  /* Abrir novo */
  const openNew = (prefillClienteId?: string) => {
    setEditingOrc(null);
    const cid = prefillClienteId || '';
    const gas = cid ? calcGasolina(cid, 1).toString() : '0';
    setForm({ ...EMPTY_FORM, clienteId: cid, gasolina: gas });
    setModalOpen(true);
  };

  /* Abrir edição */
  const openEdit = (o: Orcamento) => {
    setEditingOrc(o);
    if (o.custos) {
      setForm({
        clienteId:           o.clienteId,
        titulo:              o.titulo              || '',
        tipoVestido:         o.tipoVestido         || '',
        data:                o.data,
        validade:            o.validade,
        status:              o.status,
        observacoes:         o.observacoes         || '',
        tecidos:             o.custos.tecidos.toString(),
        aviamentos:          o.custos.aviamentos.toString(),
        bordado:             o.custos.bordado.toString(),
        costura:             o.custos.costura.toString(),
        dificuldade:         o.custos.dificuldade,
        atendimentoPorProva: o.custos.atendimentoPorProva.toString(),
        quantidadeProvas:    o.custos.quantidadeProvas.toString(),
        assinaturaContrato:  o.custos.assinaturaContrato.toString(),
        entrega:             o.custos.entrega.toString(),
        gasolina:            o.custos.gasolina.toString(),
        margemLucro:         (o.margemLucro ?? 30).toString(),
        desconto:            o.desconto.toString(),
      });
    } else {
      setForm({ ...EMPTY_FORM, clienteId: o.clienteId, data: o.data,
                validade: o.validade, status: o.status,
                observacoes: o.observacoes || '', desconto: o.desconto.toString() });
    }
    setModalOpen(true);
  };

  /* Handlers de campo */
  const setF = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleClienteChange = (id: string) => {
    const gas = calcGasolina(id, Number(form.quantidadeProvas) || 1);
    setForm(prev => ({ ...prev, clienteId: id, gasolina: gas.toString() }));
  };

  const handleTipoChange = (tipo: string) => {
    const t = TIPOS_VESTIDO.find(x => x.value === tipo);
    setForm(prev => ({
      ...prev,
      tipoVestido: tipo,
      atendimentoPorProva: t ? t.atendimento.toString() : prev.atendimentoPorProva,
    }));
  };

  const handleQtdProvasChange = (v: string) => {
    const gas = calcGasolina(form.clienteId, Number(v) || 1);
    setForm(prev => ({ ...prev, quantidadeProvas: v, gasolina: gas.toString() }));
  };

  /* Salvar */
  const handleSave = () => {
    if (!form.clienteId) return;
    const custos: CustosOrcamento = {
      tecidos:             n('tecidos'),
      aviamentos:          n('aviamentos'),
      bordado:             n('bordado'),
      costura:             n('costura'),
      dificuldade:         form.dificuldade as CustosOrcamento['dificuldade'],
      atendimentoPorProva: n('atendimentoPorProva'),
      quantidadeProvas:    n('quantidadeProvas'),
      assinaturaContrato:  n('assinaturaContrato'),
      entrega:             n('entrega'),
      gasolina:            n('gasolina'),
    };
    const itens = buildItens(custos, n('margemLucro'));
    const orc: Orcamento = {
      id:          editingOrc?.id        || genId(),
      clienteId:   form.clienteId,
      numero:      editingOrc?.numero    || nextNumeroOrcamento(),
      titulo:      form.titulo           || undefined,
      tipoVestido: form.tipoVestido      || undefined,
      data:        form.data,
      validade:    form.validade,
      itens,
      desconto:    n('desconto'),
      status:      form.status,
      observacoes: form.observacoes      || undefined,
      custos,
      margemLucro: n('margemLucro'),
      createdAt:   editingOrc?.createdAt || new Date().toISOString(),
    };
    saveOrcamento(orc);
    setModalOpen(false);
  };

  /* Impressão */
  const handlePrint = (o: Orcamento) => {
    const cliente  = getCliente(o.clienteId);
    const tipoLbl  = TIPOS_VESTIDO.find(t => t.value === o.tipoVestido)?.label || '';
    const difLbl   = DIFICULDADES.find(d => d.value === o.custos?.dificuldade)?.label || '';
    const sub      = o.itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0);
    const tot      = sub - o.desconto;

    const win = window.open('', '_blank');
    if (!win) return;

    let bodyContent = '';

    if (o.custos) {
      const c   = o.custos;
      const m   = o.margemLucro ?? 0;
      const atT = c.atendimentoPorProva * c.quantidadeProvas + c.assinaturaContrato + c.entrega;
      const mat = c.tecidos + c.aviamentos + c.bordado;
      const serv = c.costura;
      const cusT = mat + serv + atT + c.gasolina;
      const lucro = Math.round(cusT * (m / 100) * 100) / 100;
      const preco = cusT + lucro;
      const final = preco - o.desconto;

      const rows = [
        mat > 0   && `<tr><td>Materiais (tecidos, aviamentos, bordado)</td><td style="text-align:right;font-weight:500">${fmtMoney(mat)}</td></tr>`,
        serv > 0  && `<tr><td>Costura / Mão de obra${difLbl ? ` — ${difLbl}` : ''}</td><td style="text-align:right;font-weight:500">${fmtMoney(serv)}</td></tr>`,
        atT > 0   && `<tr><td>Atendimento (${c.quantidadeProvas} prova(s) + contrato + entrega)</td><td style="text-align:right;font-weight:500">${fmtMoney(atT)}</td></tr>`,
        c.gasolina > 0 && `<tr><td>Deslocamento</td><td style="text-align:right;font-weight:500">${fmtMoney(c.gasolina)}</td></tr>`,
      ].filter(Boolean).join('');

      bodyContent = `
        ${o.titulo || tipoLbl ? `
        <div style="margin-bottom:20px">
          ${o.titulo ? `<p style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin:0 0 4px">${o.titulo}</p>` : ''}
          ${tipoLbl  ? `<p style="font-size:12px;color:#8A8A8A;text-transform:uppercase;letter-spacing:.1em;margin:0">Vestido ${tipoLbl}</p>` : ''}
        </div>` : ''}
        <div class="client-box">
          <strong>${cliente?.nome || ''}</strong>
          <span>${[cliente?.telefone, cliente?.email].filter(Boolean).join(' · ')}</span>
        </div>
        <table>
          <thead><tr><th>Descrição</th><th style="text-align:right;width:140px">Valor</th></tr></thead>
          <tbody>
            ${rows}
            <tr class="sub-row"><td style="text-align:right">Custo total</td><td style="text-align:right">${fmtMoney(cusT)}</td></tr>
            ${m > 0 ? `<tr style="color:#16A34A;background:#fff;border-bottom:none"><td style="padding:4px 12px;font-size:12px;text-align:right">Margem de serviço (${m}%)</td><td style="padding:4px 12px;font-size:12px;text-align:right">+ ${fmtMoney(lucro)}</td></tr>` : ''}
            ${o.desconto > 0 ? `<tr class="disc-row"><td style="text-align:right">Desconto</td><td style="text-align:right;color:#DC2626">− ${fmtMoney(o.desconto)}</td></tr>` : ''}
            <tr class="total-row"><td style="color:#C9A96E">VALOR TOTAL</td><td style="text-align:right;color:#C9A96E">${fmtMoney(final)}</td></tr>
          </tbody>
        </table>
      `;
    } else {
      bodyContent = `
        <div class="client-box">
          <strong>${cliente?.nome || ''}</strong>
          <span>${[cliente?.telefone, cliente?.email].filter(Boolean).join(' · ')}</span>
        </div>
        <table>
          <thead><tr>
            <th>Descrição</th>
            <th style="text-align:center;width:60px">Qtd</th>
            <th style="text-align:right;width:120px">Unit.</th>
            <th style="text-align:right;width:120px">Total</th>
          </tr></thead>
          <tbody>
            ${o.itens.map(i => `
              <tr>
                <td>${i.descricao}</td>
                <td style="text-align:center">${i.quantidade}</td>
                <td style="text-align:right">${fmtMoney(i.valorUnitario)}</td>
                <td style="text-align:right;font-weight:500">${fmtMoney(i.quantidade * i.valorUnitario)}</td>
              </tr>`).join('')}
            <tr class="sub-row"><td colspan="3" style="text-align:right">Subtotal</td><td style="text-align:right">${fmtMoney(sub)}</td></tr>
            ${o.desconto > 0 ? `<tr class="disc-row"><td colspan="3" style="text-align:right">Desconto</td><td style="text-align:right;color:#DC2626">− ${fmtMoney(o.desconto)}</td></tr>` : ''}
            <tr class="total-row"><td colspan="3" style="color:#C9A96E">VALOR TOTAL</td><td style="text-align:right;color:#C9A96E">${fmtMoney(tot)}</td></tr>
          </tbody>
        </table>
      `;
    }

    win.document.write(`
      <html><head><title>Orçamento ${o.numero}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Inter',sans-serif;color:#1C1C1C;background:#fff;padding:48px;max-width:800px;margin:0 auto;font-size:13px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #0A0A0A;margin-bottom:32px}
        .brand{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;letter-spacing:.15em}
        .brand span{color:#C9A96E}
        .brand-sub{font-size:9px;letter-spacing:.3em;color:#8A8A8A;margin-top:2px}
        .doc-title{text-align:right}
        .doc-title h2{font-size:18px;font-weight:600;letter-spacing:.05em}
        .doc-title p{font-size:12px;color:#8A8A8A;margin-top:4px}
        .client-box{background:#F5F3F0;border-radius:8px;padding:16px;margin-bottom:28px}
        .client-box strong{font-size:14px;display:block;margin-bottom:4px}
        .client-box span{font-size:12px;color:#4A4A4A}
        table{width:100%;border-collapse:collapse;margin-bottom:0}
        thead tr{background:#0A0A0A}
        thead th{color:#fff;padding:10px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.05em}
        tbody tr:nth-child(even){background:#F9F9F9}
        tbody td{padding:10px 12px;font-size:13px;border-bottom:1px solid #F0F0F0}
        .sub-row td{text-align:right;color:#4A4A4A;background:#fff;border-bottom:none;font-size:12px;padding:8px 12px}
        .disc-row td{color:#DC2626;font-size:12px;text-align:right;background:#fff;border-bottom:none;padding:4px 12px}
        .total-row{background:#0A0A0A}
        .total-row td{color:#C9A96E;font-weight:700;font-size:16px;border:none;padding:14px 12px}
        .obs-box{background:#F5F3F0;border-radius:8px;padding:16px;margin-top:24px;font-size:12px;color:#4A4A4A;line-height:1.6}
        .validity{font-size:12px;color:#4A4A4A;margin-top:20px;padding:12px;border:1px solid #E5E5E5;border-radius:8px;text-align:center}
        .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E5E5E5;font-size:10px;color:#8A8A8A;display:flex;justify-content:space-between;align-items:center}
      </style></head><body>
      <div class="header">
        <div>
          <div class="brand">MISS<span>BO</span></div>
          <div class="brand-sub">HAUTE COUTURE</div>
        </div>
        <div class="doc-title">
          <h2>ORÇAMENTO</h2>
          <p>Nº ${o.numero}</p>
          <p style="margin-top:4px">Emissão: ${format(parseISO(o.data), 'dd/MM/yyyy')}</p>
          ${o.validade ? `<p>Validade: ${format(parseISO(o.validade), 'dd/MM/yyyy')}</p>` : ''}
        </div>
      </div>
      ${bodyContent}
      ${o.observacoes ? `<div class="obs-box"><strong style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#8A8A8A">Observações</strong><p style="margin-top:6px">${o.observacoes}</p></div>` : ''}
      <div class="validity">
        Este orçamento tem validade até <strong>${o.validade ? format(parseISO(o.validade), 'dd/MM/yyyy') : 'a combinar'}</strong>.
        Para aceite, entre em contato com nossa equipe.
      </div>
      <div class="footer">
        <span>MissBO Haute Couture</span>
        <span>Orçamento gerado eletronicamente</span>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Orçamentos</h1>
          <p className="text-gray-500 text-sm mt-1">{orcamentos.length} orçamentos gerados</p>
        </div>
        <button className="btn-primary" onClick={() => openNew()}>
          <Plus size={16} /> Novo Orçamento
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-9" placeholder="Buscar por número, cliente ou título..."
               value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-3 text-center py-16 text-gray-400">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
          </div>
        ) : filtered.map(o => {
          const cliente   = getCliente(o.clienteId);
          const sub       = o.itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0);
          const total     = sub - o.desconto;
          const statusOpt = STATUS_ORC.find(s => s.value === o.status);
          const tipoLbl   = TIPOS_VESTIDO.find(t => t.value === o.tipoVestido)?.label;
          return (
            <div key={o.id} className="card hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-gray-400">{o.numero}</p>
                  <h3 className="font-bold text-gray-900 text-base mt-0.5 truncate">{cliente?.nome || '—'}</h3>
                  {o.titulo && <p className="text-sm text-rose-700 font-medium truncate">{o.titulo}</p>}
                  {tipoLbl  && <p className="text-xs text-gray-400 mt-0.5">{tipoLbl}</p>}
                </div>
                <Badge variant={statusOpt?.color || 'gray'}>{statusOpt?.label}</Badge>
              </div>

              <div className="space-y-1 text-sm text-gray-500 mb-4">
                <p>Emissão: <span className="text-gray-700">{format(parseISO(o.data), 'dd/MM/yyyy')}</span></p>
                {o.validade && <p>Válido até: <span className="text-gray-700">{format(parseISO(o.validade), 'dd/MM/yyyy')}</span></p>}
                {o.custos && (
                  <p className="flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp size={11} /> Margem: {o.margemLucro}%
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">Total</span>
                <span className="text-xl font-bold text-emerald-700">{fmtMoney(total)}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handlePrint(o)} className="flex-1 btn-secondary text-xs py-2 justify-center">
                  <Printer size={13} /> Imprimir
                </button>
                <button onClick={() => openEdit(o)} className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setDeleteConfirm(o.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Formulário */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
             title={editingOrc ? 'Editar Orçamento' : 'Novo Orçamento'} size="2xl">
        <div className="space-y-6">

          {/* ── Informações gerais ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Informações gerais</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Cliente *</label>
                <select className="input-field" value={form.clienteId}
                        onChange={e => handleClienteChange(e.target.value)}>
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Título da peça</label>
                <input className="input-field" placeholder="Ex: Vestido Missa, Vestido Azul..." value={form.titulo}
                       onChange={setF('titulo')} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Tipo de vestido</label>
                <select className="input-field" value={form.tipoVestido}
                        onChange={e => handleTipoChange(e.target.value)}>
                  <option value="">Selecione...</option>
                  {TIPOS_VESTIDO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Status</label>
                <select className="input-field" value={form.status} onChange={setF('status')}>
                  {STATUS_ORC.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data de Emissão</label>
                <input type="date" className="input-field" value={form.data} onChange={setF('data')} />
              </div>
              <div>
                <label className="label">Data de Validade</label>
                <input type="date" className="input-field" value={form.validade} onChange={setF('validade')} />
              </div>
            </div>
          </section>

          {/* ── Custos de confecção ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Custos de confecção</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tecidos (R$)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                       value={form.tecidos} onChange={setF('tecidos')} />
              </div>
              <div>
                <label className="label">Aviamentos (R$)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                       value={form.aviamentos} onChange={setF('aviamentos')} />
              </div>
              <div>
                <label className="label">Bordado (R$)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                       value={form.bordado} onChange={setF('bordado')} />
              </div>
              <div>
                <label className="label">Costura / Mão de obra (R$)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                       value={form.costura} onChange={setF('costura')} />
              </div>
              <div className="col-span-2">
                <label className="label">Dificuldade</label>
                <div className="grid grid-cols-4 gap-2">
                  {DIFICULDADES.map(d => (
                    <button key={d.value} type="button"
                      onClick={() => setForm(prev => ({ ...prev, dificuldade: d.value }))}
                      className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.dificuldade === d.value
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                      }`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Atendimento ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Atendimento</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Valor por prova (R$)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                       value={form.atendimentoPorProva} onChange={setF('atendimentoPorProva')} />
                {form.tipoVestido && (
                  <p className="text-xs text-blue-600 mt-1">
                    Sugerido para {TIPOS_VESTIDO.find(t => t.value === form.tipoVestido)?.label}: R$ {TIPOS_VESTIDO.find(t => t.value === form.tipoVestido)?.atendimento}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Quantidade de provas</label>
                <input type="number" min="0" className="input-field"
                       value={form.quantidadeProvas}
                       onChange={e => handleQtdProvasChange(e.target.value)} />
              </div>
              <div>
                <label className="label">Assinatura do contrato (R$)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                       value={form.assinaturaContrato} onChange={setF('assinaturaContrato')} />
              </div>
              <div>
                <label className="label">Entrega (R$)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                       value={form.entrega} onChange={setF('entrega')} />
              </div>
            </div>
            {/* Subtotal atendimento */}
            <div className="mt-3 flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-blue-700">
                Atendimento: {n('atendimentoPorProva') > 0 && `${n('atendimentoPorProva').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} × ${n('quantidadeProvas')} prova(s)`}
                {n('assinaturaContrato') > 0 && ` + contrato`}
                {n('entrega') > 0 && ` + entrega`}
              </span>
              <span className="font-bold text-blue-800">{fmtMoney(atendimentoTotal)}</span>
            </div>
          </section>

          {/* ── Deslocamento ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Deslocamento (gasolina)</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="label">Total de deslocamento (R$)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                       value={form.gasolina} onChange={setF('gasolina')} />
              </div>
              {form.clienteId && (() => {
                const cli = clientes.find(c => c.id === form.clienteId);
                if (!cli?.distanciaKm || custoPorKm <= 0) return null;
                return (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2 whitespace-nowrap self-end mb-[1px]">
                    <Car size={12} /> {cli.distanciaKm} km × {n('quantidadeProvas')} prova(s)
                  </div>
                );
              })()}
            </div>
          </section>

          {/* ── Cálculo de lucro ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Cálculo de lucro</h3>
            <div className="bg-rose-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Custo total</span>
                <span className="font-semibold text-gray-800">{fmtMoney(custoTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Margem de lucro (%)</label>
                <input type="number" step="1" min="0" max="500"
                       className="input-field w-28 text-sm text-right"
                       value={form.margemLucro} onChange={setF('margemLucro')} />
              </div>
              <div className="flex items-center justify-between text-sm text-emerald-700">
                <span>Lucro ({form.margemLucro}%)</span>
                <span className="font-semibold">+ {fmtMoney(lucroValor)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Preço sugerido</span>
                <span className="font-semibold">{fmtMoney(precoSugerido)}</span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Desconto (R$)</label>
                <input type="number" step="0.01" min="0"
                       className="input-field w-28 text-sm text-right"
                       value={form.desconto} onChange={setF('desconto')} />
              </div>
              <div className="flex justify-between font-bold text-lg text-rose-900 border-t border-rose-200 pt-3">
                <span>Total final</span>
                <span>{fmtMoney(totalFinal)}</span>
              </div>
            </div>
          </section>

          {/* ── Observações ── */}
          <div>
            <label className="label">Observações</label>
            <textarea className="input-field" rows={2}
                      placeholder="Condições de pagamento, prazo de entrega..."
                      value={form.observacoes} onChange={setF('observacoes')} />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center"
                    disabled={!form.clienteId}>
              {editingOrc ? 'Salvar Alterações' : 'Criar Orçamento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
             title="Confirmar exclusão" size="sm">
        <p className="text-gray-600 mb-6">Deseja excluir este orçamento?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={() => { deleteOrcamento(deleteConfirm!); setDeleteConfirm(null); }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all justify-center inline-flex">
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
