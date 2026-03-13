import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Receipt, Printer, Edit2, X, Car } from 'lucide-react';
import { fmtMoney } from '../utils/format';
import { useApp } from '../context/AppContext';
import { Orcamento, ItemOrcamento } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { format, parseISO } from 'date-fns';

// ID fixo para o item de deslocamento gerado automaticamente
const DESL_ID = '__deslocamento__';

const statusOrc = [
  { value: 'pendente', label: 'Pendente', color: 'yellow' as const },
  { value: 'aprovado', label: 'Aprovado', color: 'green' as const },
  { value: 'recusado', label: 'Recusado', color: 'red' as const },
  { value: 'expirado', label: 'Expirado', color: 'gray' as const },
];

const emptyForm = {
  clienteId: '',
  data: new Date().toISOString().split('T')[0],
  validade: '',
  desconto: '0',
  status: 'pendente' as Orcamento['status'],
  observacoes: '',
};

const emptyItem: Omit<ItemOrcamento, 'id'> = {
  descricao: '',
  quantidade: 1,
  valorUnitario: 0,
};

export function Orcamentos() {
  const { clientes, orcamentos, contratos, saveOrcamento, deleteOrcamento, nextNumeroOrcamento,
          custoPorKm, config } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrc, setEditingOrc] = useState<Orcamento | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getCliente = (id: string) => clientes.find(c => c.id === id);

  /* B2 — Auto-expirar orçamentos cuja validade já passou */
  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    orcamentos.forEach(o => {
      if (o.status === 'pendente' && o.validade && o.validade < hoje) {
        saveOrcamento({ ...o, status: 'expirado' });
      }
    });
  }, [orcamentos]);

  const filtered = orcamentos.filter(o => {
    const cliente = getCliente(o.clienteId);
    return !search ||
      o.numero.toLowerCase().includes(search.toLowerCase()) ||
      cliente?.nome.toLowerCase().includes(search.toLowerCase());
  });

  /* Gera item de deslocamento baseado em cliente + config.
     A quantidade reflete o nº de provas do contrato ativo, para que o
     orçamento já contemple o custo total de deslocamento por visita. */
  const buildDeslocamentoItem = (clienteId: string): ItemOrcamento | null => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente?.distanciaKm || custoPorKm <= 0) return null;

    // Busca o contrato mais recente (não cancelado) para saber quantas provas
    const contratoAtivo = contratos
      .filter(c => c.clienteId === clienteId && c.status !== 'cancelado')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const qtdVisitas = contratoAtivo?.quantidadeProvas || 1;

    const custoUnitario = parseFloat((custoPorKm * cliente.distanciaKm * 2).toFixed(2));
    const sufixoVeiculo = config.nomeVeiculo ? `, ${config.nomeVeiculo}` : '';
    return {
      id: DESL_ID,
      descricao: `Deslocamento — ${cliente.distanciaKm} km (ida e volta${sufixoVeiculo})`,
      quantidade: qtdVisitas,
      valorUnitario: custoUnitario,
    };
  };

  const openNew = (prefillClienteId?: string) => {
    setEditingOrc(null);
    const cid = prefillClienteId || '';
    setForm({ ...emptyForm, clienteId: cid });

    // Itens padrão configurados (mão de obra, custos fixos, etc.)
    const defaults: ItemOrcamento[] = (config.itensPadraoOrcamento || []).map(i => ({ ...i }));

    // Item de deslocamento (se cliente selecionado e km configurado)
    const desl = cid ? buildDeslocamentoItem(cid) : null;

    // Montar lista: deslocamento → padrões → linha vazia
    setItens([
      ...(desl ? [desl] : []),
      ...defaults,
      { id: genId(), ...emptyItem },
    ]);
    setModalOpen(true);
  };

  const openEdit = (o: Orcamento) => {
    setEditingOrc(o);
    setForm({
      clienteId: o.clienteId,
      data: o.data,
      validade: o.validade,
      desconto: o.desconto.toString(),
      status: o.status,
      observacoes: o.observacoes || '',
    });
    setItens(o.itens);
    setModalOpen(true);
  };

  /* Troca de cliente: atualiza automaticamente o item de deslocamento */
  const handleClienteChange = (newId: string) => {
    setForm(prev => ({ ...prev, clienteId: newId }));
    if (!editingOrc) {
      const desl = newId ? buildDeslocamentoItem(newId) : null;
      setItens(prev => {
        const withoutDesl = prev.filter(i => i.id !== DESL_ID);
        return desl ? [desl, ...withoutDesl] : withoutDesl;
      });
    }
  };

  const addItem = () => setItens(prev => [...prev, { id: genId(), ...emptyItem }]);

  const removeItem = (id: string) => setItens(prev => prev.filter(i => i.id !== id));

  const updateItem = (id: string, field: keyof Omit<ItemOrcamento, 'id'>, value: string | number) => {
    setItens(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const subtotal = itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0);
  const desconto = Number(form.desconto) || 0;
  const total = subtotal - desconto;

  const handleSave = () => {
    if (!form.clienteId || itens.length === 0) return;
    const orc: Orcamento = {
      id: editingOrc?.id || genId(),
      clienteId: form.clienteId,
      numero: editingOrc?.numero || nextNumeroOrcamento(),
      data: form.data,
      validade: form.validade,
      itens,
      desconto: Number(form.desconto) || 0,
      status: form.status,
      observacoes: form.observacoes || undefined,
      createdAt: editingOrc?.createdAt || new Date().toISOString(),
    };
    saveOrcamento(orc);
    setModalOpen(false);
  };

  const formatMoney = fmtMoney;

  const handlePrint = (o: Orcamento) => {
    const cliente = getCliente(o.clienteId);
    const sub = o.itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0);
    const tot = sub - o.desconto;
    const win = window.open('', '_blank');
    if (!win) return;
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
        .sub-row td:first-child{text-align:left;color:#4A4A4A}
        .disc-row td{color:#DC2626;font-size:12px;text-align:right;background:#fff;border-bottom:none;padding:4px 12px}
        .total-row{background:#0A0A0A}
        .total-row td{color:#C9A96E;font-weight:700;font-size:16px;border:none;padding:14px 12px}
        .obs-box{background:#F5F3F0;border-radius:8px;padding:16px;margin-top:24px;font-size:12px;color:#4A4A4A;line-height:1.6}
        .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E5E5E5;font-size:10px;color:#8A8A8A;display:flex;justify-content:space-between;align-items:center}
        .validity{font-size:12px;color:#4A4A4A;margin-top:20px;padding:12px;border:1px solid #E5E5E5;border-radius:8px;text-align:center}
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

      <div class="client-box">
        <strong>${cliente?.nome || ''}</strong>
        <span>${[cliente?.telefone, cliente?.email].filter(Boolean).join(' · ')}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th style="text-align:center;width:60px">Qtd</th>
            <th style="text-align:right;width:120px">Valor Unit.</th>
            <th style="text-align:right;width:120px">Total</th>
          </tr>
        </thead>
        <tbody>
          ${o.itens.map(i => `
            <tr>
              <td>${i.descricao}</td>
              <td style="text-align:center">${i.quantidade}</td>
              <td style="text-align:right">${formatMoney(i.valorUnitario)}</td>
              <td style="text-align:right;font-weight:500">${formatMoney(i.quantidade * i.valorUnitario)}</td>
            </tr>
          `).join('')}
          <tr class="sub-row">
            <td colspan="3" style="text-align:right">Subtotal</td>
            <td style="text-align:right">${formatMoney(sub)}</td>
          </tr>
          ${o.desconto > 0 ? `
          <tr class="disc-row">
            <td colspan="3" style="text-align:right;color:#DC2626">Desconto</td>
            <td style="text-align:right;color:#DC2626">− ${formatMoney(o.desconto)}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td colspan="3" style="color:#C9A96E">VALOR TOTAL</td>
            <td style="text-align:right;color:#C9A96E">${formatMoney(tot)}</td>
          </tr>
        </tbody>
      </table>

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

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

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
        <input className="input-field pl-9" placeholder="Buscar por número ou cliente..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-3 text-center py-16 text-gray-400">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
          </div>
        ) : filtered.map(o => {
          const cliente = getCliente(o.clienteId);
          const sub = o.itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0);
          const total = sub - o.desconto;
          const statusOpt = statusOrc.find(s => s.value === o.status);
          return (
            <div key={o.id} className="card hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-gray-400">{o.numero}</p>
                  <h3 className="font-bold text-gray-900 text-base mt-0.5">{cliente?.nome || '—'}</h3>
                </div>
                <Badge variant={statusOpt?.color || 'gray'}>{statusOpt?.label}</Badge>
              </div>

              <div className="space-y-1 text-sm text-gray-500 mb-4">
                <p>Emissão: <span className="text-gray-700">{format(parseISO(o.data), 'dd/MM/yyyy')}</span></p>
                {o.validade && <p>Válido até: <span className="text-gray-700">{format(parseISO(o.validade), 'dd/MM/yyyy')}</span></p>}
                <p>{o.itens.length} {o.itens.length === 1 ? 'item' : 'itens'}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">Total</span>
                <span className="text-xl font-bold text-emerald-700">{formatMoney(total)}</span>
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

      {/* Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingOrc ? 'Editar Orçamento' : 'Novo Orçamento'} size="2xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente *</label>
              <select className="input-field" value={form.clienteId}
                      onChange={e => handleClienteChange(e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {/* Info de deslocamento pré-preenchido */}
              {form.clienteId && (() => {
                const cli = clientes.find(c => c.id === form.clienteId);
                if (!cli?.distanciaKm || custoPorKm <= 0) return null;
                const custoViagem = custoPorKm * cli.distanciaKm * 2;
                return (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg px-2.5 py-1.5">
                    <Car size={11}/> {cli.distanciaKm} km · {custoViagem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por visita (pré-adicionado)
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={f('status')}>
                {statusOrc.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Data de Emissão</label>
              <input type="date" className="input-field" value={form.data} onChange={f('data')} />
            </div>
            <div>
              <label className="label">Data de Validade</label>
              <input type="date" className="input-field" value={form.validade} onChange={f('validade')} />
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Itens do Orçamento</label>
              <button onClick={addItem} className="btn-ghost text-xs py-1.5">
                <Plus size={13} /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {itens.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-xl">
                  <div className="col-span-5">
                    <input
                      className="input-field text-sm"
                      placeholder="Descrição do serviço/peça"
                      value={item.descricao}
                      onChange={e => updateItem(item.id, 'descricao', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min="1" className="input-field text-sm"
                      placeholder="Qtd"
                      value={item.quantidade}
                      onChange={e => updateItem(item.id, 'quantidade', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number" step="0.01" className="input-field text-sm"
                      placeholder="Valor unit."
                      value={item.valorUnitario || ''}
                      onChange={e => updateItem(item.id, 'valorUnitario', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 text-sm font-semibold text-gray-600 text-right">
                    {formatMoney(item.quantidade * item.valorUnitario)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {itens.length > 1 && (
                      <button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 bg-rose-50 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-600">Desconto (R$)</label>
                <input
                  type="number" step="0.01" className="input-field w-36 text-sm"
                  value={form.desconto}
                  onChange={f('desconto')}
                />
              </div>
              <div className="flex justify-between font-bold text-lg text-rose-900 border-t border-rose-200 pt-2">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea className="input-field" rows={2} placeholder="Condições de pagamento, prazo de entrega..." value={form.observacoes} onChange={f('observacoes')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center" disabled={!form.clienteId}>
              {editingOrc ? 'Salvar Alterações' : 'Criar Orçamento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
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
