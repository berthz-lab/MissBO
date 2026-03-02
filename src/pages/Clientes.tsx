import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Heart, Phone, Mail, MapPin, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Cliente } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusOptions = [
  { value: 'lead', label: 'Lead', color: 'yellow' as const },
  { value: 'ativo', label: 'Ativo', color: 'rose' as const },
  { value: 'concluido', label: 'Concluído', color: 'green' as const },
  { value: 'cancelado', label: 'Cancelado', color: 'gray' as const },
];

const emptyCliente: Omit<Cliente, 'id' | 'createdAt'> = {
  nome: '', telefone: '', email: '', cpf: '',
  dataContato: new Date().toISOString().split('T')[0],
  dataCasamento: '', local: '', endereco: '', distanciaKm: undefined,
  indicacao: '', status: 'lead', observacoes: '',
};

export function Clientes() {
  const { clientes, saveCliente, deleteCliente } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ ...emptyCliente });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = clientes.filter(c => {
    const matchSearch = !search || c.nome.toLowerCase().includes(search.toLowerCase())
      || c.telefone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditingCliente(null);
    setForm({ ...emptyCliente });
    setModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente(c);
    setForm({
      nome: c.nome, telefone: c.telefone, email: c.email, cpf: c.cpf || '',
      dataContato: c.dataContato, dataCasamento: c.dataCasamento || '',
      local: c.local || '', endereco: c.endereco || '',
      distanciaKm: c.distanciaKm, indicacao: c.indicacao || '',
      status: c.status, observacoes: c.observacoes || '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nome || !form.telefone) return;
    const cliente: Cliente = {
      ...form,
      id: editingCliente?.id || genId(),
      createdAt: editingCliente?.createdAt || new Date().toISOString(),
    };
    saveCliente(cliente);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    setDeleteConfirm(null);
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes cadastradas</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> Nova Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">Todos os status</option>
          {statusOptions.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-3 text-center py-16 text-gray-400">
            <Heart size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhuma cliente encontrada</p>
            <p className="text-sm mt-1">Cadastre sua primeira noiva!</p>
          </div>
        ) : filtered.map(c => {
          const statusOpt = statusOptions.find(s => s.value === c.status);
          return (
            <div key={c.id} className="card hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate text-base">{c.nome}</h3>
                  <Badge variant={statusOpt?.color || 'gray'} size="sm">{statusOpt?.label}</Badge>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 flex-shrink-0" />
                  <span>{c.telefone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.dataCasamento && (
                  <div className="flex items-center gap-2">
                    <Heart size={13} className="text-rose-400 flex-shrink-0" />
                    <span>{format(parseISO(c.dataCasamento), "dd/MM/yyyy")}</span>
                  </div>
                )}
                {c.local && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{c.local}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/clientes/${c.id}`)}
                  className="flex-1 btn-secondary text-xs py-2 justify-center"
                >
                  <Eye size={13} /> Ver perfil
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(c.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nova Cliente'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome Completo *</label>
              <input className="input-field" placeholder="Nome da noiva" value={form.nome} onChange={f('nome')} />
            </div>
            <div>
              <label className="label">Telefone / WhatsApp *</label>
              <input className="input-field" placeholder="(11) 99999-9999" value={form.telefone} onChange={f('telefone')} />
            </div>
            <div>
              <label className="label">CPF</label>
              <input className="input-field" placeholder="000.000.000-00" value={form.cpf} onChange={f('cpf')} />
            </div>
            <div className="col-span-2">
              <label className="label">E-mail</label>
              <input className="input-field" type="email" placeholder="email@exemplo.com" value={form.email} onChange={f('email')} />
            </div>
            <div>
              <label className="label">Data do 1º Contato</label>
              <input className="input-field" type="date" value={form.dataContato} onChange={f('dataContato')} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={f('status')}>
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data do Casamento</label>
              <input className="input-field" type="date" value={form.dataCasamento} onChange={f('dataCasamento')} />
            </div>
            <div>
              <label className="label">Local do Casamento</label>
              <input className="input-field" placeholder="Nome do espaço" value={form.local} onChange={f('local')} />
            </div>
            <div>
              <label className="label">Como nos conheceu?</label>
              <input className="input-field" placeholder="Instagram, indicação..." value={form.indicacao} onChange={f('indicacao')} />
            </div>
            <div className="col-span-2">
              <label className="label">Endereço da cliente (para navegação)</label>
              <input className="input-field" placeholder="Rua, Nº, Bairro, Cidade — SP" value={form.endereco || ''} onChange={f('endereco')} />
            </div>
            <div>
              <label className="label">Distância do ateliê (km, ida)</label>
              <input className="input-field" type="number" min="0" step="0.5" placeholder="Ex: 12"
                     value={form.distanciaKm ?? ''} onChange={e => setForm(p => ({ ...p, distanciaKm: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Observações</label>
              <textarea className="input-field" rows={3} placeholder="Anotações importantes..." value={form.observacoes} onChange={f('observacoes')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center" disabled={!form.nome || !form.telefone}>
              {editingCliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir esta cliente? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={() => handleDelete(deleteConfirm!)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all justify-center inline-flex">
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
