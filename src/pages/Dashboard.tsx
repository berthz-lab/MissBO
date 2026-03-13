import React from 'react';
import { useNavigate } from 'react-router-dom';
import { fmtMoney, fmtTelefone } from '../utils/format';
import { Users, Calendar, Receipt, TrendingUp, Heart, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, isAfter, isBefore, addDays, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../components/ui/Badge';

const statusColors: Record<string, 'rose' | 'green' | 'yellow' | 'gray' | 'red'> = {
  lead: 'yellow',
  ativo: 'rose',
  concluido: 'green',
  cancelado: 'gray',
};

const tipoLabels: Record<string, string> = {
  consulta: 'Consulta',
  primeira_prova: '1ª Prova',
  segunda_prova: '2ª Prova',
  prova_final: 'Prova Final',
  ajuste: 'Ajuste',
  entrega: 'Entrega',
  reuniao: 'Reunião',
};

export function Dashboard() {
  const { clientes, agendamentos, pagamentos, fichasTecnicas, contratos } = useApp();
  const navigate = useNavigate();
  const getCliente = (id: string) => clientes.find(c => c.id === id);

  const today = new Date();

  // Stats
  const totalClientes = clientes.length;
  const ativas = clientes.filter(c => c.status === 'ativo').length;
  const leads = clientes.filter(c => c.status === 'lead').length;

  // Filtra apenas pagamentos cujo cliente ainda existe (evita valores fantasma após deleção)
  const clienteIds = new Set(clientes.map(c => c.id));
  const pagsValidos = pagamentos.filter(p => clienteIds.has(p.clienteId));

  const receitaTotal = pagsValidos.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0);
  const receitaMes = pagsValidos.filter(p => {
    if (p.status !== 'pago') return false;
    const d = parseISO(p.data);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).reduce((acc, p) => acc + p.valor, 0);

  const pendentes = pagsValidos.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.valor, 0);

  // Próximos agendamentos (7 dias)
  const proximosAgendamentos = agendamentos
    .filter(a => {
      const d = parseISO(a.data);
      return (isToday(d) || isAfter(d, today)) && isBefore(d, addDays(today, 8))
        && a.status !== 'cancelado' && a.status !== 'concluido';
    })
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
    .slice(0, 5);

  // Casamentos próximos
  const casamentosProximos = clientes
    .filter(c => c.dataCasamento && isAfter(parseISO(c.dataCasamento), today))
    .sort((a, b) => (a.dataCasamento || '').localeCompare(b.dataCasamento || ''))
    .slice(0, 3);

  const fichasEmAndamento = fichasTecnicas.filter(f => f.status !== 'concluida').length;

  const formatMoney = fmtMoney;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/clientes')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Clientes</p>
              <p className="text-3xl font-bold text-rose-900 mt-1">{totalClientes}</p>
              <p className="text-xs text-gray-400 mt-1">{ativas} ativas · {leads} leads</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Users size={20} className="text-rose-600" />
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/agenda')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Provas Hoje</p>
              <p className="text-3xl font-bold text-rose-900 mt-1">
                {agendamentos.filter(a => isToday(parseISO(a.data)) && a.status !== 'cancelado').length}
              </p>
              <p className="text-xs text-gray-400 mt-1">{fichasEmAndamento} peças em andamento</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/financeiro')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Receita do Mês</p>
              <p className="text-2xl font-bold text-rose-900 mt-1">{formatMoney(receitaMes)}</p>
              <p className="text-xs text-gray-400 mt-1">Total: {formatMoney(receitaTotal)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/financeiro')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">A Receber</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{formatMoney(pendentes)}</p>
              <p className="text-xs text-gray-400 mt-1">{pagsValidos.filter(p => p.status === 'pendente').length} pagamentos</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Receipt size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximos agendamentos */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-rose-900 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Próximas Provas & Eventos
            </h2>
            <button onClick={() => navigate('/agenda')} className="text-xs text-rose-600 hover:text-rose-800 font-medium">
              Ver agenda →
            </button>
          </div>
          {proximosAgendamentos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum evento nos próximos 7 dias</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proximosAgendamentos.map(ag => {
                const cliente = getCliente(ag.clienteId);
                const d = parseISO(ag.data);
                const isHoje = isToday(d);
                return (
                  <div key={ag.id} className={`flex items-center gap-4 p-3 rounded-xl border ${isHoje ? 'border-rose-200 bg-rose-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className={`text-center min-w-[48px] ${isHoje ? 'text-rose-700' : 'text-gray-600'}`}>
                      <p className="text-xs font-semibold uppercase">
                        {format(d, 'EEE', { locale: ptBR })}
                      </p>
                      <p className="text-xl font-bold leading-tight">{format(d, 'd')}</p>
                      <p className="text-xs">{ag.hora}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">
                        {cliente?.nome || 'Cliente'}
                      </p>
                      <p className="text-xs text-gray-500">{tipoLabels[ag.tipo]}</p>
                    </div>
                    {isHoje && (
                      <span className="flex-shrink-0 text-xs bg-rose-600 text-white px-2 py-0.5 rounded-full font-medium">
                        Hoje
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Casamentos próximos */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-rose-900 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Casamentos Próximos
            </h2>
            <button onClick={() => navigate('/clientes')} className="text-xs text-rose-600 hover:text-rose-800 font-medium">
              Ver clientes →
            </button>
          </div>
          {casamentosProximos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Heart size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum casamento agendado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {casamentosProximos.map(c => {
                const diasRestantes = Math.ceil(
                  (parseISO(c.dataCasamento!).getTime() - today.getTime()) / 86400000
                );
                const urgente = diasRestantes <= 30;
                return (
                  <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-rose-200 transition-colors cursor-pointer"
                    onClick={() => navigate(`/clientes/${c.id}`)}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${urgente ? 'bg-red-100' : 'bg-rose-100'}`}>
                      <Heart size={20} className={urgente ? 'text-red-600' : 'text-rose-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800">{c.nome}</p>
                      <p className="text-xs text-gray-500">
                        {format(parseISO(c.dataCasamento!), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className={`text-right flex-shrink-0 ${urgente ? 'text-red-700' : 'text-rose-700'}`}>
                      <p className="text-2xl font-bold leading-tight">{diasRestantes}</p>
                      <p className="text-xs">dias</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clientes recentes */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-rose-900 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Clientes Recentes
            </h2>
            <button onClick={() => navigate('/clientes')} className="text-xs text-rose-600 hover:text-rose-800 font-medium">
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Nome</th>
                  <th className="table-th">Contato</th>
                  <th className="table-th">Casamento</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {clientes.slice(0, 5).map(c => (
                  <tr key={c.id} className="table-row cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                    <td className="table-td font-medium text-gray-900">{c.nome}</td>
                    <td className="table-td text-gray-500">{fmtTelefone(c.telefone)}</td>
                    <td className="table-td text-gray-500">
                      {c.dataCasamento
                        ? format(parseISO(c.dataCasamento), "dd/MM/yyyy")
                        : '—'}
                    </td>
                    <td className="table-td">
                      <Badge variant={statusColors[c.status] || 'gray'}>
                        {c.status === 'lead' ? 'Lead' :
                          c.status === 'ativo' ? 'Ativo' :
                            c.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
