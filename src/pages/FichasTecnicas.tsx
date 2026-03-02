import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ClipboardList } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FichaTecnica } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const categorias = [
  { value: 'vestido', label: 'Vestido' },
  { value: 'veu', label: 'Véu' },
  { value: 'acessorio', label: 'Acessório' },
  { value: 'roupa_cerimonia', label: 'Roupa Cerimônia' },
  { value: 'outro', label: 'Outro' },
];

const statusFicha = [
  { value: 'aguardando', label: 'Aguardando', color: 'gray' as const },
  { value: 'em_corte', label: 'Em Corte', color: 'yellow' as const },
  { value: 'costura', label: 'Costura', color: 'blue' as const },
  { value: 'prova', label: 'Prova', color: 'purple' as const },
  { value: 'ajuste', label: 'Ajuste', color: 'rose' as const },
  { value: 'concluida', label: 'Concluída', color: 'green' as const },
];

const emptyFicha = {
  clienteId: '',
  nomePeca: '',
  categoria: 'vestido' as FichaTecnica['categoria'],
  tecido: '',
  cor: '',
  modelagem: '',
  detalhes: '',
  status: 'aguardando' as FichaTecnica['status'],
  dataEntrega: '',
  valorCusto: '',
  valorVenda: '',
  observacoes: '',
};

export function FichasTecnicas() {
  const { clientes, fichasTecnicas, saveFicha, deleteFicha } = useApp();
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFicha, setEditingFicha] = useState<FichaTecnica | null>(null);
  const [form, setForm] = useState({ ...emptyFicha });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getCliente = (id: string) => clientes.find(c => c.id === id);

  const filtered = fichasTecnicas.filter(f => {
    const cliente = getCliente(f.clienteId);
    const matchSearch = !search ||
      f.nomePeca.toLowerCase().includes(search.toLowerCase()) ||
      cliente?.nome.toLowerCase().includes(search.toLowerCase());
    const matchCliente = !clienteFilter || f.clienteId === clienteFilter;
    const matchStatus = !statusFilter || f.status === statusFilter;
    return matchSearch && matchCliente && matchStatus;
  });

  const openNew = () => {
    setEditingFicha(null);
    setForm({ ...emptyFicha });
    setModalOpen(true);
  };

  const openEdit = (f: FichaTecnica) => {
    setEditingFicha(f);
    setForm({
      clienteId: f.clienteId,
      nomePeca: f.nomePeca,
      categoria: f.categoria,
      tecido: f.tecido,
      cor: f.cor,
      modelagem: f.modelagem,
      detalhes: f.detalhes,
      status: f.status,
      dataEntrega: f.dataEntrega || '',
      valorCusto: f.valorCusto?.toString() || '',
      valorVenda: f.valorVenda?.toString() || '',
      observacoes: f.observacoes || '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.clienteId || !form.nomePeca) return;
    const ficha: FichaTecnica = {
      id: editingFicha?.id || genId(),
      clienteId: form.clienteId,
      nomePeca: form.nomePeca,
      categoria: form.categoria as FichaTecnica['categoria'],
      tecido: form.tecido,
      cor: form.cor,
      modelagem: form.modelagem,
      detalhes: form.detalhes,
      status: form.status as FichaTecnica['status'],
      dataEntrega: form.dataEntrega || undefined,
      valorCusto: form.valorCusto ? Number(form.valorCusto) : undefined,
      valorVenda: form.valorVenda ? Number(form.valorVenda) : undefined,
      observacoes: form.observacoes || undefined,
      createdAt: editingFicha?.createdAt || new Date().toISOString(),
    };
    saveFicha(ficha);
    setModalOpen(false);
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Fichas Técnicas</h1>
          <p className="text-gray-500 text-sm mt-1">{fichasTecnicas.length} fichas cadastradas</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> Nova Ficha
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Buscar peça ou cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field sm:w-48" value={clienteFilter} onChange={e => setClienteFilter(e.target.value)}>
          <option value="">Todas as clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select className="input-field sm:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {statusFicha.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Peça</th>
                <th className="table-th">Cliente</th>
                <th className="table-th">Categoria</th>
                <th className="table-th">Tecido / Cor</th>
                <th className="table-th">Status</th>
                <th className="table-th">Entrega</th>
                <th className="table-th">Valor Venda</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Nenhuma ficha técnica encontrada</p>
                  </td>
                </tr>
              ) : filtered.map(fi => {
                const cliente = getCliente(fi.clienteId);
                const statusOpt = statusFicha.find(s => s.value === fi.status);
                const catOpt = categorias.find(c => c.value === fi.categoria);
                return (
                  <tr key={fi.id} className="table-row">
                    <td className="table-td font-semibold text-gray-900">{fi.nomePeca}</td>
                    <td className="table-td">{cliente?.nome || '—'}</td>
                    <td className="table-td"><Badge variant="gray">{catOpt?.label}</Badge></td>
                    <td className="table-td text-gray-500">
                      {fi.tecido && fi.cor ? `${fi.tecido} · ${fi.cor}` : fi.tecido || fi.cor || '—'}
                    </td>
                    <td className="table-td">
                      <Badge variant={statusOpt?.color || 'gray'}>{statusOpt?.label}</Badge>
                    </td>
                    <td className="table-td text-gray-500">{fi.dataEntrega || '—'}</td>
                    <td className="table-td font-medium">
                      {fi.valorVenda ? fi.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(fi)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(fi.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingFicha ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente *</label>
              <select className="input-field" value={form.clienteId} onChange={f('clienteId')}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nome da Peça *</label>
              <input className="input-field" placeholder="Ex: Vestido Principal" value={form.nomePeca} onChange={f('nomePeca')} />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input-field" value={form.categoria} onChange={f('categoria')}>
                {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={f('status')}>
                {statusFicha.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tecido</label>
              <input className="input-field" placeholder="Ex: Crepe de seda" value={form.tecido} onChange={f('tecido')} />
            </div>
            <div>
              <label className="label">Cor / Tom</label>
              <input className="input-field" placeholder="Ex: Branco off-white" value={form.cor} onChange={f('cor')} />
            </div>
            <div>
              <label className="label">Modelagem</label>
              <input className="input-field" placeholder="Ex: Sereia, Princesa..." value={form.modelagem} onChange={f('modelagem')} />
            </div>
            <div>
              <label className="label">Data de Entrega</label>
              <input type="date" className="input-field" value={form.dataEntrega} onChange={f('dataEntrega')} />
            </div>
            <div>
              <label className="label">Custo (R$)</label>
              <input type="number" step="0.01" className="input-field" placeholder="0,00" value={form.valorCusto} onChange={f('valorCusto')} />
            </div>
            <div>
              <label className="label">Valor de Venda (R$)</label>
              <input type="number" step="0.01" className="input-field" placeholder="0,00" value={form.valorVenda} onChange={f('valorVenda')} />
            </div>
            <div className="col-span-2">
              <label className="label">Detalhes da Peça</label>
              <textarea className="input-field" rows={3} placeholder="Bordados, aplicações, decote, cauda..." value={form.detalhes} onChange={f('detalhes')} />
            </div>
            <div className="col-span-2">
              <label className="label">Observações Técnicas</label>
              <textarea className="input-field" rows={2} placeholder="Pontos de atenção, ajustes especiais..." value={form.observacoes} onChange={f('observacoes')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center" disabled={!form.clienteId || !form.nomePeca}>
              {editingFicha ? 'Salvar Alterações' : 'Criar Ficha'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
        <p className="text-gray-600 mb-6">Deseja excluir esta ficha técnica?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={() => { deleteFicha(deleteConfirm!); setDeleteConfirm(null); }}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all justify-center inline-flex">
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
