import React, { useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Calendar, Clock, CheckCircle2, Bell,
  ChevronLeft, ChevronRight, List, Grid, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Agendamento, TipoAgendamento } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import {
  format, parseISO, isToday, isTomorrow, isPast, addDays, isAfter, isBefore,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths,
  isSameDay, isSameMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ── Constantes ─────────────────────────────────────────────────────── */
const tiposAgendamento: { value: TipoAgendamento; label: string; color: string; dot: string }[] = [
  { value: 'consulta',       label: 'Consulta Inicial', color: 'bg-blue-100 text-blue-800',   dot: 'bg-blue-500' },
  { value: 'primeira_prova', label: '1ª Prova',         color: 'bg-rose-100 text-rose-800',   dot: 'bg-rose-500' },
  { value: 'segunda_prova',  label: '2ª Prova',         color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  { value: 'prova_final',    label: 'Prova Final',      color: 'bg-amber-100 text-amber-800',  dot: 'bg-amber-500' },
  { value: 'ajuste',         label: 'Ajuste',           color: 'bg-orange-100 text-orange-800',dot: 'bg-orange-500' },
  { value: 'entrega',        label: 'Entrega',          color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  { value: 'reuniao',        label: 'Reunião',          color: 'bg-gray-100 text-gray-800',    dot: 'bg-gray-500' },
];

const statusAg = [
  { value: 'agendado',   label: 'Agendado',   color: 'yellow' as const },
  { value: 'confirmado', label: 'Confirmado', color: 'blue'   as const },
  { value: 'concluido',  label: 'Concluído',  color: 'green'  as const },
  { value: 'cancelado',  label: 'Cancelado',  color: 'gray'   as const },
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const emptyForm = {
  clienteId: '',
  tipo: 'consulta' as TipoAgendamento,
  data: new Date().toISOString().split('T')[0],
  hora: '10:00',
  duracao: 60,
  descricao: '',
  status: 'agendado' as Agendamento['status'],
};

function getLabelData(data: string, hora: string): string {
  const d = parseISO(data);
  if (isToday(d))    return `Hoje às ${hora}`;
  if (isTomorrow(d)) return `Amanhã às ${hora}`;
  return format(d, "EEE, d 'de' MMM", { locale: ptBR }) + ` às ${hora}`;
}

/* ── Componente ─────────────────────────────────────────────────────── */
export function Agenda() {
  const { clientes, agendamentos, saveAgendamento, deleteAgendamento } = useApp();
  const [search, setSearch]   = useState('');
  const [view, setView]       = useState<'calendario' | 'lista'>('calendario');
  const [listFilter, setListFilter] = useState<'proximos' | 'todos' | 'hoje'>('proximos');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingAg, setEditingAg]   = useState<Agendamento | null>(null);
  const [form, setForm]             = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* Calendário */
  const [calMonth, setCalMonth]   = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const getCliente = (id: string) => clientes.find(c => c.id === id);
  const today = new Date();

  /* Alertas */
  const alertas = agendamentos.filter(a => {
    const d = parseISO(a.data);
    return (isToday(d) || (isAfter(d, today) && isBefore(d, addDays(today, 3))))
      && a.status !== 'cancelado' && a.status !== 'concluido'
      && ['primeira_prova','segunda_prova','prova_final','ajuste'].includes(a.tipo);
  });

  /* Lista filtrada */
  const filtered = agendamentos
    .filter(a => {
      const cliente = getCliente(a.clienteId);
      const matchSearch = !search ||
        cliente?.nome.toLowerCase().includes(search.toLowerCase()) ||
        a.descricao?.toLowerCase().includes(search.toLowerCase());
      const d = parseISO(a.data);
      let matchView = true;
      if (listFilter === 'hoje')    matchView = isToday(d);
      else if (listFilter === 'proximos') matchView = (isToday(d) || isAfter(d, today)) && a.status !== 'cancelado' && a.status !== 'concluido';
      return matchSearch && matchView;
    })
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  /* Agendamentos do dia selecionado */
  const dayAgendamentos = selectedDay
    ? agendamentos
        .filter(a => isSameDay(parseISO(a.data), selectedDay))
        .sort((a, b) => a.hora.localeCompare(b.hora))
    : [];

  /* Calendário — dias do mês */
  const monthStart  = startOfMonth(calMonth);
  const monthEnd    = endOfMonth(calMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad    = getDay(monthStart); // 0=Dom

  const openNew = (data?: string) => {
    setEditingAg(null);
    setForm({ ...emptyForm, data: data || new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (a: Agendamento) => {
    setEditingAg(a);
    setForm({
      clienteId: a.clienteId, tipo: a.tipo, data: a.data, hora: a.hora,
      duracao: a.duracao, descricao: a.descricao || '', status: a.status,
    });
    setModalOpen(true);
  };

  const hojeStr = today.toISOString().split('T')[0];

  /* U3 — data no passado */
  const isPastDate = form.data < hojeStr;

  /* U4 — conflito de horário (mesmo dia+hora, outro agendamento não cancelado) */
  const conflito = agendamentos.find(a =>
    a.id !== editingAg?.id &&
    a.data === form.data &&
    a.hora === form.hora &&
    a.status !== 'cancelado',
  );

  const handleSave = () => {
    if (!form.clienteId) return;
    const ag: Agendamento = {
      id: editingAg?.id || genId(),
      clienteId: form.clienteId, tipo: form.tipo, data: form.data, hora: form.hora,
      duracao: Number(form.duracao), descricao: form.descricao || undefined,
      status: form.status, createdAt: editingAg?.createdAt || new Date().toISOString(),
    };
    saveAgendamento(ag);
    setModalOpen(false);
  };

  const tipoInfo = (tipo: TipoAgendamento) => tiposAgendamento.find(t => t.value === tipo);

  const getAgendamentosDia = (d: Date) =>
    agendamentos.filter(a => isSameDay(parseISO(a.data), d));

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Agenda de Provas</h1>
          <p className="text-gray-500 text-sm mt-1">{agendamentos.length} compromissos cadastrados</p>
        </div>
        <button className="btn-primary" onClick={() => openNew()}>
          <Plus size={16} /> Novo Agendamento
        </button>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <Bell size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {alertas.length} prova{alertas.length > 1 ? 's' : ''} nos próximos 3 dias
              </p>
              <div className="mt-2 space-y-1">
                {alertas.map(a => {
                  const cliente = getCliente(a.clienteId);
                  const t = tipoInfo(a.tipo);
                  return (
                    <p key={a.id} className="text-xs text-amber-700">
                      <strong>{cliente?.nome}</strong> · {t?.label} · {getLabelData(a.data, a.hora)}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle de visualização */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView('calendario')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${view === 'calendario' ? 'bg-brand-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Grid size={15} /> Calendário
          </button>
          <button
            onClick={() => setView('lista')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${view === 'lista' ? 'bg-brand-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List size={15} /> Lista
          </button>
        </div>

        {view === 'lista' && (
          <>
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
              {[
                { key: 'proximos', label: 'Próximos' },
                { key: 'hoje',     label: 'Hoje' },
                { key: 'todos',    label: 'Todos' },
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setListFilter(v.key as typeof listFilter)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${listFilter === v.key ? 'bg-brand-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {/* ═══ CALENDÁRIO ══════════════════════════════════════════════ */}
      {view === 'calendario' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            {/* Navegação do mês */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button
                onClick={() => setCalMonth(prev => subMonths(prev, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="font-semibold text-gray-900 capitalize">
                {format(calMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setCalMonth(prev => addMonths(prev, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Grade dos dias */}
            <div className="p-4">
              {/* Cabeçalho dias da semana */}
              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                ))}
              </div>

              {/* Células */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Padding inicial */}
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}

                {daysInMonth.map(day => {
                  const ags = getAgendamentosDia(day);
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                  const isCurrentMonth = isSameMonth(day, calMonth);
                  const isTodayDay = isToday(day);
                  const hasAgs = ags.length > 0;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`
                        relative min-h-[52px] p-1.5 rounded-xl flex flex-col items-center transition-all
                        ${isSelected
                          ? 'bg-brand-black text-white'
                          : isTodayDay
                          ? 'bg-brand-gold/15 text-brand-black'
                          : 'hover:bg-gray-100 text-gray-700'}
                        ${!isCurrentMonth ? 'opacity-40' : ''}
                      `}
                    >
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isTodayDay && !isSelected ? 'bg-brand-gold text-white font-bold' : ''}`}>
                        {format(day, 'd')}
                      </span>

                      {/* Dots dos agendamentos */}
                      {hasAgs && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full">
                          {ags.slice(0, 3).map(a => {
                            const ti = tipoInfo(a.tipo);
                            return (
                              <span
                                key={a.id}
                                className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : ti?.dot || 'bg-gray-400'}`}
                              />
                            );
                          })}
                          {ags.length > 3 && (
                            <span className={`text-[9px] font-bold ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                              +{ags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legenda */}
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400 mb-2 font-medium">Tipos de compromisso</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {tiposAgendamento.map(t => (
                  <div key={t.value} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                    <span className="text-xs text-gray-500">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Painel lateral do dia selecionado */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {selectedDay
                    ? format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })
                    : 'Selecione um dia'}
                </h3>
                {selectedDay && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dayAgendamentos.length} compromisso{dayAgendamentos.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {selectedDay && (
                <button
                  onClick={() => openNew(format(selectedDay, 'yyyy-MM-dd'))}
                  className="p-1.5 rounded-lg bg-brand-black text-white hover:bg-brand-charcoal transition-colors"
                  title="Agendar neste dia"
                >
                  <Plus size={15} />
                </button>
              )}
            </div>

            <div className="p-4 overflow-y-auto max-h-[500px]">
              {!selectedDay ? (
                <div className="text-center py-12 text-gray-400">
                  <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Clique em um dia no calendário</p>
                </div>
              ) : dayAgendamentos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sem compromissos neste dia</p>
                  <button
                    onClick={() => openNew(format(selectedDay, 'yyyy-MM-dd'))}
                    className="btn-secondary text-xs mt-3"
                  >
                    <Plus size={13} /> Agendar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAgendamentos.map(a => {
                    const cliente = getCliente(a.clienteId);
                    const tipo = tipoInfo(a.tipo);
                    const statusOpt = statusAg.find(s => s.value === a.status);
                    return (
                      <div key={a.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipo?.color}`}>
                            {tipo?.label}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            {a.status !== 'concluido' && a.status !== 'cancelado' && (
                              <button
                                onClick={() => saveAgendamento({ ...a, status: 'concluido' })}
                                className="p-1 rounded text-gray-400 hover:text-emerald-600 transition-colors"
                                title="Concluído"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            <button onClick={() => openEdit(a)} className="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => setDeleteConfirm(a.id)} className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm truncate">{cliente?.nome || '—'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={11} /> {a.hora}
                          </span>
                          <span className="text-xs text-gray-400">{a.duracao} min</span>
                          <Badge variant={statusOpt?.color || 'gray'} size="sm">{statusOpt?.label}</Badge>
                        </div>
                        {a.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.descricao}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LISTA ═══════════════════════════════════════════════════ */}
      {view === 'lista' && (
        filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 card">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum compromisso</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const cliente = getCliente(a.clienteId);
              const tipo = tipoInfo(a.tipo);
              const statusOpt = statusAg.find(s => s.value === a.status);
              const d = parseISO(a.data);
              const isTodayDay = isToday(d);
              const vencido = isPast(d) && !isTodayDay && a.status !== 'concluido' && a.status !== 'cancelado';

              return (
                <div
                  key={a.id}
                  className={`card p-0 overflow-hidden border-l-4 transition-all hover:shadow-lg ${isTodayDay ? 'border-l-brand-gold' : vencido ? 'border-l-red-400' : 'border-l-gray-200'}`}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className={`text-center min-w-[60px] py-2 px-3 rounded-xl ${isTodayDay ? 'bg-brand-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <p className="text-xs font-semibold uppercase leading-tight">{format(d, 'EEE', { locale: ptBR })}</p>
                      <p className="text-2xl font-bold leading-tight">{format(d, 'd')}</p>
                      <p className="text-xs leading-tight">{format(d, 'MMM', { locale: ptBR })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${tipo?.color}`}>
                          {tipo?.label}
                        </span>
                        <Badge variant={statusOpt?.color || 'gray'} size="sm">{statusOpt?.label}</Badge>
                        {vencido && <Badge variant="red" size="sm">Vencido</Badge>}
                      </div>
                      <p className="font-semibold text-gray-900">{cliente?.nome || '—'}</p>
                      {a.descricao && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.descricao}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock size={11} /> {a.hora}</span>
                        <span>{a.duracao} min</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {a.status !== 'concluido' && a.status !== 'cancelado' && (
                        <button
                          onClick={() => saveAgendamento({ ...a, status: 'concluido' })}
                          className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Marcar como concluído"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAg ? 'Editar Agendamento' : 'Novo Agendamento'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Cliente *</label>
              <select
                className="input-field"
                value={form.clienteId}
                onChange={e => setForm(p => ({ ...p, clienteId: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Tipo de Compromisso</label>
              <select
                className="input-field"
                value={form.tipo}
                onChange={e => setForm(p => ({ ...p, tipo: e.target.value as TipoAgendamento }))}
              >
                {tiposAgendamento.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Data *</label>
              <input
                type="date"
                className="input-field"
                value={form.data}
                onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Horário</label>
              <input
                type="time"
                className="input-field"
                value={form.hora}
                onChange={e => setForm(p => ({ ...p, hora: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Duração (minutos)</label>
              <select
                className="input-field"
                value={form.duracao}
                onChange={e => setForm(p => ({ ...p, duracao: Number(e.target.value) }))}
              >
                {[30, 45, 60, 90, 120, 180].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input-field"
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value as Agendamento['status'] }))}
              >
                {statusAg.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Descrição / Observações</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Detalhes do compromisso..."
                value={form.descricao}
                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
              />
            </div>
          </div>

          {/* U3 — aviso data passada */}
          {isPastDate && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
              <AlertTriangle size={13} className="flex-shrink-0" />
              A data selecionada já passou. Deseja agendar no passado mesmo assim?
            </div>
          )}

          {/* U4 — aviso conflito de horário */}
          {conflito && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <AlertTriangle size={13} className="flex-shrink-0" />
              Conflito: <strong>{clientes.find(c => c.id === conflito.clienteId)?.nome}</strong> já está agendada neste mesmo horário ({conflito.hora}).
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center" disabled={!form.clienteId}>
              {editingAg ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
        <p className="text-gray-600 mb-6">Deseja excluir este agendamento?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button
            onClick={() => { deleteAgendamento(deleteConfirm!); setDeleteConfirm(null); }}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all justify-center inline-flex"
          >
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
