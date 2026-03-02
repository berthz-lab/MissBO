import React, { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, Printer, Paperclip, X, Link2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Contrato } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { format, parseISO } from 'date-fns';

const statusContrato = [
  { value: 'rascunho',     label: 'Rascunho',     color: 'gray'   as const },
  { value: 'assinado',     label: 'Assinado',     color: 'blue'   as const },
  { value: 'em_andamento', label: 'Em Andamento', color: 'yellow' as const },
  { value: 'concluido',    label: 'Concluído',    color: 'green'  as const },
  { value: 'cancelado',    label: 'Cancelado',    color: 'red'    as const },
];

const emptyContrato = {
  clienteId: '',
  orcamentoId: '',
  dataAssinatura: new Date().toISOString().split('T')[0],
  dataEntrega: '',
  valorTotal: '',
  valorEntrada: '',
  quantidadeProvas: '',
  status: 'rascunho' as Contrato['status'],
  descricaoPecas: '',
  clausulasEspeciais: '',
};

export function Contratos() {
  const { clientes, contratos, orcamentos, saveContrato, deleteContrato, nextNumeroContrato } = useApp();
  const [search, setSearch]             = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [form, setForm]                 = useState({ ...emptyContrato });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* Anexo */
  const fileRef = useRef<HTMLInputElement>(null);
  const [anexoBase64, setAnexoBase64]   = useState<string | undefined>();
  const [anexoNome, setAnexoNome]       = useState<string | undefined>();
  const [anexoTipo, setAnexoTipo]       = useState<string | undefined>();

  const getCliente = (id: string) => clientes.find(c => c.id === id);

  const filtered = contratos.filter(c => {
    const cliente = getCliente(c.clienteId);
    return !search ||
      c.numero.toLowerCase().includes(search.toLowerCase()) ||
      cliente?.nome.toLowerCase().includes(search.toLowerCase());
  });

  const openNew = () => {
    setEditingContrato(null);
    setForm({ ...emptyContrato });
    setAnexoBase64(undefined); setAnexoNome(undefined); setAnexoTipo(undefined);
    setModalOpen(true);
  };

  const openEdit = (c: Contrato) => {
    setEditingContrato(c);
    setForm({
      clienteId: c.clienteId,
      orcamentoId: c.orcamentoId || '',
      dataAssinatura: c.dataAssinatura,
      dataEntrega: c.dataEntrega,
      valorTotal: c.valorTotal.toString(),
      valorEntrada: c.valorEntrada.toString(),
      quantidadeProvas: c.quantidadeProvas?.toString() || '',
      status: c.status,
      descricaoPecas: c.descricaoPecas,
      clausulasEspeciais: c.clausulasEspeciais || '',
    });
    setAnexoBase64(c.anexoBase64); setAnexoNome(c.anexoNome); setAnexoTipo(c.anexoTipo);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande. Limite: 10 MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setAnexoBase64(ev.target?.result as string);
      setAnexoNome(file.name);
      setAnexoTipo(file.type);
    };
    reader.readAsDataURL(file);
  };

  /* Troca de cliente: limpa o orçamento vinculado */
  const handleClienteChange = (newId: string) => {
    setForm(prev => ({ ...prev, clienteId: newId, orcamentoId: '' }));
  };

  /* Selecionar orçamento: pré-preenche valorTotal */
  const handleOrcamentoChange = (orcId: string) => {
    setForm(prev => {
      if (!orcId) return { ...prev, orcamentoId: '' };
      const orc = orcamentos.find(o => o.id === orcId);
      if (!orc) return { ...prev, orcamentoId: orcId };
      const sub = orc.itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0);
      const total = (sub - orc.desconto).toFixed(2);
      return { ...prev, orcamentoId: orcId, valorTotal: total };
    });
  };

  const handleSave = () => {
    if (!form.clienteId || !form.valorTotal) return;
    const contrato: Contrato = {
      id: editingContrato?.id || genId(),
      clienteId: form.clienteId,
      orcamentoId: form.orcamentoId || undefined,
      numero: editingContrato?.numero || nextNumeroContrato(),
      dataAssinatura: form.dataAssinatura,
      dataEntrega: form.dataEntrega,
      valorTotal: Number(form.valorTotal),
      valorEntrada: Number(form.valorEntrada),
      quantidadeProvas: form.quantidadeProvas ? Number(form.quantidadeProvas) : undefined,
      status: form.status,
      descricaoPecas: form.descricaoPecas,
      clausulasEspeciais: form.clausulasEspeciais || undefined,
      anexoBase64,
      anexoNome,
      anexoTipo,
      createdAt: editingContrato?.createdAt || new Date().toISOString(),
    };
    saveContrato(contrato);
    setModalOpen(false);
  };

  // Preview do valor das parcelas
  const valorParcelaPreview = (() => {
    const vt = Number(form.valorTotal) || 0;
    const ve = Number(form.valorEntrada) || 0;
    const qp = Number(form.quantidadeProvas) || 0;
    if (qp <= 0 || vt <= 0) return null;
    const saldo = vt - ve;
    const perc  = ve > 0 ? ((ve / vt) * 100).toFixed(0) : '0';
    return { saldo, parcela: saldo / qp, perc };
  })();

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handlePrint = (c: Contrato) => {
    const cliente = getCliente(c.clienteId);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Contrato ${c.numero}</title>
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
        .section{margin-bottom:24px}
        .section-title{font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#8A8A8A;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #E5E5E5}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .info-item p{font-size:10px;color:#8A8A8A;margin-bottom:2px;text-transform:uppercase;letter-spacing:.1em}
        .info-item strong{font-size:13px;color:#1C1C1C}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        thead tr{background:#0A0A0A}
        thead th{color:#fff;padding:10px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.05em}
        tbody tr:nth-child(even){background:#F9F9F9}
        tbody td{padding:10px 12px;font-size:13px;color:#1C1C1C;border-bottom:1px solid #F0F0F0}
        .total-row{background:#0A0A0A}
        .total-row td{color:#C9A96E;font-weight:700;font-size:15px;border:none}
        .obs-box{background:#F5F3F0;border-radius:8px;padding:16px;margin-top:8px;font-size:12px;color:#4A4A4A;line-height:1.6}
        .signatures{display:flex;justify-content:space-between;margin-top:64px;gap:40px}
        .sign-line{flex:1;text-align:center}
        .sign-line div{border-top:1px solid #0A0A0A;padding-top:8px;font-size:11px;color:#4A4A4A}
        .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E5E5E5;font-size:10px;color:#8A8A8A;text-align:center}
      </style></head><body>
      <div class="header">
        <div>
          <div class="brand">MISS<span>BO</span></div>
          <div class="brand-sub">HAUTE COUTURE</div>
        </div>
        <div class="doc-title">
          <h2>CONTRATO DE SERVIÇOS</h2>
          <p>Nº ${c.numero}</p>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Dados do Contrato</div>
        <div class="info-grid">
          <div class="info-item"><p>Data de Assinatura</p><strong>${format(parseISO(c.dataAssinatura), 'dd/MM/yyyy')}</strong></div>
          <div class="info-item"><p>Data de Entrega</p><strong>${c.dataEntrega ? format(parseISO(c.dataEntrega), 'dd/MM/yyyy') : '—'}</strong></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Contratante</div>
        <div class="info-grid">
          <div class="info-item"><p>Nome</p><strong>${cliente?.nome || ''}</strong></div>
          <div class="info-item"><p>Telefone</p><strong>${cliente?.telefone || ''}</strong></div>
          ${cliente?.email ? `<div class="info-item"><p>E-mail</p><strong>${cliente.email}</strong></div>` : ''}
          ${cliente?.cpf ? `<div class="info-item"><p>CPF</p><strong>${cliente.cpf}</strong></div>` : ''}
        </div>
      </div>
      <div class="section">
        <div class="section-title">Serviços Contratados</div>
        <div class="obs-box">${c.descricaoPecas || '—'}</div>
      </div>
      <div class="section">
        <div class="section-title">Valores</div>
        <table>
          <thead><tr><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
          <tbody>
            <tr><td>Valor Total do Contrato</td><td style="text-align:right">${formatMoney(c.valorTotal)}</td></tr>
            <tr><td>Entrada Paga</td><td style="text-align:right">${formatMoney(c.valorEntrada)}</td></tr>
            <tr><td>Saldo Restante</td><td style="text-align:right">${formatMoney(c.valorTotal - c.valorEntrada)}</td></tr>
            ${c.parcelasRestantes ? `<tr><td>Parcelas Restantes</td><td style="text-align:right">${c.parcelasRestantes}x de ${formatMoney((c.valorTotal - c.valorEntrada) / c.parcelasRestantes)}</td></tr>` : ''}
            <tr class="total-row"><td style="color:#C9A96E">TOTAL DO CONTRATO</td><td style="text-align:right;color:#C9A96E">${formatMoney(c.valorTotal)}</td></tr>
          </tbody>
        </table>
      </div>
      ${c.clausulasEspeciais ? `<div class="section"><div class="section-title">Cláusulas Especiais</div><div class="obs-box">${c.clausulasEspeciais}</div></div>` : ''}
      <div class="signatures">
        <div class="sign-line"><div>MISSBO — Haute Couture<br/>Contratada</div></div>
        <div class="sign-line"><div>${cliente?.nome || 'Contratante'}<br/>Contratante</div></div>
      </div>
      <div class="footer">MissBO Haute Couture · Contrato gerado eletronicamente</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const openAnexo = (c: Contrato) => {
    if (!c.anexoBase64) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><body style="margin:0"><iframe src="${c.anexoBase64}" style="width:100vw;height:100vh;border:none"></iframe></body></html>`);
    win.document.close();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Contratos</h1>
          <p className="text-gray-500 text-sm mt-1">{contratos.length} contratos</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-9"
          placeholder="Buscar por número ou cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Nº</th>
                <th className="table-th">Cliente</th>
                <th className="table-th">Assinatura</th>
                <th className="table-th">Entrega</th>
                <th className="table-th">Valor Total</th>
                <th className="table-th">Entrada</th>
                <th className="table-th">Status</th>
                <th className="table-th">Anexo</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Nenhum contrato cadastrado</p>
                  </td>
                </tr>
              ) : filtered.map(c => {
                const cliente = getCliente(c.clienteId);
                const statusOpt = statusContrato.find(s => s.value === c.status);
                return (
                  <tr key={c.id} className="table-row">
                    <td className="table-td font-mono font-semibold text-brand-black">{c.numero}</td>
                    <td className="table-td font-medium">{cliente?.nome || '—'}</td>
                    <td className="table-td text-gray-500">
                      {c.dataAssinatura ? format(parseISO(c.dataAssinatura), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="table-td text-gray-500">
                      {c.dataEntrega ? format(parseISO(c.dataEntrega), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="table-td font-semibold text-emerald-700">{formatMoney(c.valorTotal)}</td>
                    <td className="table-td text-gray-500">{formatMoney(c.valorEntrada)}</td>
                    <td className="table-td">
                      <Badge variant={statusOpt?.color || 'gray'}>{statusOpt?.label}</Badge>
                    </td>
                    <td className="table-td">
                      {c.anexoNome ? (
                        <button
                          onClick={() => openAnexo(c)}
                          className="flex items-center gap-1 text-xs text-brand-gold hover:underline font-medium max-w-[120px]"
                          title={c.anexoNome}
                        >
                          <Paperclip size={12} />
                          <span className="truncate">{c.anexoNome}</span>
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handlePrint(c)}
                          title="Imprimir contrato"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContrato ? 'Editar Contrato' : 'Novo Contrato'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente *</label>
              <select className="input-field" value={form.clienteId}
                      onChange={e => handleClienteChange(e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={f('status')}>
                {statusContrato.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Vincular a Orçamento */}
            {form.clienteId && orcamentos.filter(o => o.clienteId === form.clienteId).length > 0 && (
              <div className="col-span-2">
                <label className="label flex items-center gap-1.5">
                  <Link2 size={13} className="text-gray-400" />
                  Vincular ao Orçamento
                  <span className="text-gray-400 font-normal text-xs ml-1">(opcional)</span>
                </label>
                <select className="input-field" value={form.orcamentoId}
                        onChange={e => handleOrcamentoChange(e.target.value)}>
                  <option value="">— Sem orçamento vinculado —</option>
                  {orcamentos
                    .filter(o => o.clienteId === form.clienteId)
                    .map(o => {
                      const sub = o.itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0);
                      const tot = sub - o.desconto;
                      const lblStatus = o.status === 'pendente' ? 'Pendente'
                        : o.status === 'aprovado' ? 'Aprovado'
                        : o.status === 'recusado' ? 'Recusado' : 'Expirado';
                      return (
                        <option key={o.id} value={o.id}>
                          {o.numero} — {tot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({lblStatus})
                        </option>
                      );
                    })}
                </select>
                {form.orcamentoId && (
                  <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                    ✓ Valor total pré-preenchido. O orçamento será marcado como <strong>Aprovado</strong> ao salvar.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="label">Data de Assinatura</label>
              <input type="date" className="input-field" value={form.dataAssinatura} onChange={f('dataAssinatura')} />
            </div>
            <div>
              <label className="label">Data de Entrega</label>
              <input type="date" className="input-field" value={form.dataEntrega} onChange={f('dataEntrega')} />
            </div>
            <div>
              <label className="label">Valor Total *</label>
              <input type="number" step="0.01" className="input-field" placeholder="0,00" value={form.valorTotal} onChange={f('valorTotal')} />
            </div>
            <div>
              <label className="label">Valor de Entrada</label>
              <input type="number" step="0.01" className="input-field" placeholder="Sugerido: 30–35%" value={form.valorEntrada} onChange={f('valorEntrada')} />
            </div>
            <div>
              <label className="label">Nº de Provas do Vestido</label>
              <input type="number" min="1" max="10" className="input-field" placeholder="Ex: 3" value={form.quantidadeProvas} onChange={f('quantidadeProvas')} />
            </div>

            {/* Preview das parcelas */}
            {valorParcelaPreview && (
              <div className="p-3 bg-brand-black/5 rounded-xl border border-brand-black/10 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resumo financeiro</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Entrada ({valorParcelaPreview.perc}%)</p>
                    <p className="font-bold text-brand-black">{formatMoney(Number(form.valorEntrada))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Saldo</p>
                    <p className="font-bold text-brand-black">{formatMoney(valorParcelaPreview.saldo)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Por prova ({form.quantidadeProvas}x)</p>
                    <p className="font-bold text-brand-gold">{formatMoney(valorParcelaPreview.parcela)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="col-span-2">
              <label className="label">Descrição das Peças / Serviços</label>
              <textarea className="input-field" rows={4} placeholder="Descreva os vestidos, véus, acessórios e serviços incluídos..." value={form.descricaoPecas} onChange={f('descricaoPecas')} />
            </div>
            <div className="col-span-2">
              <label className="label">Cláusulas Especiais</label>
              <textarea className="input-field" rows={3} placeholder="Condições de cancelamento, ajustes, prazos especiais..." value={form.clausulasEspeciais} onChange={f('clausulasEspeciais')} />
            </div>

            {/* Anexo */}
            <div className="col-span-2">
              <label className="label">Anexar Contrato (PDF ou imagem)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
              {anexoNome ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <Paperclip size={16} className="text-brand-gold flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{anexoNome}</span>
                  <button
                    onClick={() => {
                      setAnexoBase64(undefined);
                      setAnexoNome(undefined);
                      setAnexoTipo(undefined);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
                >
                  <Paperclip size={16} />
                  Clique para anexar arquivo (máx. 10 MB)
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex-1 justify-center"
              disabled={!form.clienteId || !form.valorTotal}
            >
              {editingContrato ? 'Salvar Alterações' : 'Criar Contrato'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
        <p className="text-gray-600 mb-6">Deseja excluir este contrato?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button
            onClick={() => { deleteContrato(deleteConfirm!); setDeleteConfirm(null); }}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all justify-center inline-flex"
          >
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
