import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Phone, Mail, MapPin, Heart, Calendar, Plus, Trash2,
  FileText, Receipt, BarChart3, Image, Ruler, Clock, CheckCircle2,
  Save, X, Printer, Upload, Star, ChevronRight, AlertCircle,
  Scissors, DollarSign, AlertTriangle, CalendarDays, Navigation, Car, Fuel,
  Instagram,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { genId } from '../utils/storage';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import {
  Cliente, MedidasNoiva, Contrato, Orcamento, ItemOrcamento,
  Agendamento, TipoAgendamento, Pagamento, Inspiracao, CategoriaInspiracao,
  ParcelaProva, FormaPagamentoProva
} from '../types';
import { format, parseISO, isAfter, differenceInDays, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ── helpers ─────────────────────────────────────────────────────────── */
const fmt = (d: string) => format(parseISO(d), 'dd/MM/yyyy');
const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function mapsRouteUrl(origin: string, destination: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}
function mapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

const statusClienteOpt = [
  { value: 'lead',      label: 'Lead',      color: 'yellow' as const },
  { value: 'ativo',     label: 'Ativo',     color: 'rose'   as const },
  { value: 'concluido', label: 'Concluído', color: 'green'  as const },
  { value: 'cancelado', label: 'Cancelado', color: 'gray'   as const },
];

const tiposAg: { value: TipoAgendamento; label: string }[] = [
  { value: 'consulta',       label: 'Consulta Inicial' },
  { value: 'primeira_prova', label: '1ª Prova' },
  { value: 'segunda_prova',  label: '2ª Prova' },
  { value: 'prova_final',    label: 'Prova Final' },
  { value: 'ajuste',         label: 'Ajuste' },
  { value: 'entrega',        label: 'Entrega' },
  { value: 'reuniao',        label: 'Reunião' },
];

const statusAg = [
  { value: 'agendado',   label: 'Agendado',   color: 'yellow' as const },
  { value: 'confirmado', label: 'Confirmado', color: 'blue'   as const },
  { value: 'concluido',  label: 'Concluído',  color: 'green'  as const },
  { value: 'cancelado',  label: 'Cancelado',  color: 'gray'   as const },
];

const statusContrato = [
  { value: 'rascunho',     label: 'Rascunho',     color: 'gray'   as const },
  { value: 'assinado',     label: 'Assinado',     color: 'blue'   as const },
  { value: 'em_andamento', label: 'Em Andamento', color: 'yellow' as const },
  { value: 'concluido',    label: 'Concluído',    color: 'green'  as const },
  { value: 'cancelado',    label: 'Cancelado',    color: 'gray'   as const },
];

const statusOrc = [
  { value: 'pendente',  label: 'Pendente',  color: 'yellow' as const },
  { value: 'aprovado',  label: 'Aprovado',  color: 'green'  as const },
  { value: 'recusado',  label: 'Recusado',  color: 'red'    as const },
  { value: 'expirado',  label: 'Expirado',  color: 'gray'   as const },
];

const formasPag = [
  { value: 'pix',             label: 'PIX' },
  { value: 'dinheiro',        label: 'Dinheiro' },
  { value: 'cartao_credito',  label: 'Cartão Crédito' },
  { value: 'cartao_debito',   label: 'Cartão Débito' },
  { value: 'transferencia',   label: 'Transferência' },
];

const categoriaInsps: { value: CategoriaInspiracao; label: string }[] = [
  { value: 'vestido',   label: 'Vestido' },
  { value: 'acessorio', label: 'Acessório' },
  { value: 'penteado',  label: 'Penteado' },
  { value: 'maquiagem', label: 'Maquiagem' },
  { value: 'decoracao', label: 'Decoração' },
  { value: 'bouquet',   label: 'Bouquet' },
  { value: 'outro',     label: 'Outro' },
];

const camposMedidas = [
  { key: 'busto',             label: 'Busto',              grupo: 'Superior' },
  { key: 'cavaAcavasCostas',  label: 'Cava a cavas costas',grupo: 'Superior' },
  { key: 'cavaAcavasFrente',  label: 'Cava a cavas frente',grupo: 'Superior' },
  { key: 'abaixoDoBusto',     label: 'Abaixo do busto',    grupo: 'Superior' },
  { key: 'separacaoBusto',    label: 'Separação do busto', grupo: 'Superior' },
  { key: 'colarinho',         label: 'Colarinho',          grupo: 'Superior' },
  { key: 'ombroAOmbro',       label: 'Ombro a ombro',      grupo: 'Superior' },
  { key: 'ombro',             label: 'Ombro',              grupo: 'Superior' },
  { key: 'cintura',           label: 'Cintura',            grupo: 'Central' },
  { key: 'altBusto',          label: 'Alt. busto',         grupo: 'Central' },
  { key: 'altCentroFrente',   label: 'Alt. centro frente', grupo: 'Central' },
  { key: 'altOmbroFrente',    label: 'Alt. ombro frente',  grupo: 'Central' },
  { key: 'altOmbroCostas',    label: 'Alt. ombro costas',  grupo: 'Central' },
  { key: 'altCentroCostas',   label: 'Alt. centro costas', grupo: 'Central' },
  { key: 'altGanchoFrente',   label: 'Alt. gancho frente', grupo: 'Central' },
  { key: 'quadril',           label: 'Quadril',            grupo: 'Inferior' },
  { key: 'altQuadril',        label: 'Alt. quadril',       grupo: 'Inferior' },
  { key: 'altDesejadaSaia',   label: 'Alt. desejada saia', grupo: 'Inferior' },
  { key: 'altCinturaAoJoelho',label: 'Cintura ao joelho',  grupo: 'Inferior' },
  { key: 'largJoelho',        label: 'Larg. joelho',       grupo: 'Inferior' },
  { key: 'alturaLateral',     label: 'Altura lateral',     grupo: 'Inferior' },
  { key: 'punho',             label: 'Punho',              grupo: 'Braços' },
  { key: 'largBraco',         label: 'Larg. braço',        grupo: 'Braços' },
  { key: 'cumprimentoBraco',  label: 'Cumprimento braço',  grupo: 'Braços' },
  { key: 'altManga34',        label: 'Alt. manga 3/4',     grupo: 'Braços' },
  { key: 'alturaMangaCurta',  label: 'Manga curta',        grupo: 'Braços' },
] as const;

type MedidaKey = typeof camposMedidas[number]['key'];

const grupoColors: Record<string, string> = {
  Superior: 'bg-gray-900 text-white',
  Central:  'bg-gray-700 text-white',
  Inferior: 'bg-gray-500 text-white',
  Braços:   'border border-gray-300 text-gray-700',
};

/* ─────────────────────────────────────────────────────────────── */
type Tab = 'info' | 'medidas' | 'contratos' | 'orcamentos' | 'provas' | 'agenda' | 'financeiro' | 'inspiracoes';

export function ClientePerfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const app = useApp();
  const { custoPorKm, config } = app;
  const cliente = app.getCliente(id!);

  const [tab, setTab] = useState<Tab>('info');

  // ── Edit cliente modal ──────────────────────────────────────────
  const [editClienteOpen, setEditClienteOpen] = useState(false);
  const [clienteForm, setClienteForm] = useState<Partial<Cliente>>({});

  // ── Medidas ─────────────────────────────────────────────────────
  const [medidaOpen, setMedidaOpen] = useState(false);
  const [editMedida, setEditMedida] = useState<MedidasNoiva | null>(null);
  const [medidaForm, setMedidaForm] = useState<Record<string, string>>({});

  // ── Contratos ───────────────────────────────────────────────────
  const [contratoOpen, setContratoOpen]   = useState(false);
  const [editContrato, setEditContrato]   = useState<Contrato | null>(null);
  const [contratoForm, setContratoForm]   = useState<Record<string, string>>({});
  const contratoFileRef = useRef<HTMLInputElement>(null);
  const [contratoAnexo, setContratoAnexo] = useState<{base64: string; nome: string; tipo: string} | null>(null);

  // ── Orçamentos ──────────────────────────────────────────────────
  const [orcOpen, setOrcOpen]     = useState(false);
  const [editOrc, setEditOrc]     = useState<Orcamento | null>(null);
  const [orcForm, setOrcForm]     = useState<Record<string, string>>({});
  const [orcItens, setOrcItens]   = useState<ItemOrcamento[]>([]);

  // ── Agendamentos ────────────────────────────────────────────────
  const [agOpen, setAgOpen]   = useState(false);
  const [editAg, setEditAg]   = useState<Agendamento | null>(null);
  const [agForm, setAgForm]   = useState<Record<string, string>>({});

  // ── Pagamentos ──────────────────────────────────────────────────
  const [pagOpen, setPagOpen] = useState(false);
  const [editPag, setEditPag] = useState<Pagamento | null>(null);
  const [pagForm, setPagForm] = useState<Record<string, string>>({});

  // ── Inspirações ─────────────────────────────────────────────────
  const [inspOpen, setInspOpen]   = useState(false);
  const [inspForm, setInspForm]   = useState<Record<string, string>>({});
  const [inspImagem, setInspImagem] = useState('');
  const [lightbox, setLightbox]   = useState<Inspiracao | null>(null);
  const inspFileRef = useRef<HTMLInputElement>(null);

  // ── Provas ──────────────────────────────────────────────────────
  const [provaDataModal, setProvaDataModal] = useState<ParcelaProva | null>(null);
  const [provaDataForm, setProvaDataForm]   = useState({ dataProva: '', horaProva: '10:00' });
  const [provaPagModal, setProvaPagModal]   = useState<ParcelaProva | null>(null);
  const [provaPagForm, setProvaPagForm]     = useState({
    dataPagamento: new Date().toISOString().split('T')[0],
    formaPagamento: 'pix' as FormaPagamentoProva,
    valorPago: '',
    observacoes: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{type: string; id: string} | null>(null);

  if (!cliente) return <Navigate to="/clientes" replace />;

  /* ── data ──────────────────────────────────────────────────────── */
  const medidas    = app.getMedidasByCliente(id!);
  const contratos  = app.getContratosByCliente(id!);
  const orcamentos = app.getOrcamentosByCliente(id!);
  const agendamentos = app.getAgendamentosByCliente(id!);
  const pagamentos = app.getPagamentosByCliente(id!);
  const parcelasProva = app.getParcelasProvaByCliente(id!);
  const inspiracoes = app.getInspiracoesCliente(id!);

  const diasCasamento = cliente.dataCasamento
    ? differenceInDays(parseISO(cliente.dataCasamento), new Date())
    : null;

  const hojeStr = new Date().toISOString().split('T')[0];
  const tiposProvaAg: TipoAgendamento[] = ['primeira_prova', 'segunda_prova', 'prova_final', 'ajuste'];
  const proximaProva = agendamentos
    .filter(a => tiposProvaAg.includes(a.tipo) && a.data >= hojeStr && a.status !== 'cancelado' && a.status !== 'concluido')
    .sort((a, b) => a.data.localeCompare(b.data))[0] ?? null;
  const diasProxProva = proximaProva
    ? differenceInDays(parseISO(proximaProva.data), new Date())
    : null;

  const whatsappUrl = (tel: string) => `https://wa.me/55${tel.replace(/\D/g, '')}`;
  const proxProvaLabel = proximaProva ? (tiposAg.find(t => t.value === proximaProva.tipo)?.label ?? 'Prova') : '';

  const recebido = pagamentos.filter(p => p.status === 'pago').reduce((a, p) => a + p.valor, 0);
  // "A receber" = pagamentos manuais pendentes + parcelas de prova ainda não pagas
  const pendentePag    = pagamentos.filter(p => p.status !== 'pago').reduce((a, p) => a + p.valor, 0);
  const pendenteProvas = parcelasProva
    .filter(p => !p.pago && p.statusProva !== 'cancelada')
    .reduce((a, p) => a + p.valorParcela, 0);
  const pendente = pendentePag + pendenteProvas;
  const totalContrato = contratos.reduce((a, c) => a + c.valorTotal, 0);

  /* Provas: alertas de atraso */
  const provasAtrasadas = parcelasProva.filter(p => {
    if (p.pago || p.statusProva === 'cancelada') return false;
    // Pagamento atrasado: prova realizada mas não paga
    if (p.statusProva === 'realizada') return true;
    // Data da prova já passou e ainda pendente/agendada
    if (p.dataProva && isPast(parseISO(p.dataProva)) && !isToday(parseISO(p.dataProva))) return true;
    return false;
  });

  /* ── handlers: cliente ─────────────────────────────────────────── */
  const openEditCliente = () => {
    setClienteForm({ ...cliente, endereco: cliente.endereco || '', distanciaKm: cliente.distanciaKm });
    setEditClienteOpen(true);
  };
  const saveCliente = () => {
    app.saveCliente({ ...cliente, ...clienteForm } as Cliente);
    setEditClienteOpen(false);
  };

  /* ── handlers: medidas ─────────────────────────────────────────── */
  const openNewMedida = () => {
    setEditMedida(null);
    setMedidaForm({ data: new Date().toISOString().split('T')[0], observacoes: '' });
    setMedidaOpen(true);
  };
  const openEditMedida = (m: MedidasNoiva) => {
    setEditMedida(m);
    const f: Record<string, string> = { data: m.data, observacoes: m.observacoes || '' };
    camposMedidas.forEach(({ key }) => { if ((m as any)[key]) f[key] = String((m as any)[key]); });
    setMedidaForm(f);
    setMedidaOpen(true);
  };
  const saveMedida = () => {
    const m: MedidasNoiva = {
      id: editMedida?.id || genId(), clienteId: id!,
      data: medidaForm.data, observacoes: medidaForm.observacoes || '',
      createdAt: editMedida?.createdAt || new Date().toISOString(),
    };
    camposMedidas.forEach(({ key }) => {
      if (medidaForm[key]) (m as any)[key] = Number(medidaForm[key]);
    });
    app.saveMedidas(m);
    setMedidaOpen(false);
  };

  /* ── handlers: contratos ───────────────────────────────────────── */
  const openNewContrato = () => {
    setEditContrato(null);
    setContratoAnexo(null);
    setContratoForm({ dataAssinatura: new Date().toISOString().split('T')[0], dataEntrega: '', valorTotal: '', valorEntrada: '0', quantidadeProvas: '', status: 'rascunho', descricaoPecas: '', clausulasEspeciais: '' });
    setContratoOpen(true);
  };
  const openEditContrato = (c: Contrato) => {
    setEditContrato(c);
    setContratoAnexo(c.anexoBase64 ? { base64: c.anexoBase64, nome: c.anexoNome!, tipo: c.anexoTipo! } : null);
    setContratoForm({ dataAssinatura: c.dataAssinatura, dataEntrega: c.dataEntrega, valorTotal: String(c.valorTotal), valorEntrada: String(c.valorEntrada), quantidadeProvas: String(c.quantidadeProvas || ''), status: c.status, descricaoPecas: c.descricaoPecas, clausulasEspeciais: c.clausulasEspeciais || '' });
    setContratoOpen(true);
  };
  const handleContratoAnexo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande. Máximo 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setContratoAnexo({ base64: ev.target!.result as string, nome: file.name, tipo: file.type });
    reader.readAsDataURL(file);
  };
  const saveContrato = () => {
    const c: Contrato = {
      id: editContrato?.id || genId(), clienteId: id!,
      numero: editContrato?.numero || app.nextNumeroContrato(),
      dataAssinatura: contratoForm.dataAssinatura,
      dataEntrega: contratoForm.dataEntrega,
      valorTotal: Number(contratoForm.valorTotal),
      valorEntrada: Number(contratoForm.valorEntrada),
      quantidadeProvas: contratoForm.quantidadeProvas ? Number(contratoForm.quantidadeProvas) : undefined,
      status: contratoForm.status as Contrato['status'],
      descricaoPecas: contratoForm.descricaoPecas,
      clausulasEspeciais: contratoForm.clausulasEspeciais || undefined,
      anexoBase64: contratoAnexo?.base64,
      anexoNome: contratoAnexo?.nome,
      anexoTipo: contratoAnexo?.tipo,
      createdAt: editContrato?.createdAt || new Date().toISOString(),
    };
    app.saveContrato(c);
    setContratoOpen(false);
  };

  /* ── handlers: orçamentos ──────────────────────────────────────── */
  const openNewOrc = () => {
    setEditOrc(null);
    setOrcForm({ data: new Date().toISOString().split('T')[0], validade: '', desconto: '0', status: 'pendente', observacoes: '' });
    setOrcItens([{ id: genId(), descricao: '', quantidade: 1, valorUnitario: 0 }]);
    setOrcOpen(true);
  };
  const openEditOrc = (o: Orcamento) => {
    setEditOrc(o);
    setOrcForm({ data: o.data, validade: o.validade, desconto: String(o.desconto), status: o.status, observacoes: o.observacoes || '' });
    setOrcItens(o.itens);
    setOrcOpen(true);
  };
  const saveOrc = () => {
    const o: Orcamento = {
      id: editOrc?.id || genId(), clienteId: id!,
      numero: editOrc?.numero || app.nextNumeroOrcamento(),
      data: orcForm.data, validade: orcForm.validade, itens: orcItens,
      desconto: Number(orcForm.desconto), status: orcForm.status as Orcamento['status'],
      observacoes: orcForm.observacoes || undefined,
      createdAt: editOrc?.createdAt || new Date().toISOString(),
    };
    app.saveOrcamento(o);
    setOrcOpen(false);
  };
  const orcSubtotal = orcItens.reduce((a, i) => a + i.quantidade * i.valorUnitario, 0);
  const orcTotal    = orcSubtotal - (Number(orcForm.desconto) || 0);

  /* ── handlers: agendamentos ────────────────────────────────────── */
  const openNewAg = () => {
    setEditAg(null);
    setAgForm({ tipo: 'consulta', data: new Date().toISOString().split('T')[0], hora: '10:00', duracao: '60', descricao: '', status: 'agendado' });
    setAgOpen(true);
  };
  const openEditAg = (a: Agendamento) => {
    setEditAg(a);
    setAgForm({ tipo: a.tipo, data: a.data, hora: a.hora, duracao: String(a.duracao), descricao: a.descricao || '', status: a.status });
    setAgOpen(true);
  };
  const saveAg = () => {
    const a: Agendamento = {
      id: editAg?.id || genId(), clienteId: id!,
      tipo: agForm.tipo as TipoAgendamento, data: agForm.data, hora: agForm.hora,
      duracao: Number(agForm.duracao), descricao: agForm.descricao || undefined,
      status: agForm.status as Agendamento['status'],
      createdAt: editAg?.createdAt || new Date().toISOString(),
    };
    app.saveAgendamento(a);
    setAgOpen(false);
  };

  /* ── handlers: pagamentos ──────────────────────────────────────── */
  const openNewPag = () => {
    setEditPag(null);
    setPagForm({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0], tipo: 'entrada', status: 'pago', formaPagamento: 'pix' });
    setPagOpen(true);
  };
  const openEditPag = (p: Pagamento) => {
    setEditPag(p);
    setPagForm({ descricao: p.descricao, valor: String(p.valor), data: p.data, tipo: p.tipo, status: p.status, formaPagamento: p.formaPagamento || 'pix' });
    setPagOpen(true);
  };
  const savePag = () => {
    const p: Pagamento = {
      id: editPag?.id || genId(), clienteId: id!,
      descricao: pagForm.descricao, valor: Number(pagForm.valor), data: pagForm.data,
      tipo: pagForm.tipo as Pagamento['tipo'], status: pagForm.status as Pagamento['status'],
      formaPagamento: pagForm.formaPagamento as Pagamento['formaPagamento'],
      createdAt: editPag?.createdAt || new Date().toISOString(),
    };
    app.savePagamento(p);
    setPagOpen(false);
  };

  /* ── handlers: provas ──────────────────────────────────────────── */
  const openProvaData = (p: ParcelaProva) => {
    setProvaDataModal(p);
    setProvaDataForm({ dataProva: p.dataProva || '', horaProva: p.horaProva || '10:00' });
  };
  const saveProvaData = () => {
    if (!provaDataModal) return;
    const updated: ParcelaProva = {
      ...provaDataModal,
      dataProva: provaDataForm.dataProva || undefined,
      horaProva: provaDataForm.horaProva || undefined,
      statusProva: provaDataForm.dataProva ? 'agendada' : 'pendente',
    };
    app.saveParcelaProva(updated);
    setProvaDataModal(null);
  };
  const marcarProvaRealizada = (p: ParcelaProva) => {
    app.saveParcelaProva({ ...p, statusProva: 'realizada' });
  };
  const openProvaPag = (p: ParcelaProva) => {
    setProvaPagModal(p);
    // Pre-fill from existing data when editing a paid prova
    setProvaPagForm({
      dataPagamento: p.dataPagamento || new Date().toISOString().split('T')[0],
      formaPagamento: (p.formaPagamento || 'pix') as FormaPagamentoProva,
      valorPago: p.pago ? String(p.valorPago ?? p.valorParcela) : '',
      observacoes: p.observacoes || '',
    });
  };
  const saveProvaPag = () => {
    if (!provaPagModal) return;
    const valorEfetivo = provaPagForm.valorPago ? Number(provaPagForm.valorPago) : undefined;
    app.saveParcelaProva({
      ...provaPagModal,
      pago: true,
      dataPagamento: provaPagForm.dataPagamento,
      formaPagamento: provaPagForm.formaPagamento,
      valorPago: valorEfetivo,
      observacoes: provaPagForm.observacoes || undefined,
      statusProva: provaPagModal.statusProva === 'pendente' || provaPagModal.statusProva === 'agendada'
        ? 'realizada'
        : provaPagModal.statusProva,
    });
    setProvaPagModal(null);
  };
  const cancelarPagamentoProva = (p: ParcelaProva) => {
    app.saveParcelaProva({ ...p, pago: false, dataPagamento: undefined, formaPagamento: undefined });
  };

  /* ── handlers: inspirações ─────────────────────────────────────── */
  const openNewInsp = () => {
    setInspForm({ titulo: '', categoria: 'vestido', imagemUrl: '', observacoes: '' });
    setInspImagem('');
    setInspOpen(true);
  };
  const saveInsp = () => {
    const i: Inspiracao = {
      id: genId(), clienteId: id!, titulo: inspForm.titulo,
      categoria: inspForm.categoria as CategoriaInspiracao,
      imagemBase64: inspImagem || undefined, imagemUrl: inspForm.imagemUrl || undefined,
      observacoes: inspForm.observacoes || undefined, favorito: false,
      createdAt: new Date().toISOString(),
    };
    app.saveInspiracao(i);
    setInspOpen(false);
  };

  /* ── delete ─────────────────────────────────────────────────────── */
  const handleDelete = () => {
    if (!deleteConfirm) return;
    const { type, id: did } = deleteConfirm;
    if (type === 'medida')    app.deleteMedidas(did);
    if (type === 'contrato')  app.deleteContrato(did);
    if (type === 'orcamento') app.deleteOrcamento(did);
    if (type === 'agendamento') app.deleteAgendamento(did);
    if (type === 'pagamento') app.deletePagamento(did);
    if (type === 'inspiracao') app.deleteInspiracao(did);
    setDeleteConfirm(null);
  };

  /* ── print orçamento ────────────────────────────────────────────── */
  const printOrc = (o: Orcamento) => {
    const sub = o.itens.reduce((a, i) => a + i.quantidade * i.valorUnitario, 0);
    const tot = sub - o.desconto;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Orçamento ${o.numero}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Georgia',serif;color:#1a1a1a;background:#fff;padding:0}
      .page{max-width:800px;margin:0 auto;padding:60px 50px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:30px;border-bottom:1px solid #e0e0e0;margin-bottom:36px}
      .brand h1{font-size:28px;letter-spacing:8px;font-weight:bold}
      .brand .gold{color:#C9A96E}
      .brand p{font-size:10px;letter-spacing:5px;color:#999;margin-top:4px}
      .doc-info{text-align:right}
      .doc-info .doc-num{font-size:22px;font-weight:bold;color:#0A0A0A}
      .doc-info .doc-label{font-size:10px;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:4px}
      .doc-info .doc-date{font-size:12px;color:#666;margin-top:6px}
      .client-box{background:#f9f8f6;border-left:3px solid #C9A96E;padding:20px 24px;margin-bottom:36px;border-radius:0 8px 8px 0}
      .client-box h3{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:8px}
      .client-box .name{font-size:18px;font-weight:bold;color:#0A0A0A}
      .client-box .contact{font-size:13px;color:#666;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      thead tr{border-top:2px solid #0A0A0A;border-bottom:1px solid #e0e0e0}
      th{padding:12px 16px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;font-family:inherit}
      th:last-child,td:last-child{text-align:right}
      td{padding:14px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333}
      tbody tr:hover{background:#fafafa}
      .totals{margin-left:auto;width:280px}
      .total-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#666;border-bottom:1px solid #f0f0f0}
      .total-row:last-child{border:none;font-size:17px;font-weight:bold;color:#0A0A0A;padding-top:14px;border-top:2px solid #0A0A0A;margin-top:6px}
      .total-row .gold-val{color:#C9A96E}
      .footer-section{margin-top:60px;display:flex;justify-content:space-between;align-items:flex-end}
      .obs-box{max-width:55%;font-size:12px;color:#888;line-height:1.6;font-style:italic}
      .validity{font-size:12px;color:#888}
      .sig-area{text-align:center}
      .sig-line{display:inline-block;width:200px;border-top:1px solid #0A0A0A;padding-top:8px;font-size:11px;color:#888;margin-top:60px;letter-spacing:1px}
      .watermark{text-align:center;margin-top:50px;font-size:10px;letter-spacing:4px;color:#e0e0e0;text-transform:uppercase}
    </style></head><body><div class="page">
    <div class="header">
      <div class="brand">
        <h1>MISS<span class="gold">BO</span></h1>
        <p>HAUTE COUTURE</p>
      </div>
      <div class="doc-info">
        <p class="doc-label">Orçamento</p>
        <p class="doc-num">${o.numero}</p>
        <p class="doc-date">Emitido em ${fmt(o.data)}</p>
        ${o.validade ? `<p class="doc-date">Válido até ${fmt(o.validade)}</p>` : ''}
      </div>
    </div>
    <div class="client-box">
      <h3>Cliente</h3>
      <p class="name">${cliente.nome}</p>
      <p class="contact">${cliente.telefone}${cliente.email ? ' · ' + cliente.email : ''}</p>
    </div>
    <table>
      <thead><tr>
        <th>Descrição</th><th style="width:70px">Qtd</th>
        <th style="width:130px">Valor Unit.</th><th style="width:130px">Total</th>
      </tr></thead>
      <tbody>
        ${o.itens.map(i => `<tr>
          <td>${i.descricao}</td>
          <td style="text-align:center">${i.quantidade}</td>
          <td style="text-align:right">${fmtMoney(i.valorUnitario)}</td>
          <td style="text-align:right">${fmtMoney(i.quantidade * i.valorUnitario)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${fmtMoney(sub)}</span></div>
      ${o.desconto > 0 ? `<div class="total-row"><span>Desconto</span><span style="color:#dc2626">− ${fmtMoney(o.desconto)}</span></div>` : ''}
      <div class="total-row"><span>Total</span><span class="gold-val">${fmtMoney(tot)}</span></div>
    </div>
    <div class="footer-section">
      <div>
        ${o.observacoes ? `<div class="obs-box"><strong>Observações:</strong><br>${o.observacoes}</div>` : ''}
        <p class="validity" style="margin-top:12px">Este orçamento é válido até ${o.validade ? fmt(o.validade) : 'a combinar'}.</p>
      </div>
      <div class="sig-area">
        <div class="sig-line">MissBO — Haute Couture</div>
      </div>
    </div>
    <div class="watermark">MissBO · Haute Couture</div>
    </div></body></html>`);
    win.document.close();
    win.print();
  };

  /* ── tabs config ────────────────────────────────────────────────── */
  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number; alert?: boolean }[] = [
    { key: 'info',        label: 'Informações', icon: <FileText size={15} /> },
    { key: 'medidas',     label: 'Medidas',     icon: <Ruler size={15} />,         count: medidas.length },
    { key: 'contratos',   label: 'Contratos',   icon: <FileText size={15} />,       count: contratos.length },
    { key: 'orcamentos',  label: 'Orçamentos',  icon: <Receipt size={15} />,        count: orcamentos.length },
    { key: 'provas',      label: 'Provas',      icon: <Scissors size={15} />,       count: parcelasProva.length, alert: provasAtrasadas.length > 0 },
    { key: 'agenda',      label: 'Agenda',      icon: <Calendar size={15} />,       count: agendamentos.length },
    { key: 'financeiro',  label: 'Financeiro',  icon: <BarChart3 size={15} /> },
    { key: 'inspiracoes', label: 'Inspirações', icon: <Image size={15} />,          count: inspiracoes.length },
  ];

  const statusOpt = statusClienteOpt.find(s => s.value === cliente.status);

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Back ─────────────────────────────────────────────────── */}
      <button onClick={() => navigate('/clientes')}
              className="btn-ghost mb-6 -ml-1">
        <ArrowLeft size={16} /> Voltar para Clientes
      </button>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="card mb-6 p-0 overflow-hidden">
        {/* banner */}
        <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #2D2D2D 60%, #4A4A4A 100%)' }}>
          <div className="absolute inset-0 opacity-10"
               style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #C9A96E 0%, transparent 60%)' }} />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-card flex items-center justify-center text-2xl font-bold text-white"
                 style={{ background: '#0A0A0A' }}>
              {cliente.nome.charAt(0)}
            </div>
            <button onClick={openEditCliente} className="btn-secondary mt-12">
              <Edit2 size={14} /> Editar
            </button>
          </div>

          {/* Nome + badge */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>
              {cliente.nome}
            </h1>
            <Badge variant={statusOpt?.color || 'gray'}>{statusOpt?.label}</Badge>
          </div>

          {/* Contatos clicáveis */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500">
            <a href={whatsappUrl(cliente.telefone)} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
              <Phone size={13} />{cliente.telefone}
            </a>
            {cliente.email && (
              <a href={`mailto:${cliente.email}`}
                 className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                <Mail size={13} />{cliente.email}
              </a>
            )}
            {cliente.instagram && (
              <a href={`https://instagram.com/${cliente.instagram.replace('@', '')}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 hover:text-pink-500 transition-colors">
                <Instagram size={13} />{cliente.instagram}
              </a>
            )}
            {cliente.local && (
              <span className="flex items-center gap-1.5"><MapPin size={13} />{cliente.local}</span>
            )}
            {cliente.dataCasamento && (
              <span className="flex items-center gap-1.5">
                <Heart size={13} className="text-red-400" />{fmt(cliente.dataCasamento)}
              </span>
            )}
          </div>

          {/* Countdown cards — linha própria para não sobrepor */}
          {(diasCasamento !== null && diasCasamento >= 0) || proximaProva !== null ? (
            <div className="flex gap-2 mt-3">
              {diasCasamento !== null && diasCasamento >= 0 && (
                <div className="flex-1 text-center rounded-2xl border border-gray-200 px-3 py-2.5 bg-gray-50 min-w-0">
                  <p className="text-2xl font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {diasCasamento}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">dias p/ casamento</p>
                </div>
              )}
              <div className={`flex-1 text-center rounded-2xl border px-3 py-2.5 min-w-0 ${
                proximaProva
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-gray-100 bg-gray-50/60'
              }`}>
                {proximaProva ? (
                  <>
                    <p className="text-2xl font-bold text-rose-700" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {diasProxProva === 0 ? '🗓' : diasProxProva}
                    </p>
                    <p className="text-xs text-rose-400 mt-0.5 leading-tight">
                      {diasProxProva === 0 ? `${proxProvaLabel} hoje!` : `dias p/ ${proxProvaLabel}`}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-0.5">
                    <Calendar size={14} className="text-gray-300 mb-1" />
                    <p className="text-xs text-gray-400 leading-tight">sem provas</p>
                    <p className="text-xs text-gray-300 leading-tight">marcadas</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Quick KPIs */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-brand-black">{fmtMoney(recebido)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Recebido</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-600">{fmtMoney(pendente)}</p>
              <p className="text-xs text-gray-400 mt-0.5">A receber</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-brand-black">{fmtMoney(totalContrato)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total contrato</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl p-1.5 shadow-card border border-gray-100 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    tab === t.key
                      ? 'bg-brand-black text-white shadow-sm'
                      : 'text-gray-500 hover:text-brand-black hover:bg-gray-50'
                  }`}>
            {t.icon}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {t.count}
              </span>
            )}
            {t.alert && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB: Informações ══════════════════════════════════════ */}
      {tab === 'info' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>
              Informações da Cliente
            </h2>
            <button onClick={openEditCliente} className="btn-secondary text-sm">
              <Edit2 size={14} /> Editar
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Nome completo', value: cliente.nome },
              { label: 'CPF', value: cliente.cpf || '—' },
              { label: 'Data do 1º contato', value: fmt(cliente.dataContato) },
              { label: 'Data do casamento', value: cliente.dataCasamento ? fmt(cliente.dataCasamento) : '—' },
              { label: 'Local do casamento', value: cliente.local || '—' },
              { label: 'Como nos conheceu', value: cliente.indicacao || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-medium text-brand-charcoal">{value}</p>
              </div>
            ))}
            {/* Telefone clicável */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Telefone / WhatsApp</p>
              <a href={whatsappUrl(cliente.telefone)} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 transition-colors">
                <Phone size={13} />{cliente.telefone}
              </a>
            </div>
            {/* E-mail clicável */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">E-mail</p>
              {cliente.email ? (
                <a href={`mailto:${cliente.email}`}
                   className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors">
                  <Mail size={13} />{cliente.email}
                </a>
              ) : <p className="text-sm font-medium text-brand-charcoal">—</p>}
            </div>
            {/* Instagram clicável */}
            {cliente.instagram && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Instagram</p>
                <a href={`https://instagram.com/${cliente.instagram.replace('@', '')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">
                  <Instagram size={13} />{cliente.instagram}
                </a>
              </div>
            )}
            {/* Endereço com navegação */}
            {cliente.endereco && (
              <div className="sm:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MapPin size={11}/> Endereço para visita
                </p>
                <p className="text-sm font-medium text-brand-charcoal mb-2">{cliente.endereco}</p>
                <div className="flex flex-wrap gap-2">
                  {config.enderecoOrigem ? (
                    <a
                      href={mapsRouteUrl(config.enderecoOrigem, cliente.endereco)}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Navigation size={11}/> Traçar Rota
                    </a>
                  ) : (
                    <a
                      href={mapsSearchUrl(cliente.endereco)}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Navigation size={11}/> Ver no Maps
                    </a>
                  )}
                  {cliente.distanciaKm && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
                      <Car size={11}/> {cliente.distanciaKm} km da origem · {fmtMoney(custoPorKm * cliente.distanciaKm * 2)} por visita
                    </span>
                  )}
                </div>
              </div>
            )}
            {cliente.observacoes && (
              <div className="sm:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Observações</p>
                <p className="text-sm text-amber-800">{cliente.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: Medidas ══════════════════════════════════════════ */}
      {tab === 'medidas' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>Ficha de Medidas</h2>
            <button onClick={openNewMedida} className="btn-primary text-sm"><Plus size={14} /> Registrar</button>
          </div>
          {medidas.length === 0
            ? <EmptyState icon={<Ruler size={32} />} text="Nenhuma medida registrada" action={<button onClick={openNewMedida} className="btn-primary mt-3 text-sm"><Plus size={14}/>Registrar Medidas</button>} />
            : medidas.map(m => {
              const grupos = ['Superior', 'Central', 'Inferior', 'Braços'];
              return (
                <div key={m.id} className="mb-6 last:mb-0 border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="font-semibold text-sm text-brand-charcoal">
                      Medição de {format(parseISO(m.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <div className="flex gap-1">
                      <button onClick={() => openEditMedida(m)} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-brand-black transition-colors"><Edit2 size={13}/></button>
                      <button onClick={() => setDeleteConfirm({ type:'medida', id: m.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                    </div>
                  </div>
                  <div className="p-5 space-y-5">
                    {grupos.map(grupo => {
                      const campos = camposMedidas.filter(c => c.grupo === grupo && (m as any)[c.key]);
                      if (!campos.length) return null;
                      return (
                        <div key={grupo}>
                          <p className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${grupoColors[grupo]}`}>{grupo}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {campos.map(({ key, label }) => (
                              <div key={key} className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-400 leading-tight mb-1">{label}</p>
                                <p className="font-bold text-brand-charcoal">{(m as any)[key]} <span className="text-xs font-normal text-gray-400">cm</span></p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {m.observacoes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-600 mb-1">Observações</p>
                        <p className="text-sm text-amber-800">{m.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* ══ TAB: Contratos ════════════════════════════════════════ */}
      {tab === 'contratos' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>Contratos</h2>
            <button onClick={openNewContrato} className="btn-primary text-sm"><Plus size={14}/> Novo</button>
          </div>
          {contratos.length === 0
            ? <EmptyState icon={<FileText size={32} />} text="Nenhum contrato cadastrado" action={<button onClick={openNewContrato} className="btn-primary mt-3 text-sm"><Plus size={14}/>Criar Contrato</button>} />
            : <div className="space-y-4">
                {contratos.map(c => {
                  const s = statusContrato.find(s => s.value === c.status);
                  return (
                    <div key={c.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-xs text-gray-400">{c.numero}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-bold text-brand-charcoal">Assinado em {fmt(c.dataAssinatura)}</p>
                            <Badge variant={s?.color || 'gray'}>{s?.label}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {c.anexoBase64 && (
                            <a href={c.anexoBase64} download={c.anexoNome} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Baixar anexo">
                              <FileText size={14}/>
                            </a>
                          )}
                          <button onClick={() => openEditContrato(c)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-black transition-colors"><Edit2 size={13}/></button>
                          <button onClick={() => setDeleteConfirm({ type:'contrato', id:c.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-4 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">Valor Total</p>
                          <p className="font-bold text-emerald-700">{fmtMoney(c.valorTotal)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">Entrada</p>
                          <p className="font-semibold text-brand-charcoal">{fmtMoney(c.valorEntrada)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">Entrega</p>
                          <p className="font-semibold text-brand-charcoal">{c.dataEntrega ? fmt(c.dataEntrega) : '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">Provas</p>
                          <p className="font-semibold text-brand-charcoal flex items-center gap-1"><Scissors size={12} className="text-gray-400"/>{c.quantidadeProvas || '—'}</p>
                        </div>
                      </div>
                      {c.descricaoPecas && (
                        <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg p-3">{c.descricaoPecas}</p>
                      )}
                      {c.anexoNome && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                          <FileText size={12}/> Anexo: {c.anexoNome}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}

      {/* ══ TAB: Orçamentos ═══════════════════════════════════════ */}
      {tab === 'orcamentos' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>Orçamentos</h2>
            <button onClick={openNewOrc} className="btn-primary text-sm"><Plus size={14}/> Novo</button>
          </div>
          {orcamentos.length === 0
            ? <EmptyState icon={<Receipt size={32}/>} text="Nenhum orçamento gerado" action={<button onClick={openNewOrc} className="btn-primary mt-3 text-sm"><Plus size={14}/>Criar Orçamento</button>}/>
            : <div className="space-y-4">
                {orcamentos.map(o => {
                  const s = statusOrc.find(s => s.value === o.status);
                  const sub = o.itens.reduce((a, i) => a + i.quantidade * i.valorUnitario, 0);
                  const tot = sub - o.desconto;
                  return (
                    <div key={o.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-xs text-gray-400">{o.numero}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-bold text-brand-charcoal">{fmt(o.data)}</p>
                            <Badge variant={s?.color || 'gray'}>{s?.label}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => printOrc(o)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-black transition-colors" title="Imprimir"><Printer size={14}/></button>
                          <button onClick={() => openEditOrc(o)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-black transition-colors"><Edit2 size={13}/></button>
                          <button onClick={() => setDeleteConfirm({ type:'orcamento', id:o.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">{o.itens.length} item(s)</p>
                        <p className="text-xl font-bold text-emerald-700">{fmtMoney(tot)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}

      {/* ══ TAB: Provas ════════════════════════════════════════════ */}
      {tab === 'provas' && (
        <div className="space-y-4">
          {/* Alert banner */}
          {provasAtrasadas.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="font-semibold text-red-700 text-sm">
                  Atenção: {provasAtrasadas.length} pagamento{provasAtrasadas.length > 1 ? 's' : ''} em atraso
                </p>
                <p className="text-xs text-red-500 mt-0.5">
                  Existem provas realizadas ou com data vencida que ainda não foram pagas.
                </p>
              </div>
            </div>
          )}

          {parcelasProva.length === 0
            ? (
              <div className="card">
                <EmptyState
                  icon={<Scissors size={32}/>}
                  text="Nenhuma prova registrada. Crie um contrato informando o número de provas para começar."
                  action={<button onClick={() => setTab('contratos')} className="btn-secondary mt-3 text-sm"><FileText size={14}/> Ver Contratos</button>}
                />
              </div>
            )
            : contratos.filter(c => c.quantidadeProvas && c.quantidadeProvas > 0).map(c => {
                const provasContrato = parcelasProva
                  .filter(p => p.contratoId === c.id)
                  .sort((a, b) => a.numero - b.numero);
                if (!provasContrato.length) return null;
                const pagas     = provasContrato.filter(p => p.pago).length;
                const totalPago = provasContrato.filter(p => p.pago).reduce((a, p) => a + p.valorParcela, 0);
                return (
                  <div key={c.id} className="card">
                    {/* Contract header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <p className="font-mono text-xs text-gray-400 mb-1">{c.numero}</p>
                        <p className="font-bold text-brand-charcoal" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {c.quantidadeProvas} prova{c.quantidadeProvas! > 1 ? 's' : ''}
                          {c.descricaoPecas ? ` · ${c.descricaoPecas}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Assinado em {fmt(c.dataAssinatura)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-700">{fmtMoney(totalPago)}</p>
                        <p className="text-xs text-gray-400">{pagas}/{provasContrato.length} pagas</p>
                      </div>
                    </div>

                    {/* Travel cost banner (if distance configured) */}
                    {cliente.distanciaKm && custoPorKm > 0 && (() => {
                      const totalVisitas  = provasContrato.filter(p => p.statusProva !== 'cancelada').length;
                      const custoUnitario = custoPorKm * cliente.distanciaKm! * 2;
                      const custoTotal    = custoUnitario * totalVisitas;
                      const mapsUrl = config.enderecoOrigem
                        ? mapsRouteUrl(config.enderecoOrigem, cliente.endereco || cliente.local || '')
                        : cliente.endereco ? mapsSearchUrl(cliente.endereco) : null;

                      // Verifica se o orçamento vinculado ao contrato cobre o deslocamento
                      const orcVinculado = c.orcamentoId
                        ? orcamentos.find(o => o.id === c.orcamentoId) : null;
                      const itemDesl = orcVinculado?.itens.find(
                        i => i.id === '__deslocamento__' || i.descricao.toLowerCase().includes('deslocamento')
                      );
                      const qtdOrc = itemDesl?.quantidade ?? 0;
                      const coberto = qtdOrc >= totalVisitas;

                      return (
                        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 bg-gray-50 rounded-xl px-4 py-3 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Car size={13} className="text-brand-gold"/>
                            <span>{cliente.distanciaKm} km · {fmtMoney(custoUnitario)} por visita</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-brand-charcoal">
                            <Fuel size={13} className="text-brand-gold"/>
                            <span>Total {totalVisitas} visita{totalVisitas !== 1 ? 's' : ''}: {fmtMoney(custoTotal)}</span>
                          </div>

                          {/* Status em relação ao orçamento */}
                          {orcVinculado ? (
                            coberto ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                                <CheckCircle2 size={11}/> Incluído no orçamento ({qtdOrc} visita{qtdOrc !== 1 ? 's' : ''})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                                <AlertTriangle size={11}/> Orçamento cobre {qtdOrc} visita{qtdOrc !== 1 ? 's' : ''} — atualize para {totalVisitas}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 italic">
                              Custo operacional · vincule um orçamento para rastrear
                            </span>
                          )}

                          {mapsUrl && (
                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                               className="ml-auto inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                              <Navigation size={11}/> Traçar rota
                            </a>
                          )}
                        </div>
                      );
                    })()}

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: provasContrato.length > 0 ? `${(pagas / provasContrato.length) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>

                    {/* Provas list */}
                    <div className="space-y-3">
                      {provasContrato.map(p => {
                        const isAtrasada = !p.pago && p.statusProva !== 'cancelada' && (
                          p.statusProva === 'realizada' ||
                          (p.dataProva && isPast(parseISO(p.dataProva)) && !isToday(parseISO(p.dataProva)))
                        );
                        return (
                          <div key={p.id} className={`border rounded-2xl p-4 transition-colors ${
                            isAtrasada       ? 'border-red-200 bg-red-50/40' :
                            p.pago           ? 'border-emerald-100 bg-emerald-50/30' :
                            p.statusProva === 'agendada' ? 'border-blue-100 bg-blue-50/20' :
                            'border-gray-100 hover:border-gray-200'
                          }`}>
                            <div className="flex items-start gap-3">
                              {/* Circle number */}
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                p.pago           ? 'bg-emerald-100 text-emerald-700' :
                                isAtrasada       ? 'bg-red-100 text-red-600' :
                                p.statusProva === 'agendada'  ? 'bg-blue-100 text-blue-700' :
                                p.statusProva === 'realizada' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {p.numero}
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Title + badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm text-brand-charcoal">{p.numero}ª Prova</p>
                                  {p.pago && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                      <CheckCircle2 size={10}/> Pago
                                    </span>
                                  )}
                                  {isAtrasada && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                      <AlertTriangle size={10}/> Em atraso
                                    </span>
                                  )}
                                  {p.statusProva === 'agendada' && !p.pago && !isAtrasada && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                      <CalendarDays size={10}/> Agendada
                                    </span>
                                  )}
                                  {p.statusProva === 'realizada' && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                      <CheckCircle2 size={10}/> Realizada
                                    </span>
                                  )}
                                  {p.statusProva === 'cancelada' && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                                      Cancelada
                                    </span>
                                  )}
                                </div>

                                {/* Info row */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                  {p.dataProva ? (
                                    <span className="flex items-center gap-1">
                                      <CalendarDays size={10}/>
                                      {fmt(p.dataProva)}{p.horaProva ? ` às ${p.horaProva}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 italic">Data não definida</span>
                                  )}
                                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                                    <DollarSign size={10}/>
                                    {p.pago && p.valorPago !== undefined && p.valorPago !== p.valorParcela
                                      ? <>{fmtMoney(p.valorPago)}<span className="line-through text-gray-300 font-normal ml-1">{fmtMoney(p.valorParcela)}</span></>
                                      : fmtMoney(p.valorParcela)
                                    }
                                  </span>
                                  {p.pago && p.dataPagamento && (
                                    <span className="text-emerald-600">
                                      Pago em {fmt(p.dataPagamento)} · {formasPag.find(f => f.value === p.formaPagamento)?.label || '—'}
                                    </span>
                                  )}
                                </div>
                                {p.observacoes && (
                                  <p className="text-xs text-gray-400 mt-1 italic">{p.observacoes}</p>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex gap-1 flex-shrink-0">
                                {/* Define/edit date */}
                                {p.statusProva !== 'cancelada' && p.statusProva !== 'realizada' && !p.pago && (
                                  <button
                                    onClick={() => openProvaData(p)}
                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                    title={p.dataProva ? 'Editar data' : 'Definir data'}
                                  >
                                    <CalendarDays size={14}/>
                                  </button>
                                )}
                                {/* Mark as realizada */}
                                {(p.statusProva === 'agendada' || p.statusProva === 'pendente') && !p.pago && (
                                  <button
                                    onClick={() => marcarProvaRealizada(p)}
                                    className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                                    title="Marcar como realizada"
                                  >
                                    <CheckCircle2 size={14}/>
                                  </button>
                                )}
                                {/* Register / undo payment */}
                                {!p.pago && p.statusProva !== 'cancelada' && (
                                  <button
                                    onClick={() => openProvaPag(p)}
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                    title="Registrar pagamento"
                                  >
                                    <DollarSign size={14}/>
                                  </button>
                                )}
                                {p.pago && (
                                  <>
                                    <button
                                      onClick={() => openProvaPag(p)}
                                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Editar pagamento"
                                    >
                                      <Edit2 size={14}/>
                                    </button>
                                    <button
                                      onClick={() => cancelarPagamentoProva(p)}
                                      className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                      title="Desfazer pagamento"
                                    >
                                      <X size={14}/>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ══ TAB: Agenda ═══════════════════════════════════════════ */}
      {tab === 'agenda' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>Agenda</h2>
            <button onClick={openNewAg} className="btn-primary text-sm"><Plus size={14}/> Agendar</button>
          </div>
          {agendamentos.length === 0
            ? <EmptyState icon={<Calendar size={32}/>} text="Nenhum compromisso agendado" action={<button onClick={openNewAg} className="btn-primary mt-3 text-sm"><Plus size={14}/>Agendar</button>}/>
            : <div className="space-y-3">
                {agendamentos.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).map(a => {
                  const s = statusAg.find(s => s.value === a.status);
                  const t = tiposAg.find(t => t.value === a.tipo);
                  return (
                    <div key={a.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                      <div className="text-center min-w-[52px] bg-gray-100 rounded-xl p-2">
                        <p className="text-xs text-gray-400 uppercase">{format(parseISO(a.data), 'EEE', { locale: ptBR })}</p>
                        <p className="text-xl font-bold text-brand-black">{format(parseISO(a.data), 'd')}</p>
                        <p className="text-xs text-gray-400">{a.hora}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-brand-charcoal">{t?.label}</p>
                        {a.descricao && <p className="text-xs text-gray-400 truncate">{a.descricao}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={s?.color || 'gray'}>{s?.label}</Badge>
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11}/>{a.duracao} min</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {a.status !== 'concluido' && (
                          <button onClick={() => app.saveAgendamento({ ...a, status: 'concluido' })} className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Concluir"><CheckCircle2 size={15}/></button>
                        )}
                        <button onClick={() => openEditAg(a)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-black transition-colors"><Edit2 size={13}/></button>
                        <button onClick={() => setDeleteConfirm({ type:'agendamento', id:a.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}

      {/* ══ TAB: Financeiro ═══════════════════════════════════════ */}
      {tab === 'financeiro' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>Financeiro</h2>
            <button onClick={openNewPag} className="btn-primary text-sm"><Plus size={14}/> Lançamento</button>
          </div>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">{fmtMoney(recebido)}</p>
              <p className="text-xs text-emerald-500 mt-1">Recebido</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
              <p className="text-lg font-bold text-amber-600">{fmtMoney(pendente)}</p>
              <p className="text-xs text-amber-400 mt-1">A receber</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-brand-charcoal">{fmtMoney(totalContrato)}</p>
              <p className="text-xs text-gray-400 mt-1">Total contrato</p>
            </div>
          </div>
          {(() => {
            // Pagamentos manuais (entrada, outros) — exclui os gerados por provas
            const pagsManuais = pagamentos.filter(p => !p.id.startsWith('prov-'));
            // Prova parcelas pagas — identificadas pelo prefixo 'prov-'
            const pagsProva   = pagamentos.filter(p => p.id.startsWith('prov-'));
            // Parcelas de prova ainda não pagas (sem registro Pagamento)
            const provasPend  = parcelasProva.filter(p => !p.pago && p.statusProva !== 'cancelada');

            const temItens = pagsManuais.length + pagsProva.length + provasPend.length > 0;
            if (!temItens) return (
              <EmptyState icon={<BarChart3 size={32}/>} text="Nenhum lançamento registrado"
                action={<button onClick={openNewPag} className="btn-primary mt-3 text-sm"><Plus size={14}/>Adicionar</button>}/>
            );

            return (
              <div className="space-y-2">

                {/* ── Pagamentos manuais (entrada, lançamentos avulsos) ── */}
                {pagsManuais.sort((a,b) => b.data.localeCompare(a.data)).map(p => {
                  const statusColor = p.status === 'pago' ? 'green' : p.status === 'vencido' ? 'red' : 'yellow';
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-brand-charcoal truncate">{p.descricao}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(p.data)} · {formasPag.find(f => f.value === p.formaPagamento)?.label || '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-brand-charcoal">{fmtMoney(p.valor)}</p>
                        <Badge variant={statusColor as any}>{p.status === 'pago' ? 'Pago' : p.status === 'vencido' ? 'Vencido' : 'Pendente'}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditPag(p)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-black transition-colors"><Edit2 size={13}/></button>
                        <button onClick={() => setDeleteConfirm({ type:'pagamento', id:p.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  );
                })}

                {/* ── Divider se há manuais + provas ── */}
                {pagsManuais.length > 0 && (pagsProva.length + provasPend.length) > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-gray-100"/>
                    <span className="text-xs text-gray-300 flex items-center gap-1 px-2">
                      <Scissors size={10}/> Parcelas de Prova
                    </span>
                    <div className="flex-1 h-px bg-gray-100"/>
                  </div>
                )}

                {/* ── Provas pagas (registros prov-…) ── */}
                {pagsProva.sort((a,b) => b.data.localeCompare(a.data)).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Scissors size={12} className="text-emerald-500"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-brand-charcoal truncate">{p.descricao}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmt(p.data)} · {formasPag.find(f => f.value === p.formaPagamento)?.label || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-brand-charcoal">{fmtMoney(p.valor)}</p>
                      <Badge variant="green">Pago</Badge>
                    </div>
                    {/* Editar/desfazer via aba Provas */}
                    <button onClick={() => setTab('provas')} title="Gerenciar na aba Provas"
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-300 hover:text-rose-500 transition-colors">
                      <ChevronRight size={13}/>
                    </button>
                  </div>
                ))}

                {/* ── Provas pendentes (sem registro Pagamento) ── */}
                {provasPend.sort((a,b) => a.numero - b.numero).map(p => {
                  const contrato = contratos.find(c => c.id === p.contratoId);
                  const isOverdue = p.dataProva && isPast(parseISO(p.dataProva)) && !isToday(parseISO(p.dataProva));
                  return (
                    <div key={`prv-${p.id}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border border-dashed transition-colors
                        ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isOverdue ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <Scissors size={12} className={isOverdue ? 'text-red-500' : 'text-amber-500'}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-brand-charcoal">
                          {p.numero}ª Prova
                          {contrato?.descricaoPecas && (
                            <span className="ml-2 text-xs font-normal text-gray-400 truncate">
                              — {contrato.descricaoPecas.slice(0, 30)}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.dataProva ? fmt(p.dataProva) : 'Data não definida'}
                          {p.horaProva ? ` às ${p.horaProva}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                          {fmtMoney(p.valorParcela)}
                        </p>
                        <Badge variant={isOverdue ? 'red' : 'yellow'}>
                          {isOverdue ? 'Em atraso' : 'Pendente'}
                        </Badge>
                      </div>
                      <button onClick={() => setTab('provas')} title="Gerenciar na aba Provas"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-300 hover:text-rose-500 transition-colors">
                        <ChevronRight size={13}/>
                      </button>
                    </div>
                  );
                })}

              </div>
            );
          })()}
        </div>
      )}

      {/* ══ TAB: Inspirações ══════════════════════════════════════ */}
      {tab === 'inspiracoes' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-brand-black" style={{ fontFamily: "'Playfair Display', serif" }}>Inspirações</h2>
            <button onClick={openNewInsp} className="btn-primary text-sm"><Plus size={14}/> Adicionar</button>
          </div>
          {inspiracoes.length === 0
            ? <EmptyState icon={<Image size={32}/>} text="Nenhuma inspiração adicionada" action={<button onClick={openNewInsp} className="btn-primary mt-3 text-sm"><Plus size={14}/>Adicionar</button>}/>
            : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {inspiracoes.map(i => {
                  const imgSrc = i.imagemBase64 || i.imagemUrl || '';
                  return (
                    <div key={i.id} className="group relative">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                           onClick={() => setLightbox(i)}>
                        {imgSrc
                          ? <img src={imgSrc} alt={i.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                          : <div className="flex items-center justify-center h-full text-gray-300"><Image size={28}/></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"/>
                      </div>
                      <div className="mt-2 flex items-start justify-between gap-1">
                        <p className="text-xs font-medium text-brand-charcoal truncate flex-1">{i.titulo}</p>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <button onClick={() => app.saveInspiracao({ ...i, favorito: !i.favorito })}
                                  className={`p-1 rounded ${i.favorito ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'} transition-colors`}>
                            <Star size={12} fill={i.favorito ? 'currentColor' : 'none'}/>
                          </button>
                          <button onClick={() => setDeleteConfirm({ type:'inspiracao', id:i.id })} className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded">
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}

      {/* ════════════ MODALS ════════════════════════════════════════ */}

      {/* Edit Cliente */}
      <Modal isOpen={editClienteOpen} onClose={() => setEditClienteOpen(false)} title="Editar Cliente" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome *</label><input className="input-field" value={clienteForm.nome || ''} onChange={e => setClienteForm(p => ({ ...p, nome: e.target.value }))}/></div>
            <div><label className="label">Telefone / WhatsApp</label><input className="input-field" value={clienteForm.telefone || ''} onChange={e => setClienteForm(p => ({ ...p, telefone: e.target.value }))}/></div>
            <div><label className="label">E-mail</label><input type="email" className="input-field" value={clienteForm.email || ''} onChange={e => setClienteForm(p => ({ ...p, email: e.target.value }))}/></div>
            <div><label className="label">Instagram</label><input className="input-field" placeholder="@usuario" value={clienteForm.instagram || ''} onChange={e => setClienteForm(p => ({ ...p, instagram: e.target.value }))}/></div>
            <div><label className="label">Data do Casamento</label><input type="date" className="input-field" value={clienteForm.dataCasamento || ''} onChange={e => setClienteForm(p => ({ ...p, dataCasamento: e.target.value }))}/></div>
            <div><label className="label">Status</label>
              <select className="input-field" value={clienteForm.status || 'lead'} onChange={e => setClienteForm(p => ({ ...p, status: e.target.value as Cliente['status'] }))}>
                {statusClienteOpt.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div><label className="label">Local do Casamento</label><input className="input-field" value={clienteForm.local || ''} onChange={e => setClienteForm(p => ({ ...p, local: e.target.value }))}/></div>
            <div><label className="label">Como nos conheceu</label><input className="input-field" value={clienteForm.indicacao || ''} onChange={e => setClienteForm(p => ({ ...p, indicacao: e.target.value }))}/></div>
            <div className="col-span-2"><label className="label">Endereço da cliente (para navegação)</label><input className="input-field" placeholder="Rua, Nº, Bairro, Cidade" value={clienteForm.endereco || ''} onChange={e => setClienteForm(p => ({ ...p, endereco: e.target.value }))}/></div>
            <div><label className="label">Distância do ateliê (km, ida)</label><input type="number" min="0" step="0.5" className="input-field" placeholder="Ex: 12" value={clienteForm.distanciaKm ?? ''} onChange={e => setClienteForm(p => ({ ...p, distanciaKm: e.target.value ? Number(e.target.value) : undefined }))}/></div>
            <div className="col-span-2"><label className="label">Observações</label><textarea className="input-field" rows={2} value={clienteForm.observacoes || ''} onChange={e => setClienteForm(p => ({ ...p, observacoes: e.target.value }))}/></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditClienteOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={saveCliente} className="btn-primary flex-1 justify-center"><Save size={14}/> Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Medidas Modal */}
      <Modal isOpen={medidaOpen} onClose={() => setMedidaOpen(false)} title={editMedida ? 'Editar Medidas' : 'Registrar Medidas'} size="2xl">
        <div className="space-y-5">
          <div><label className="label">Data da Medição *</label><input type="date" className="input-field sm:w-48" value={medidaForm.data || ''} onChange={e => setMedidaForm(p => ({ ...p, data: e.target.value }))}/></div>
          {['Superior', 'Central', 'Inferior', 'Braços'].map(grupo => (
            <div key={grupo}>
              <p className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${grupoColors[grupo]}`}>{grupo}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {camposMedidas.filter(c => c.grupo === grupo).map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <div className="relative">
                      <input type="number" step="0.1" min="0" placeholder="0.0" className="input-field pr-9 text-sm"
                             value={medidaForm[key] ?? ''} onChange={e => setMedidaForm(p => ({ ...p, [key]: e.target.value }))}/>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div><label className="label">Observações</label><textarea className="input-field" rows={2} value={medidaForm.observacoes || ''} onChange={e => setMedidaForm(p => ({ ...p, observacoes: e.target.value }))}/></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setMedidaOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={saveMedida} className="btn-primary flex-1 justify-center"><Save size={14}/> Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Contrato Modal */}
      <Modal isOpen={contratoOpen} onClose={() => setContratoOpen(false)} title={editContrato ? 'Editar Contrato' : 'Novo Contrato'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Status</label>
              <select className="input-field" value={contratoForm.status || 'rascunho'} onChange={e => setContratoForm(p => ({ ...p, status: e.target.value }))}>
                {statusContrato.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div><label className="label">Data de Assinatura</label><input type="date" className="input-field" value={contratoForm.dataAssinatura || ''} onChange={e => setContratoForm(p => ({ ...p, dataAssinatura: e.target.value }))}/></div>
            <div><label className="label">Data de Entrega</label><input type="date" className="input-field" value={contratoForm.dataEntrega || ''} onChange={e => setContratoForm(p => ({ ...p, dataEntrega: e.target.value }))}/></div>
            <div><label className="label">Valor Total *</label><input type="number" step="0.01" className="input-field" value={contratoForm.valorTotal || ''} onChange={e => setContratoForm(p => ({ ...p, valorTotal: e.target.value }))}/></div>
            <div><label className="label">Valor de Entrada</label><input type="number" step="0.01" className="input-field" value={contratoForm.valorEntrada || ''} onChange={e => setContratoForm(p => ({ ...p, valorEntrada: e.target.value }))}/></div>
            <div><label className="label">Nº de Provas</label><input type="number" min="1" max="10" className="input-field" placeholder="Ex: 3" value={contratoForm.quantidadeProvas || ''} onChange={e => setContratoForm(p => ({ ...p, quantidadeProvas: e.target.value }))}/></div>
            {/* Prova preview */}
            {contratoForm.quantidadeProvas && Number(contratoForm.quantidadeProvas) > 0 && Number(contratoForm.valorTotal) > 0 && (() => {
              const vt = Number(contratoForm.valorTotal); const ve = Number(contratoForm.valorEntrada) || 0;
              const qp = Number(contratoForm.quantidadeProvas); const saldo = vt - ve;
              return (
                <div className="col-span-2 bg-brand-black/5 border border-brand-black/10 rounded-xl p-3 flex gap-4 text-xs">
                  <div><p className="text-gray-400 mb-0.5">Entrada ({ve > 0 ? ((ve/vt)*100).toFixed(0) : '0'}%)</p><p className="font-bold text-brand-charcoal">{fmtMoney(ve)}</p></div>
                  <div className="border-l border-gray-200 pl-4"><p className="text-gray-400 mb-0.5">Saldo restante</p><p className="font-bold text-brand-charcoal">{fmtMoney(saldo)}</p></div>
                  <div className="border-l border-gray-200 pl-4"><p className="text-gray-400 mb-0.5">Por prova ({qp}x)</p><p className="font-bold text-emerald-700">{fmtMoney(saldo / qp)}</p></div>
                </div>
              );
            })()}
            <div className="col-span-2"><label className="label">Descrição das Peças / Serviços</label><textarea className="input-field" rows={3} value={contratoForm.descricaoPecas || ''} onChange={e => setContratoForm(p => ({ ...p, descricaoPecas: e.target.value }))}/></div>
            <div className="col-span-2"><label className="label">Cláusulas Especiais</label><textarea className="input-field" rows={2} value={contratoForm.clausulasEspeciais || ''} onChange={e => setContratoForm(p => ({ ...p, clausulasEspeciais: e.target.value }))}/></div>
          </div>
          {/* File Attachment */}
          <div>
            <label className="label">Anexo do Contrato (PDF / Imagem)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                 onClick={() => contratoFileRef.current?.click()}>
              {contratoAnexo
                ? <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-600"/>
                      <span className="text-sm font-medium text-brand-charcoal">{contratoAnexo.nome}</span>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setContratoAnexo(null); }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"><X size={14}/></button>
                  </div>
                : <div>
                    <Upload size={22} className="mx-auto mb-2 text-gray-300"/>
                    <p className="text-sm text-gray-400">Clique para anexar o contrato assinado</p>
                    <p className="text-xs text-gray-300 mt-1">PDF, JPG, PNG — máx. 10MB</p>
                  </div>
              }
              <input ref={contratoFileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleContratoAnexo}/>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setContratoOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={saveContrato} className="btn-primary flex-1 justify-center" disabled={!contratoForm.valorTotal}><Save size={14}/> Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Orçamento Modal */}
      <Modal isOpen={orcOpen} onClose={() => setOrcOpen(false)} title={editOrc ? 'Editar Orçamento' : 'Novo Orçamento'} size="2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Data</label><input type="date" className="input-field" value={orcForm.data || ''} onChange={e => setOrcForm(p => ({ ...p, data: e.target.value }))}/></div>
            <div><label className="label">Validade</label><input type="date" className="input-field" value={orcForm.validade || ''} onChange={e => setOrcForm(p => ({ ...p, validade: e.target.value }))}/></div>
            <div><label className="label">Status</label>
              <select className="input-field" value={orcForm.status || 'pendente'} onChange={e => setOrcForm(p => ({ ...p, status: e.target.value }))}>
                {statusOrc.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Itens</label>
              <button onClick={() => setOrcItens(p => [...p, { id: genId(), descricao: '', quantidade: 1, valorUnitario: 0 }])} className="btn-ghost text-xs py-1">
                <Plus size={12}/> Item
              </button>
            </div>
            <div className="space-y-2">
              {orcItens.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-xl">
                  <div className="col-span-5"><input className="input-field text-sm" placeholder="Descrição" value={item.descricao} onChange={e => setOrcItens(p => p.map(i => i.id === item.id ? { ...i, descricao: e.target.value } : i))}/></div>
                  <div className="col-span-2"><input type="number" min="1" className="input-field text-sm" value={item.quantidade} onChange={e => setOrcItens(p => p.map(i => i.id === item.id ? { ...i, quantidade: Number(e.target.value) } : i))}/></div>
                  <div className="col-span-3"><input type="number" step="0.01" className="input-field text-sm" placeholder="Valor unit." value={item.valorUnitario || ''} onChange={e => setOrcItens(p => p.map(i => i.id === item.id ? { ...i, valorUnitario: Number(e.target.value) } : i))}/></div>
                  <div className="col-span-1 text-sm font-semibold text-gray-600 text-right">{fmtMoney(item.quantidade * item.valorUnitario)}</div>
                  <div className="col-span-1 flex justify-end">{orcItens.length > 1 && <button onClick={() => setOrcItens(p => p.filter(i => i.id !== item.id))} className="p-1 text-gray-300 hover:text-red-500 rounded"><X size={13}/></button>}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2"><span>Subtotal</span><span>{fmtMoney(orcSubtotal)}</span></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Desconto (R$)</span>
                <input type="number" step="0.01" className="input-field w-28 text-sm" value={orcForm.desconto || '0'} onChange={e => setOrcForm(p => ({ ...p, desconto: e.target.value }))}/>
              </div>
              <div className="flex justify-between font-bold text-brand-black border-t border-gray-200 pt-2"><span>Total</span><span>{fmtMoney(orcTotal)}</span></div>
            </div>
          </div>
          <div><label className="label">Observações</label><textarea className="input-field" rows={2} value={orcForm.observacoes || ''} onChange={e => setOrcForm(p => ({ ...p, observacoes: e.target.value }))}/></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setOrcOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={saveOrc} className="btn-primary flex-1 justify-center"><Save size={14}/> Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Agendamento Modal */}
      <Modal isOpen={agOpen} onClose={() => setAgOpen(false)} title={editAg ? 'Editar Agendamento' : 'Novo Agendamento'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Tipo</label>
              <select className="input-field" value={agForm.tipo || 'consulta'} onChange={e => setAgForm(p => ({ ...p, tipo: e.target.value }))}>
                {tiposAg.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="label">Data *</label><input type="date" className="input-field" value={agForm.data || ''} onChange={e => setAgForm(p => ({ ...p, data: e.target.value }))}/></div>
            <div><label className="label">Horário</label><input type="time" className="input-field" value={agForm.hora || '10:00'} onChange={e => setAgForm(p => ({ ...p, hora: e.target.value }))}/></div>
            <div><label className="label">Duração (min)</label>
              <select className="input-field" value={agForm.duracao || '60'} onChange={e => setAgForm(p => ({ ...p, duracao: e.target.value }))}>
                {[30, 45, 60, 90, 120, 180].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="input-field" value={agForm.status || 'agendado'} onChange={e => setAgForm(p => ({ ...p, status: e.target.value }))}>
                {statusAg.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="label">Descrição</label><textarea className="input-field" rows={2} value={agForm.descricao || ''} onChange={e => setAgForm(p => ({ ...p, descricao: e.target.value }))}/></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAgOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={saveAg} className="btn-primary flex-1 justify-center" disabled={!agForm.data}><Save size={14}/> Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Pagamento Modal */}
      <Modal isOpen={pagOpen} onClose={() => setPagOpen(false)} title={editPag ? 'Editar Lançamento' : 'Novo Lançamento'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Descrição *</label><input className="input-field" value={pagForm.descricao || ''} onChange={e => setPagForm(p => ({ ...p, descricao: e.target.value }))}/></div>
            <div><label className="label">Valor *</label><input type="number" step="0.01" className="input-field" value={pagForm.valor || ''} onChange={e => setPagForm(p => ({ ...p, valor: e.target.value }))}/></div>
            <div><label className="label">Data</label><input type="date" className="input-field" value={pagForm.data || ''} onChange={e => setPagForm(p => ({ ...p, data: e.target.value }))}/></div>
            <div><label className="label">Tipo</label>
              <select className="input-field" value={pagForm.tipo || 'entrada'} onChange={e => setPagForm(p => ({ ...p, tipo: e.target.value }))}>
                <option value="entrada">Entrada</option><option value="parcela">Parcela</option>
                <option value="saldo">Saldo Final</option><option value="outro">Outro</option>
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="input-field" value={pagForm.status || 'pago'} onChange={e => setPagForm(p => ({ ...p, status: e.target.value }))}>
                <option value="pago">Pago</option><option value="pendente">Pendente</option><option value="vencido">Vencido</option>
              </select>
            </div>
            <div className="col-span-2"><label className="label">Forma de Pagamento</label>
              <select className="input-field" value={pagForm.formaPagamento || 'pix'} onChange={e => setPagForm(p => ({ ...p, formaPagamento: e.target.value }))}>
                {formasPag.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setPagOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={savePag} className="btn-primary flex-1 justify-center" disabled={!pagForm.descricao || !pagForm.valor}><Save size={14}/> Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Inspiração Modal */}
      <Modal isOpen={inspOpen} onClose={() => setInspOpen(false)} title="Adicionar Inspiração" size="lg">
        <div className="space-y-4">
          <div><label className="label">Título *</label><input className="input-field" value={inspForm.titulo || ''} onChange={e => setInspForm(p => ({ ...p, titulo: e.target.value }))}/></div>
          <div><label className="label">Categoria</label>
            <select className="input-field" value={inspForm.categoria || 'vestido'} onChange={e => setInspForm(p => ({ ...p, categoria: e.target.value }))}>
              {categoriaInsps.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
               onClick={() => inspFileRef.current?.click()}>
            {inspImagem
              ? <img src={inspImagem} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain mb-2"/>
              : <div><Upload size={22} className="mx-auto mb-2 text-gray-300"/><p className="text-sm text-gray-400">Upload de imagem</p><p className="text-xs text-gray-300 mt-1">Máx. 5MB</p></div>
            }
            <input ref={inspFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => setInspImagem(ev.target!.result as string);
              reader.readAsDataURL(file);
            }}/>
          </div>
          <div><label className="label">Ou URL da imagem</label><input type="url" className="input-field" placeholder="https://..." value={inspForm.imagemUrl || ''} onChange={e => setInspForm(p => ({ ...p, imagemUrl: e.target.value }))}/></div>
          <div><label className="label">Observações</label><textarea className="input-field" rows={2} value={inspForm.observacoes || ''} onChange={e => setInspForm(p => ({ ...p, observacoes: e.target.value }))}/></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setInspOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={saveInsp} className="btn-primary flex-1 justify-center" disabled={!inspForm.titulo}><Plus size={14}/> Adicionar</button>
          </div>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-white font-bold">{lightbox.titulo}</p>
              <button onClick={() => setLightbox(null)} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"><X size={18}/></button>
            </div>
            {(lightbox.imagemBase64 || lightbox.imagemUrl)
              ? <img src={lightbox.imagemBase64 || lightbox.imagemUrl} alt={lightbox.titulo} className="max-h-[75vh] mx-auto rounded-xl object-contain"/>
              : <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500"><Image size={48}/></div>
            }
          </div>
        </div>
      )}

      {/* Modal: Data da Prova */}
      <Modal isOpen={!!provaDataModal} onClose={() => setProvaDataModal(null)} title="Agendar Prova" size="sm">
        {provaDataModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-black text-white flex items-center justify-center text-sm font-bold">
                {provaDataModal.numero}
              </div>
              <div>
                <p className="text-xs text-gray-400">Valor desta prova</p>
                <p className="font-bold text-brand-charcoal">{fmtMoney(provaDataModal.valorParcela)}</p>
              </div>
            </div>
            <div>
              <label className="label">Data da Prova</label>
              <input type="date" className="input-field"
                     value={provaDataForm.dataProva}
                     onChange={e => setProvaDataForm(p => ({ ...p, dataProva: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Horário</label>
              <input type="time" className="input-field"
                     value={provaDataForm.horaProva}
                     onChange={e => setProvaDataForm(p => ({ ...p, horaProva: e.target.value }))}/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setProvaDataModal(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={saveProvaData} className="btn-primary flex-1 justify-center"><Save size={14}/> Salvar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Pagamento da Prova */}
      <Modal isOpen={!!provaPagModal} onClose={() => setProvaPagModal(null)}
             title={provaPagModal?.pago ? 'Editar Pagamento' : 'Registrar Pagamento'} size="sm">
        {provaPagModal && (
          <div className="space-y-4">
            {/* Negotiated value header */}
            <div className="bg-brand-black rounded-xl p-4 text-white text-center">
              <p className="text-xs opacity-60 mb-1">{provaPagModal.numero}ª Prova — Valor negociado</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                {fmtMoney(provaPagModal.valorParcela)}
              </p>
            </div>
            {/* Valor efetivamente pago (can differ from negotiated) */}
            <div>
              <label className="label">
                Valor Pago
                <span className="text-gray-400 font-normal text-xs ml-1">
                  (deixe em branco para usar o valor negociado)
                </span>
              </label>
              <input type="number" step="0.01" className="input-field"
                     placeholder={fmtMoney(provaPagModal.valorParcela)}
                     value={provaPagForm.valorPago}
                     onChange={e => setProvaPagForm(p => ({ ...p, valorPago: e.target.value }))}/>
              {provaPagForm.valorPago && Number(provaPagForm.valorPago) !== provaPagModal.valorParcela && (
                <p className="mt-1 text-xs text-amber-600">
                  Diferença: {fmtMoney(Number(provaPagForm.valorPago) - provaPagModal.valorParcela)}
                </p>
              )}
            </div>
            <div>
              <label className="label">Data do Pagamento *</label>
              <input type="date" className="input-field"
                     value={provaPagForm.dataPagamento}
                     onChange={e => setProvaPagForm(p => ({ ...p, dataPagamento: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Forma de Pagamento</label>
              <select className="input-field"
                      value={provaPagForm.formaPagamento}
                      onChange={e => setProvaPagForm(p => ({ ...p, formaPagamento: e.target.value as FormaPagamentoProva }))}>
                {formasPag.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea className="input-field" rows={2}
                        placeholder="Opcional..."
                        value={provaPagForm.observacoes}
                        onChange={e => setProvaPagForm(p => ({ ...p, observacoes: e.target.value }))}/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setProvaPagModal(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={saveProvaPag} className="btn-primary flex-1 justify-center">
                <CheckCircle2 size={14}/> {provaPagModal.pago ? 'Salvar Alterações' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" size="sm">
        <p className="text-gray-500 mb-6">Deseja excluir este item? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={handleDelete} className="flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}

/* ── EmptyState helper ─────────────────────────────────────────── */
function EmptyState({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 text-gray-300">
      <div className="flex justify-center mb-3 opacity-40">{icon}</div>
      <p className="text-sm text-gray-400">{text}</p>
      {action}
    </div>
  );
}
