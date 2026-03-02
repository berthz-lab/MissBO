import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Edit2, Trash2, Scissors } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { Pagamento } from '../types';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formasPagamento = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'transferencia', label: 'Transferência' },
];

const tiposPagamento = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'parcela', label: 'Parcela' },
  { value: 'saldo', label: 'Saldo Final' },
  { value: 'outro', label: 'Outro' },
];

const COLORS = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa'];

const periodos = [
  { value: '1m', label: 'Este mês' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '12m', label: 'Último ano' },
  { value: 'all', label: 'Todo período' },
];

const emptyForm = {
  clienteId: '',
  descricao: '',
  valor: '',
  data: new Date().toISOString().split('T')[0],
  tipo: 'entrada' as Pagamento['tipo'],
  status: 'pago' as Pagamento['status'],
  formaPagamento: 'pix' as Pagamento['formaPagamento'],
};

export function Financeiro() {
  const { clientes, pagamentos, parcelasProva, savePagamento, deletePagamento } = useApp();
  const [periodo, setPeriodo] = useState('3m');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPag, setEditingPag] = useState<Pagamento | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getCliente = (id: string) => clientes.find(c => c.id === id);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  /* ── Filtra apenas dados de clientes que ainda existem (evita órfãos) ── */
  const clienteIds = useMemo(() => new Set(clientes.map(c => c.id)), [clientes]);
  const pagsValidos = useMemo(
    () => pagamentos.filter(p => clienteIds.has(p.clienteId)),
    [pagamentos, clienteIds],
  );
  const provasValidas = useMemo(
    () => parcelasProva.filter(p => clienteIds.has(p.clienteId)),
    [parcelasProva, clienteIds],
  );

  /* ── Pagamentos filtrados pelo período ── */
  const filteredPagamentos = useMemo(() => {
    return pagsValidos.filter(p => {
      if (periodo === 'all') return true;
      const d = parseISO(p.data);
      const months = periodo === '1m' ? 1 : periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12;
      const start = startOfMonth(subMonths(today, months - 1));
      return isWithinInterval(d, { start, end: today });
    });
  }, [pagsValidos, periodo]);

  /* ── Todas as parcelas de prova pendentes (sem filtro de período)
       "A Receber" é uma obrigação vigente — não faz sentido filtrá-la por data ── */
  const allProvasPend = useMemo(
    () => provasValidas.filter(p => !p.pago && p.statusProva !== 'cancelada'),
    [provasValidas],
  );

  /* ── KPIs ── */
  const recebido = filteredPagamentos.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0);

  // A Receber = pagamentos pendentes + provas sem data ou com data futura/hoje
  const pendente =
    filteredPagamentos.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.valor, 0) +
    allProvasPend.filter(p => !p.dataProva || p.dataProva >= todayStr).reduce((a, p) => a + p.valorParcela, 0);

  // Vencido = pagamentos vencidos + provas com dataProva no passado
  const vencido =
    filteredPagamentos.filter(p => p.status === 'vencido').reduce((acc, p) => acc + p.valor, 0) +
    allProvasPend.filter(p => p.dataProva && p.dataProva < todayStr).reduce((a, p) => a + p.valorParcela, 0);

  /* ── Gráfico de evolução mensal ── */
  const monthlyData = useMemo(() => {
    const months = periodo === '1m' ? 1 : periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12;
    return Array.from({ length: Math.min(months, 12) }).map((_, i) => {
      const date = subMonths(today, months - 1 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const pags = pagsValidos.filter(p => {
        const d = parseISO(p.data);
        return isWithinInterval(d, { start, end });
      });
      const provasDoMes = provasValidas.filter(p => {
        if (p.pago || p.statusProva === 'cancelada') return false;
        const ds = p.dataProva || p.createdAt.split('T')[0];
        const d = parseISO(ds);
        return isWithinInterval(d, { start, end });
      });
      return {
        name: format(date, 'MMM/yy', { locale: ptBR }),
        recebido: pags.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0),
        pendente:
          pags.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.valor, 0) +
          provasDoMes.reduce((a, p) => a + p.valorParcela, 0),
      };
    });
  }, [pagsValidos, provasValidas, periodo]);

  /* ── Gráfico por forma de pagamento ── */
  const porForma = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPagamentos.filter(p => p.status === 'pago' && p.formaPagamento).forEach(p => {
      const label = formasPagamento.find(f => f.value === p.formaPagamento)?.label || p.formaPagamento!;
      counts[label] = (counts[label] || 0) + p.valor;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredPagamentos]);

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const openNew = () => {
    setEditingPag(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (p: Pagamento) => {
    setEditingPag(p);
    setForm({
      clienteId: p.clienteId,
      descricao: p.descricao,
      valor: p.valor.toString(),
      data: p.data,
      tipo: p.tipo,
      status: p.status,
      formaPagamento: p.formaPagamento || 'pix',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.clienteId || !form.valor) return;
    const pag: Pagamento = {
      id: editingPag?.id || genId(),
      clienteId: form.clienteId,
      descricao: form.descricao,
      valor: Number(form.valor),
      data: form.data,
      tipo: form.tipo,
      status: form.status,
      formaPagamento: form.formaPagamento,
      createdAt: editingPag?.createdAt || new Date().toISOString(),
    };
    savePagamento(pag);
    setModalOpen(false);
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="text-sm">
            {p.name === 'recebido' ? 'Recebido' : 'A Receber'}: {formatMoney(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const temItensTabela = filteredPagamentos.length > 0 || allProvasPend.length > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Dashboard Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral das finanças</p>
        </div>
        <div className="flex gap-3">
          <select className="input-field sm:w-44" value={periodo} onChange={e => setPeriodo(e.target.value)}>
            {periodos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16} /> Lançamento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recebido</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">{formatMoney(recebido)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">A Receber</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{formatMoney(pendente)}</p>
              {allProvasPend.filter(p => !p.dataProva || p.dataProva >= todayStr).length > 0 && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Scissors size={10} />
                  Inclui {allProvasPend.filter(p => !p.dataProva || p.dataProva >= todayStr).length} parcela(s) de prova
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vencido</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{formatMoney(vencido)}</p>
              {allProvasPend.filter(p => p.dataProva && p.dataProva < todayStr).length > 0 && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Scissors size={10} />
                  Inclui {allProvasPend.filter(p => p.dataProva && p.dataProva < todayStr).length} prova(s) em atraso
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Area chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-bold text-rose-900 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Evolução Financeira
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradRecebido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPendente" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="recebido" stroke="#f43f5e" fill="url(#gradRecebido)" strokeWidth={2} name="recebido" />
              <Area type="monotone" dataKey="pendente" stroke="#fb923c" fill="url(#gradPendente)" strokeWidth={2} name="pendente" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 className="font-bold text-rose-900 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Por Forma de Pagamento
          </h3>
          {porForma.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sem dados no período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={porForma} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {porForma.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => v != null ? formatMoney(v) : ''} />
                <Legend iconSize={10} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-rose-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Lançamentos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Cliente</th>
                <th className="table-th">Descrição</th>
                <th className="table-th">Data</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Forma</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Status</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!temItensTabela ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Nenhum lançamento no período</p>
                  </td>
                </tr>
              ) : (
                <>
                  {/* ── Pagamentos manuais ── */}
                  {filteredPagamentos.slice().sort((a, b) => b.data.localeCompare(a.data)).map(p => {
                    const cliente = getCliente(p.clienteId);
                    const statusColor = p.status === 'pago' ? 'green' : p.status === 'vencido' ? 'red' : 'yellow';
                    const tipoLabel = tiposPagamento.find(t => t.value === p.tipo)?.label;
                    const formaLabel = formasPagamento.find(f => f.value === p.formaPagamento)?.label;
                    return (
                      <tr key={p.id} className="table-row">
                        <td className="table-td font-medium">{cliente?.nome || '—'}</td>
                        <td className="table-td text-gray-500">{p.descricao}</td>
                        <td className="table-td text-gray-500">{format(parseISO(p.data), 'dd/MM/yyyy')}</td>
                        <td className="table-td"><Badge variant="gray">{tipoLabel}</Badge></td>
                        <td className="table-td text-gray-500">{formaLabel || '—'}</td>
                        <td className="table-td font-semibold text-gray-900">{formatMoney(p.valor)}</td>
                        <td className="table-td">
                          <Badge variant={statusColor as 'green' | 'red' | 'yellow'}>
                            {p.status === 'pago' ? 'Pago' : p.status === 'vencido' ? 'Vencido' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="table-td">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* ── Separador de provas ── */}
                  {allProvasPend.length > 0 && (
                    <>
                      {filteredPagamentos.length > 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-2 bg-amber-50 border-t border-b border-amber-100">
                            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5 uppercase tracking-wide">
                              <Scissors size={11} /> Parcelas de Prova Pendentes
                            </span>
                          </td>
                        </tr>
                      )}

                      {/* ── Linhas de provas pendentes ── */}
                      {allProvasPend
                        .slice()
                        .sort((a, b) => (a.dataProva || '').localeCompare(b.dataProva || '') || a.numero - b.numero)
                        .map(p => {
                          const cliente = getCliente(p.clienteId);
                          const isOverdue = !!(p.dataProva && p.dataProva < todayStr);
                          const statusColor = isOverdue ? 'red' : 'yellow';
                          return (
                            <tr key={p.id} className="table-row bg-amber-50/30">
                              <td className="table-td font-medium">{cliente?.nome || '—'}</td>
                              <td className="table-td text-gray-500">
                                <span className="flex items-center gap-1.5">
                                  <Scissors size={12} className="text-amber-500 flex-shrink-0" />
                                  Parcela {p.numero} de prova
                                  {p.dataProva && (
                                    <span className="text-gray-400"> — {format(parseISO(p.dataProva), 'dd/MM/yyyy')}</span>
                                  )}
                                </span>
                              </td>
                              <td className="table-td text-gray-500">
                                {p.dataProva ? format(parseISO(p.dataProva), 'dd/MM/yyyy') : '—'}
                              </td>
                              <td className="table-td"><Badge variant="gray">Parcela</Badge></td>
                              <td className="table-td text-gray-400">—</td>
                              <td className="table-td font-semibold text-gray-900">{formatMoney(p.valorParcela)}</td>
                              <td className="table-td">
                                <Badge variant={statusColor as 'red' | 'yellow'}>
                                  {isOverdue ? 'Vencido' : 'Pendente'}
                                </Badge>
                              </td>
                              <td className="table-td">
                                <span className="text-xs text-gray-400 italic">Gerado em Provas</span>
                              </td>
                            </tr>
                          );
                        })}
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPag ? 'Editar Lançamento' : 'Novo Lançamento'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Cliente *</label>
              <select className="input-field" value={form.clienteId} onChange={f('clienteId')}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Descrição *</label>
              <input className="input-field" placeholder="Ex: Entrada do vestido principal" value={form.descricao} onChange={f('descricao')} />
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" step="0.01" className="input-field" placeholder="0,00" value={form.valor} onChange={f('valor')} />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" className="input-field" value={form.data} onChange={f('data')} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input-field" value={form.tipo} onChange={f('tipo')}>
                {tiposPagamento.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={f('status')}>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Forma de Pagamento</label>
              <select className="input-field" value={form.formaPagamento} onChange={f('formaPagamento')}>
                {formasPagamento.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center" disabled={!form.clienteId || !form.valor}>
              {editingPag ? 'Salvar' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
        <p className="text-gray-600 mb-6">Deseja excluir este lançamento?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={() => { deletePagamento(deleteConfirm!); setDeleteConfirm(null); }}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all justify-center inline-flex">
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
