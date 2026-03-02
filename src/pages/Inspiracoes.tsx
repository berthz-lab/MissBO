import React, { useState, useRef } from 'react';
import { Plus, Search, Trash2, Star, Image, ChevronDown, ChevronUp, Heart, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Inspiracao, CategoriaInspiracao } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const categorias: { value: CategoriaInspiracao; label: string; color: 'rose' | 'purple' | 'blue' | 'green' | 'yellow' | 'gray' }[] = [
  { value: 'vestido', label: 'Vestido', color: 'rose' },
  { value: 'acessorio', label: 'Acessório', color: 'purple' },
  { value: 'penteado', label: 'Penteado', color: 'blue' },
  { value: 'maquiagem', label: 'Maquiagem', color: 'yellow' },
  { value: 'decoracao', label: 'Decoração', color: 'green' },
  { value: 'bouquet', label: 'Bouquet', color: 'rose' },
  { value: 'outro', label: 'Outro', color: 'gray' },
];

const emptyForm = {
  clienteId: '',
  titulo: '',
  categoria: 'vestido' as CategoriaInspiracao,
  imagemUrl: '',
  observacoes: '',
  favorito: false,
};

export function Inspiracoes() {
  const { clientes, inspiracoes, saveInspiracao, deleteInspiracao, getInspiracoesCliente } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<CategoriaInspiracao | ''>('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Inspiracao | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clientesComFiltro = clientes.filter(c => {
    if (!search) return true;
    return c.nome.toLowerCase().includes(search.toLowerCase());
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const openNew = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setForm({ ...emptyForm, clienteId });
    setImagePreview('');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.titulo) return;
    const insp: Inspiracao = {
      id: genId(),
      clienteId: selectedClienteId,
      titulo: form.titulo,
      categoria: form.categoria,
      imagemBase64: imagePreview || undefined,
      imagemUrl: form.imagemUrl || undefined,
      observacoes: form.observacoes || undefined,
      favorito: form.favorito,
      createdAt: new Date().toISOString(),
    };
    saveInspiracao(insp);
    setModalOpen(false);
  };

  const toggleFavorito = (i: Inspiracao) => {
    saveInspiracao({ ...i, favorito: !i.favorito });
  };

  const getImageSrc = (i: Inspiracao) => i.imagemBase64 || i.imagemUrl || '';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Painel de Inspiração</h1>
          <p className="text-gray-500 text-sm mt-1">Galeria de referências por cliente</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field sm:w-48" value={catFilter} onChange={e => setCatFilter(e.target.value as CategoriaInspiracao | '')}>
          <option value="">Todas as categorias</option>
          {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Clientes list */}
      <div className="space-y-4">
        {clientesComFiltro.map(c => {
          const clienteInsps = getInspiracoesCliente(c.id).filter(i =>
            !catFilter || i.categoria === catFilter
          );
          const isExpanded = expanded === c.id;

          return (
            <div key={c.id} className="card p-0 overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-rose-50/50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-bold text-sm">
                    {c.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.nome}</h3>
                    <p className="text-xs text-gray-500">
                      {clienteInsps.length === 0
                        ? 'Nenhuma inspiração'
                        : `${clienteInsps.length} inspiração${clienteInsps.length > 1 ? 'ões' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); openNew(c.id); }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <Plus size={13} /> Adicionar
                  </button>
                  {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-rose-100 p-5">
                  {clienteInsps.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Image size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhuma inspiração adicionada</p>
                      <button onClick={() => openNew(c.id)} className="btn-primary mt-3 text-sm">
                        <Plus size={14} /> Adicionar Inspiração
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {clienteInsps.map(insp => {
                        const imgSrc = getImageSrc(insp);
                        const catInfo = categorias.find(cat => cat.value === insp.categoria);
                        return (
                          <div key={insp.id} className="group relative">
                            <div
                              className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-gray-100 flex items-center justify-center"
                              onClick={() => setLightbox(insp)}
                            >
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={insp.titulo}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="text-center p-4">
                                  <Image size={28} className="mx-auto mb-2 text-gray-300" />
                                  <p className="text-xs text-gray-400 break-words">{insp.titulo}</p>
                                </div>
                              )}
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            </div>

                            {/* Info bar */}
                            <div className="mt-1.5 flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{insp.titulo}</p>
                                <Badge variant={catInfo?.color || 'gray'} size="sm">{catInfo?.label}</Badge>
                              </div>
                              <div className="flex flex-col gap-1 flex-shrink-0">
                                <button
                                  onClick={() => toggleFavorito(insp)}
                                  className={`p-1 rounded ${insp.favorito ? 'text-rose-500' : 'text-gray-300 hover:text-rose-400'} transition-colors`}
                                >
                                  <Heart size={13} fill={insp.favorito ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(insp.id)}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Inspiration Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar Inspiração" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input className="input-field" placeholder="Ex: Vestido sereia com renda" value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
          </div>

          <div>
            <label className="label">Categoria</label>
            <select className="input-field" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value as CategoriaInspiracao }))}>
              {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="label">Imagem</label>
            <div
              className="border-2 border-dashed border-rose-200 rounded-xl p-6 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div>
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg mb-3 object-contain" />
                  <p className="text-xs text-gray-500">Clique para trocar a imagem</p>
                </div>
              ) : (
                <div>
                  <Upload size={28} className="mx-auto mb-2 text-rose-300" />
                  <p className="text-sm text-rose-600 font-medium">Clique para enviar foto</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div>
            <label className="label">Ou cole uma URL de imagem</label>
            <input className="input-field" type="url" placeholder="https://..." value={form.imagemUrl}
              onChange={e => setForm(p => ({ ...p, imagemUrl: e.target.value }))} />
          </div>

          <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
            <input type="checkbox" id="favorito" checked={form.favorito}
              onChange={e => setForm(p => ({ ...p, favorito: e.target.checked }))}
              className="w-4 h-4 text-rose-600 rounded" />
            <label htmlFor="favorito" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
              <Heart size={14} className="text-rose-500" /> Marcar como favorita
            </label>
          </div>

          <div>
            <label className="label">Observações da Estilista</label>
            <textarea className="input-field" rows={2} placeholder="Pontos de atenção, adaptações..." value={form.observacoes}
              onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center" disabled={!form.titulo}>
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-bold text-lg">{lightbox.titulo}</h3>
                {lightbox.observacoes && <p className="text-gray-300 text-sm mt-1">{lightbox.observacoes}</p>}
              </div>
              <button onClick={() => setLightbox(null)} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10">
                ✕
              </button>
            </div>
            {getImageSrc(lightbox) ? (
              <img src={getImageSrc(lightbox)} alt={lightbox.titulo} className="max-h-[75vh] mx-auto rounded-xl object-contain" />
            ) : (
              <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                <Image size={48} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
        <p className="text-gray-600 mb-6">Deseja excluir esta inspiração?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={() => { deleteInspiracao(deleteConfirm!); setDeleteConfirm(null); }}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all justify-center inline-flex">
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
