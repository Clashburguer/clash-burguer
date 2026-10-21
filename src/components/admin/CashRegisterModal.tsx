import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  TrendingUp,
  Clock,
  Calendar,
  Download,
  Printer,
  Copy,
  Check,
  Share2,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  DailyClosing,
  ShiftStatusLive,
  StoredOrder,
  PaymentMethodType,
} from '../../types/cashRegister';
import { generateWhatsAppClosingSummary } from '../../utils/cashRegisterFormatters';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber: string;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose,
  whatsappNumber,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('clash_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active view tab: 'live' | 'history' | 'compare' | 'new-order'
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'compare'>('live');

  // Data states
  const [liveData, setLiveData] = useState<ShiftStatusLive | null>(null);
  const [historyList, setHistoryList] = useState<DailyClosing[]>([]);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initial float edit
  const [initialFloatInput, setInitialFloatInput] = useState<string>('100');
  const [isUpdatingFloat, setIsUpdatingFloat] = useState(false);

  // Reopen prompt state
  const [reopenPromptDate, setReopenPromptDate] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenPin, setReopenPin] = useState('');

  // Manual close confirmation modal
  const [isConfirmingManualClose, setIsConfirmingManualClose] = useState(false);

  // Copy feedback
  const [copiedText, setCopiedText] = useState(false);

  // Fetch live shift status and history
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resLive, resHistory] = await Promise.all([
        fetch('/api/cash-register/live'),
        fetch('/api/cash-register/history'),
      ]);

      if (resLive.ok) {
        const live: ShiftStatusLive = await resLive.json();
        setLiveData(live);
        setInitialFloatInput(live.liveClosing.payments.cash.initialFloat.toString());
      }
      if (resHistory.ok) {
        const history: DailyClosing[] = await resHistory.json();
        setHistoryList(history);
        if (!selectedHistoryDate && history.length > 0) {
          setSelectedHistoryDate(history[0].date);
        }
      }
    } catch (err) {
      console.error('Error fetching cash register data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 15000); // refresh every 15s
      return () => clearInterval(interval);
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    // Senha de Administrador: 1226
    const validPin = liveData?.settings?.adminPin || '1226';
    if (pinInput.trim() === '1226' || pinInput.trim() === validPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('clash_admin_auth', 'true');
      setPinInput('');
    } else {
      setPinError('Senha de administrador incorreta.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('clash_admin_auth');
  };

  const formatBRL = (v: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------
  const handleUpdateInitialFloat = async () => {
    const val = parseFloat(initialFloatInput.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      alert('Informe um valor válido para o fundo inicial do caixa.');
      return;
    }
    setIsUpdatingFloat(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialFloatDefault: val }),
      });
      await fetchData();
      setActionMessage({ text: 'Fundo inicial de caixa atualizado!', type: 'success' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      alert('Erro ao atualizar fundo inicial.');
    } finally {
      setIsUpdatingFloat(false);
    }
  };

  const handleExecuteManualClosing = async () => {
    if (!liveData) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/cash-register/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: liveData.localDate,
          closedBy: 'Administrador (Manual)',
          force: true,
          initialFloat: parseFloat(initialFloatInput) || 100,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsConfirmingManualClose(false);
        setActionMessage({ text: data.message || 'Caixa fechado com sucesso!', type: 'success' });
        setTimeout(() => setActionMessage(null), 4000);
        await fetchData();
      } else {
        alert(data.error || 'Erro ao fechar caixa.');
      }
    } catch {
      alert('Falha na comunicação com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopenClosing = async (dateStr: string) => {
    if (!reopenReason.trim()) {
      alert('Por favor, informe a justificativa da reabertura.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/cash-register/reopen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          user: 'Administrador',
          reason: reopenReason,
          adminPin: reopenPin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReopenPromptDate(null);
        setReopenReason('');
        setReopenPin('');
        setActionMessage({ text: data.message || 'Caixa reaberto com sucesso!', type: 'success' });
        setTimeout(() => setActionMessage(null), 4000);
        await fetchData();
      } else {
        alert(data.error || 'Erro ao reabrir caixa.');
      }
    } catch {
      alert('Erro ao comunicar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'completed' | 'canceled' | 'pending',
    paymentStatus?: 'paid' | 'pending' | 'canceled'
  ) => {
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus }),
      });
      await fetchData();
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
    }
  };

  const handleSendWhatsApp = (closing: DailyClosing) => {
    const message = generateWhatsAppClosingSummary(closing);
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopySummary = (closing: DailyClosing) => {
    const message = generateWhatsAppClosingSummary(closing);
    navigator.clipboard.writeText(message);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = (dateStr: string) => {
    window.open(`/api/cash-register/export/${dateStr}`, '_blank');
  };

  // Selected history closing
  const selectedHistory = historyList.find((c) => c.date === selectedHistoryDate);

  // Active closing object to render in live tab
  const activeLiveClosing = liveData?.liveClosing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden border border-pink-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 via-pink-950 to-gray-900 text-white shrink-0 flex items-center justify-between border-b border-pink-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-pink-600/30 border border-pink-500/40 backdrop-blur-xs flex items-center justify-center text-pink-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                  Painel Administrativo
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Fuso: America/Manaus (UTC-4)
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black leading-tight mt-0.5 flex items-center gap-2">
                <span>Fechamento Automático de Caixa</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                title="Sair do modo administrativo"
              >
                Bloquear
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action toast message */}
        {actionMessage && (
          <div
            className={`p-3 text-center text-xs font-bold text-white transition-all ${
              actionMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Body Container */}
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-black text-gray-900">Acesso Restrito ao Caixa</h4>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Digite o PIN de segurança para consultar os relatórios financeiros, faturamento e fechamento de caixa.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-3">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Digite a senha (ex: 1226)"
                  className="w-full p-3.5 text-center text-xl font-black tracking-widest bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-pink-500 outline-hidden"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-500 font-semibold mt-1.5">{pinError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white font-extrabold rounded-2xl shadow-md shadow-pink-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Entrar no Caixa</span>
              </button>
              <p className="text-[11px] text-gray-400">
                Senha de acesso configurada: <strong>1226</strong>
              </p>
            </form>
          </div>
        ) : (
          /* Main Authenticated Cash Register View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Navigation Tabs */}
            <div className="px-4 pt-3 pb-2 bg-gray-50/80 border-b border-pink-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-gray-200/80 p-1 rounded-2xl text-xs font-bold text-gray-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('live')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'live'
                      ? 'bg-white text-pink-700 shadow-xs font-black'
                      : 'hover:text-gray-900'
                  }`}
                >
                  ⚡ Caixa de Hoje (Ao Vivo)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-white text-pink-700 shadow-xs font-black'
                      : 'hover:text-gray-900'
                  }`}
                >
                  📅 Histórico de Fechamentos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('compare')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'compare'
                      ? 'bg-white text-pink-700 shadow-xs font-black'
                      : 'hover:text-gray-900'
                  }`}
                >
                  📊 Comparativo de Dias
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={isLoading}
                  className="p-1.5 text-gray-500 hover:text-pink-600 rounded-xl hover:bg-pink-50 transition-colors cursor-pointer"
                  title="Atualizar dados agora"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* TAB 1: LIVE SHIFT TODAY */}
              {activeTab === 'live' && activeLiveClosing && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-white border border-pink-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-gray-900">
                            Caixa do Dia: {activeLiveClosing.dateFormatted}
                          </h4>
                          {liveData?.isClosedForToday ? (
                            <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-black uppercase">
                              Fechado
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black uppercase animate-pulse">
                              Aberto / Ao Vivo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Horário da loja: <strong>16:00 às 23:00 (Manaus)</strong> • Fechamento automático agendado às <strong>23:00</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(activeLiveClosing)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Enviar resumo completo pelo WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar no WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySummary(activeLiveClosing)}
                        className="px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copiar resumo formatado para a área de transferência"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Resumo</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        title="Imprimir relatório"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadCSV(activeLiveClosing.date)}
                        className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        title="Baixar planilha CSV / Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>

                  {/* Top Financial KPI Metrics Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* TOTAL RECEBIDO */}
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-md shadow-pink-500/20 col-span-2 sm:col-span-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-pink-100 block">
                        Total Efetivamente Recebido
                      </span>
                      <div className="text-2xl sm:text-3xl font-black mt-1">
                        {formatBRL(activeLiveClosing.totalReceived)}
                      </div>
                      <span className="text-[10px] text-pink-100 mt-1 block">
                        Débito + Crédito + PIX + Dinheiro + Outros
                      </span>
                    </div>

                    {/* PEDIDOS CONCLUÍDOS */}
                    <div className="p-4 rounded-3xl bg-white border border-pink-100 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">
                          Pedidos Concluídos
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-black text-gray-900 mt-1">
                        {activeLiveClosing.completedOrders}
                      </div>
                      <span className="text-[11px] text-gray-500 mt-0.5 block">
                        de {activeLiveClosing.totalOrders} pedidos realizados
                      </span>
                    </div>

                    {/* TICKET MÉDIO */}
                    <div className="p-4 rounded-3xl bg-white border border-pink-100 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">
                          Ticket Médio
                        </span>
                        <TrendingUp className="w-4 h-4 text-pink-500" />
                      </div>
                      <div className="text-2xl font-black text-gray-900 mt-1">
                        {formatBRL(activeLiveClosing.averageTicket)}
                      </div>
                      <span className="text-[11px] text-gray-500 mt-0.5 block">
                        por pedido concluído
                      </span>
                    </div>

                    {/* CANCELADOS & PENDENTES */}
                    <div className="p-4 rounded-3xl bg-white border border-pink-100 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">
                          Cancelados / Pendentes
                        </span>
                        <XCircle className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="text-lg font-black text-gray-900 mt-1 flex items-center gap-2">
                        <span className="text-rose-600">{activeLiveClosing.canceledOrders} cancelados</span>
                      </div>
                      <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
                        Pendentes: {formatBRL(activeLiveClosing.pendingPaymentsTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Section 3: Separação por Forma de Pagamento */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span>Separação por Forma de Pagamento</span>
                      </h4>
                      <span className="text-xs text-gray-400 font-medium">
                        Valores apurados em tempo real
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* DÉBITO */}
                      <div className="p-4 rounded-3xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span>Cartão de Débito</span>
                          </span>
                          <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {activeLiveClosing.payments.debit.count} pagamentos
                          </span>
                        </div>
                        <div className="text-xl font-black text-blue-950">
                          {formatBRL(activeLiveClosing.payments.debit.total)}
                        </div>
                        <span className="text-[10px] text-blue-700 mt-1">Recebido na maquininha</span>
                      </div>

                      {/* CRÉDITO */}
                      <div className="p-4 rounded-3xl bg-purple-50/50 border border-purple-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-purple-600" />
                            <span>Cartão de Crédito</span>
                          </span>
                          <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            {activeLiveClosing.payments.credit.count} pagamentos
                          </span>
                        </div>
                        <div className="text-xl font-black text-purple-950">
                          {formatBRL(activeLiveClosing.payments.credit.total)}
                        </div>
                        <span className="text-[10px] text-purple-700 mt-1">À vista ou parcelado</span>
                      </div>

                      {/* PIX */}
                      <div className="p-4 rounded-3xl bg-emerald-50/50 border border-emerald-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-emerald-600" />
                            <span>PIX Direto</span>
                          </span>
                          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            {activeLiveClosing.payments.pix.count} pagamentos
                          </span>
                        </div>
                        <div className="text-xl font-black text-emerald-950">
                          {formatBRL(activeLiveClosing.payments.pix.total)}
                        </div>
                        <span className="text-[10px] text-emerald-700 mt-1">Transferências instantâneas</span>
                      </div>

                      {/* DINHEIRO */}
                      <div className="p-4 rounded-3xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-amber-600" />
                            <span>Dinheiro Físico</span>
                          </span>
                          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {activeLiveClosing.payments.cash.count} pagamentos
                          </span>
                        </div>
                        <div className="text-xl font-black text-amber-950">
                          {formatBRL(activeLiveClosing.payments.cash.total)}
                        </div>
                        <div className="mt-2 pt-2 border-t border-amber-200/60 text-[11px] text-amber-900 space-y-0.5">
                          <div className="flex justify-between">
                            <span>Troco inicial:</span>
                            <strong>{formatBRL(activeLiveClosing.payments.cash.initialFloat)}</strong>
                          </div>
                          <div className="flex justify-between text-amber-950 font-black">
                            <span>Esperado gaveta:</span>
                            <span className="text-emerald-700 font-extrabold">
                              {formatBRL(activeLiveClosing.payments.cash.expectedInDrawer)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fundo de Caixa Inicial Configuration Bar */}
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-gray-500" />
                      <span className="font-bold text-gray-700">
                        Fundo Inicial de Caixa (Abertura da Gaveta):
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.5"
                        value={initialFloatInput}
                        onChange={(e) => setInitialFloatInput(e.target.value)}
                        className="w-24 p-1.5 bg-white border border-gray-300 rounded-xl font-bold text-center outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleUpdateInitialFloat}
                        disabled={isUpdatingFloat}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        {isUpdatingFloat ? 'Salvando...' : 'Atualizar Fundo'}
                      </button>
                    </div>
                  </div>

                  {/* Orders of today table */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                        Pedidos Registrados Hoje ({liveData?.orders.length || 0})
                      </h4>
                      <span className="text-xs text-gray-400">
                        Clique nos botões de status para alterar
                      </span>
                    </div>

                    <div className="bg-white rounded-3xl border border-pink-100 shadow-2xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="p-3">Pedido</th>
                              <th className="p-3">Hora</th>
                              <th className="p-3">Cliente / Tipo</th>
                              <th className="p-3">Itens</th>
                              <th className="p-3">Pagamento</th>
                              <th className="p-3">Total</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {liveData?.orders.map((o) => (
                              <tr key={o.id} className="hover:bg-pink-50/20 transition-colors">
                                <td className="p-3 font-black text-gray-900">{o.id}</td>
                                <td className="p-3 text-gray-500 font-mono">{o.localTime}</td>
                                <td className="p-3">
                                  <span className="font-bold text-gray-900 block">{o.customerName}</span>
                                  <span className="text-[10px] text-pink-600 font-semibold">
                                    {o.deliveryType === 'mesa'
                                      ? `Mesa ${o.tableNumber || '01'}`
                                      : o.deliveryType === 'delivery'
                                      ? 'Delivery'
                                      : 'Retirada'}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-600 max-w-xs truncate">
                                  {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                                </td>
                                <td className="p-3">
                                  {(o.payments || []).map((p, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block mr-1 text-[10px] font-bold uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-700"
                                    >
                                      {p.method}: {formatBRL(p.amount)}
                                    </span>
                                  ))}
                                </td>
                                <td className="p-3 font-black text-gray-900">{formatBRL(o.total)}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                      o.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : o.status === 'canceled'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {o.status === 'completed'
                                      ? 'Concluído'
                                      : o.status === 'canceled'
                                      ? 'Cancelado'
                                      : 'Pendente'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {o.status !== 'completed' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(o.id, 'completed', 'paid')}
                                        className="p-1 hover:bg-emerald-50 text-emerald-600 rounded text-[11px] font-bold cursor-pointer"
                                        title="Marcar como concluído e pago"
                                      >
                                        ✓ Concluir
                                      </button>
                                    )}
                                    {o.status !== 'canceled' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(o.id, 'canceled', 'canceled')}
                                        className="p-1 hover:bg-rose-50 text-rose-600 rounded text-[11px] font-bold cursor-pointer"
                                        title="Cancelar pedido"
                                      >
                                        ✕ Cancelar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Manual Close or Reopen Section */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">
                      Rotina automática do servidor programada diariamente às <strong>23:00</strong>.
                    </div>

                    {!liveData?.isClosedForToday ? (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingManualClose(true)}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-pink-500/20 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Fechar Caixa do Dia Manualmente</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          ✓ Fechado por {activeLiveClosing.closedBy} em {activeLiveClosing.closedAtFormatted}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReopenPromptDate(activeLiveClosing.date)}
                          className="px-3 py-1.5 rounded-xl border border-pink-300 text-pink-700 hover:bg-pink-50 font-bold text-xs cursor-pointer"
                        >
                          Reabrir / Ajustar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: HISTÓRICO DE FECHAMENTOS */}
              {activeTab === 'history' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left List of Dates */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Dias Fechados
                    </h4>
                    <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                      {historyList.map((h) => {
                        const isSelected = h.date === selectedHistoryDate;
                        return (
                          <div
                            key={h.id}
                            onClick={() => setSelectedHistoryDate(h.date)}
                            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'border-pink-500 bg-pink-50/70 shadow-xs'
                                : 'border-gray-200 bg-white hover:border-pink-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-gray-900">{h.dateFormatted}</span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  h.status === 'closed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {h.status === 'closed' ? 'Fechado' : 'Reaberto'}
                              </span>
                            </div>
                            <div className="text-sm font-extrabold text-pink-600 mt-1">
                              {formatBRL(h.totalReceived)}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                              <span>{h.completedOrders} pedidos concluídos</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Detail Card for Selected Date */}
                  <div className="md:col-span-2 space-y-4">
                    {selectedHistory ? (
                      <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              Relatório Detalhado
                            </span>
                            <h4 className="text-xl font-black text-gray-900">
                              Fechamento de {selectedHistory.dateFormatted}
                            </h4>
                            <span className="text-xs text-gray-500">
                              Fechado em {selectedHistory.closedAtFormatted} por {selectedHistory.closedBy}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(selectedHistory)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadCSV(selectedHistory.date)}
                              className="px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                              <span>CSV</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setReopenPromptDate(selectedHistory.date)}
                              className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                            >
                              Reabrir
                            </button>
                          </div>
                        </div>

                        {/* Financial summary metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">
                              Total Recebido
                            </span>
                            <span className="text-lg font-black text-pink-700">
                              {formatBRL(selectedHistory.totalReceived)}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">
                              Pedidos Concluídos
                            </span>
                            <span className="text-lg font-black text-gray-900">
                              {selectedHistory.completedOrders}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">
                              Ticket Médio
                            </span>
                            <span className="text-lg font-black text-gray-900">
                              {formatBRL(selectedHistory.averageTicket)}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">
                              Cancelados
                            </span>
                            <span className="text-lg font-black text-rose-600">
                              {selectedHistory.canceledOrders}
                            </span>
                          </div>
                        </div>

                        {/* Breakdown by Payment Method */}
                        <div className="space-y-2 pt-2">
                          <h5 className="text-xs font-black uppercase text-gray-400">
                            Valores por Forma de Pagamento
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/70">
                              <span className="text-[10px] font-bold text-gray-500 block">Débito</span>
                              <strong className="text-sm font-black text-gray-900 block">
                                {formatBRL(selectedHistory.payments.debit.total)}
                              </strong>
                              <span className="text-[10px] text-gray-400">
                                {selectedHistory.payments.debit.count} pagtos
                              </span>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/70">
                              <span className="text-[10px] font-bold text-gray-500 block">Crédito</span>
                              <strong className="text-sm font-black text-gray-900 block">
                                {formatBRL(selectedHistory.payments.credit.total)}
                              </strong>
                              <span className="text-[10px] text-gray-400">
                                {selectedHistory.payments.credit.count} pagtos
                              </span>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/70">
                              <span className="text-[10px] font-bold text-gray-500 block">PIX</span>
                              <strong className="text-sm font-black text-gray-900 block">
                                {formatBRL(selectedHistory.payments.pix.total)}
                              </strong>
                              <span className="text-[10px] text-gray-400">
                                {selectedHistory.payments.pix.count} pagtos
                              </span>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/70">
                              <span className="text-[10px] font-bold text-gray-500 block">Dinheiro</span>
                              <strong className="text-sm font-black text-gray-900 block">
                                {formatBRL(selectedHistory.payments.cash.total)}
                              </strong>
                              <span className="text-[10px] text-gray-400">
                                {selectedHistory.payments.cash.count} pagtos
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Audit log if present */}
                        {selectedHistory.auditLog && selectedHistory.auditLog.length > 0 && (
                          <div className="pt-2">
                            <h5 className="text-[10px] font-black uppercase text-gray-400 mb-1">
                              Histórico de Alterações / Reaberturas
                            </h5>
                            <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1 text-xs">
                              {selectedHistory.auditLog.map((log, i) => (
                                <div key={i} className="text-amber-900">
                                  <strong>{log.action}</strong> por {log.user}: <em>"{log.reason}"</em>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-400">
                        Selecione uma data para ver os detalhes do fechamento.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: COMPARATIVO DE DIAS */}
              {activeTab === 'compare' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                        Comparativo de Faturamento Entre Dias
                      </h4>
                      <p className="text-xs text-gray-500">
                        Compare o volume de pedidos, faturamento e ticket médio para planejar o estoque.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {historyList.slice(0, 3).map((h) => (
                      <div key={h.id} className="p-4 bg-white rounded-3xl border border-pink-100 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-900">{h.dateFormatted}</span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {h.completedOrders} pedidos
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Recebido</span>
                          <span className="text-xl font-black text-pink-700">{formatBRL(h.totalReceived)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 text-xs space-y-1">
                          <div className="flex justify-between text-gray-500">
                            <span>Ticket médio:</span>
                            <strong>{formatBRL(h.averageTicket)}</strong>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>PIX:</span>
                            <span>{formatBRL(h.payments.pix.total)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Cartões:</span>
                            <span>{formatBRL(h.payments.debit.total + h.payments.credit.total)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Dinheiro:</span>
                            <span>{formatBRL(h.payments.cash.total)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-pink-100 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-gray-500">
                Fechamento diário automático às <strong>23:00</strong> em Manaus.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-xs font-black transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        )}

        {/* Manual Close Confirmation Prompt */}
        {isConfirmingManualClose && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-pink-600">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="text-base font-black text-gray-900">Confirmar Fechamento Manual?</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Você está prestes a fechar o caixa de hoje antes das 23h. Todos os pedidos concluídos serão contabilizados e um relatório oficial será gerado.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingManualClose(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteManualClosing}
                  className="px-4 py-2 bg-pink-600 text-white text-xs font-black rounded-xl hover:bg-pink-700 shadow-md cursor-pointer"
                >
                  Confirmar e Fechar Agora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reopen Shift Prompt */}
        {reopenPromptDate && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <ShieldCheck className="w-6 h-6" />
                <h4 className="text-base font-black text-gray-900">Reabrir Caixa Fechado</h4>
              </div>
              <p className="text-xs text-gray-600">
                Informe o PIN do administrador e a justificativa para reabrir o caixa da data {reopenPromptDate}.
              </p>
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Senha de Administrador (1226)"
                  value={reopenPin}
                  onChange={(e) => setReopenPin(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden"
                />
                <textarea
                  placeholder="Justificativa obrigatória (ex: correção de pedido cancelado após horário)..."
                  rows={2}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenPromptDate(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => handleReopenClosing(reopenPromptDate)}
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-black rounded-xl hover:bg-amber-700 shadow-md cursor-pointer"
                >
                  Autorizar Reabertura
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
