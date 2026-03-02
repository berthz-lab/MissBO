import React, { useState } from 'react';
import { Plus, Ruler, Search, ChevronDown, ChevronUp, Edit2, Trash2, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MedidasNoiva } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ── Medidas agrupadas por região corporal ──────────────────────────── */
const gruposMedidas = [
  {
    grupo: 'Superior',
    cor: 'bg-brand-black text-white',
    corBg: 'bg-gray-900/5 border-gray-900/10',
    campos: [
      { key: 'busto',           label: 'Busto' },
      { key: 'cavaAcavasCostas',label: 'Cava a cavas costas' },
      { key: 'cavaAcavasFrente',label: 'Cava a cavas frente' },
      { key: 'ombroAOmbro',     label: 'Ombro a ombro' },
      { key: 'ombro',           label: 'Ombro' },
      { key: 'colarinho',       label: 'Colarinho' },
      { key: 'separacaoBusto',  label: 'Separação do busto' },
      { key: 'altBusto',        label: 'Alt. busto' },
    ],
  },
  {
    grupo: 'Central',
    cor: 'bg-brand-charcoal text-white',
    corBg: 'bg-gray-700/5 border-gray-700/10',
    campos: [
      { key: 'abaixoDoBusto',   label: 'Abaixo do busto' },
      { key: 'cintura',         label: 'Cintura' },
      { key: 'altCentroFrente', label: 'Alt. (centro) frente' },
      { key: 'altOmbroFrente',  label: 'Alt. (ombro) frente' },
      { key: 'altOmbroCostas',  label: 'Alt. (ombro) costas' },
      { key: 'altCentroCostas', label: 'Alt. (centro) costas' },
      { key: 'altGanchoFrente', label: 'Alt. gancho frente' },
    ],
  },
  {
    grupo: 'Inferior',
    cor: 'bg-brand-smoke text-white',
    corBg: 'bg-gray-500/5 border-gray-500/10',
    campos: [
      { key: 'quadril',           label: 'Quadril' },
      { key: 'altQuadril',        label: 'Alt. quadril' },
      { key: 'altDesejadaSaia',   label: 'Alt. desejada saia' },
      { key: 'altCinturaAoJoelho',label: 'Alt. cintura ao joelho' },
      { key: 'largJoelho',        label: 'Larg. joelho' },
      { key: 'alturaLateral',     label: 'Altura lateral' },
    ],
  },
  {
    grupo: 'Braços',
    cor: 'bg-white text-brand-black border border-gray-300',
    corBg: 'bg-amber-50/40 border-amber-100',
    campos: [
      { key: 'punho',           label: 'Punho' },
      { key: 'largBraco',       label: 'Larg. braço' },
      { key: 'cumprimentoBraco',label: 'Cumprimento braço' },
      { key: 'altManga34',      label: 'Alt. manga 3/4' },
      { key: 'alturaMangaCurta',label: 'Alt. manga curta' },
    ],
  },
] as const;

/* Flatten for form */
const camposMedidas = gruposMedidas.flatMap(g =>
  g.campos.map(c => ({ ...c, grupo: g.grupo }))
);

type MedidaKey = typeof camposMedidas[number]['key'];

const emptyMedidas: Omit<MedidasNoiva, 'id' | 'clienteId' | 'createdAt'> = {
  data: new Date().toISOString().split('T')[0],
  observacoes: '',
};

export function FichaNoiva() {
  const { clientes, medidas, saveMedidas, deleteMedidas, getMedidasByCliente } = useApp();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [editingMedida, setEditingMedida] = useState<MedidasNoiva | null>(null);
  const [form, setForm] = useState<Record<string, string | number>>({ data: emptyMedidas.data, observacoes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const clientesFiltrados = clientes.filter(c =>
    !search || c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setEditingMedida(null);
    setForm({ data: new Date().toISOString().split('T')[0], observacoes: '' });
    setModalOpen(true);
  };

  const openEdit = (m: MedidasNoiva) => {
    setSelectedClienteId(m.clienteId);
    setEditingMedida(m);
    const f: Record<string, string | number> = { data: m.data, observacoes: m.observacoes || '' };
    camposMedidas.forEach(({ key }) => {
      if (m[key as keyof MedidasNoiva] !== undefined)
        f[key] = m[key as keyof MedidasNoiva] as number;
    });
    setForm(f);
    setModalOpen(true);
  };

  const handleSave = () => {
    const medida: MedidasNoiva = {
      id: editingMedida?.id || genId(),
      clienteId: selectedClienteId,
      data: String(form.data),
      observacoes: String(form.observacoes || ''),
      createdAt: editingMedida?.createdAt || new Date().toISOString(),
    };
    camposMedidas.forEach(({ key }) => {
      if (form[key] !== '' && form[key] !== undefined) {
        (medida as unknown as Record<string, unknown>)[key] = Number(form[key]);
      }
    });
    saveMedidas(medida);
    setModalOpen(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Ficha da Noiva</h1>
          <p className="text-gray-500 text-sm mt-1">Medidas e registros corporais</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-9"
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {clientesFiltrados.map(c => {
          const clienteMedidas = getMedidasByCliente(c.id);
          const isExpanded = expanded === c.id;

          return (
            <div key={c.id} className="card p-0 overflow-hidden">
              {/* Header da cliente */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-black flex items-center justify-center text-white font-bold text-sm">
                    {c.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.nome}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {clienteMedidas.length === 0
                        ? 'Nenhuma medida registrada'
                        : `${clienteMedidas.length} registro${clienteMedidas.length > 1 ? 's' : ''} de medidas`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); openNew(c.id); }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <Plus size={13} /> Registrar
                  </button>
                  {isExpanded
                    ? <ChevronUp size={18} className="text-gray-400" />
                    : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {clienteMedidas.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Ruler size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma medida registrada</p>
                      <button onClick={() => openNew(c.id)} className="btn-primary mt-3 text-sm">
                        <Plus size={14} /> Registrar Medidas
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 space-y-6">
                      {clienteMedidas.map(m => (
                        <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          {/* Header do registro */}
                          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-2">
                              <Ruler size={15} className="text-brand-gold" />
                              <span className="text-sm font-semibold text-gray-800">
                                Medidas de {format(parseISO(m.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEdit(m)}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(m.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Grupos corporais */}
                          <div className="p-5 space-y-5">
                            {gruposMedidas.map(({ grupo, cor, corBg, campos }) => {
                              const camposComValor = campos.filter(({ key }) => m[key as keyof MedidasNoiva] != null && m[key as keyof MedidasNoiva] !== undefined);
                              if (camposComValor.length === 0) return null;
                              return (
                                <div key={grupo} className={`rounded-xl border p-4 ${corBg}`}>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cor}`}>
                                      {grupo}
                                    </span>
                                    <span className="text-xs text-gray-400">{camposComValor.length} medidas</span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {camposComValor.map(({ key, label }) => {
                                      const val = m[key as keyof MedidasNoiva];
                                      return (
                                        <div key={key} className="bg-white rounded-lg p-2.5 shadow-sm border border-white">
                                          <p className="text-[11px] text-gray-400 leading-tight">{label}</p>
                                          <p className="font-bold text-brand-black text-sm mt-0.5">{String(val)} <span className="font-normal text-xs text-gray-400">cm</span></p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {m.observacoes && (
                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-xs font-semibold text-amber-700 mb-1">Observações</p>
                                <p className="text-sm text-amber-800">{m.observacoes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {clientesFiltrados.length === 0 && (
          <div className="text-center py-16 card text-gray-400">
            <Ruler size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">Nenhuma cliente encontrada</p>
          </div>
        )}
      </div>

      {/* Modal de Medidas */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMedida ? 'Editar Medidas' : 'Registrar Medidas'}
        size="2xl"
      >
        <div className="space-y-6">
          <div>
            <label className="label">Data da Medição *</label>
            <input
              type="date"
              className="input-field sm:w-48"
              value={String(form.data)}
              onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
            />
          </div>

          {/* Grupos no modal */}
          {gruposMedidas.map(({ grupo, cor, campos }) => (
            <div key={grupo}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cor}`}>{grupo}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {campos.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        className="input-field pr-10 text-sm"
                        value={form[key] ?? ''}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="label">Observações</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Anotações sobre a medição..."
              value={String(form.observacoes)}
              onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center">
              <Save size={15} /> Salvar Medidas
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
        <p className="text-gray-600 mb-6">Deseja excluir este registro de medidas?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">
            Cancelar
          </button>
          <button
            onClick={() => { deleteMedidas(deleteConfirm!); setDeleteConfirm(null); }}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all justify-center inline-flex"
          >
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
