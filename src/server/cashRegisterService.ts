import fs from 'fs';
import path from 'path';
import {
  StoredOrder,
  DailyClosing,
  CashRegisterSettings,
  ShiftStatusLive,
  OrderPayment,
} from '../types/cashRegister';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CLOSINGS_FILE = path.join(DATA_DIR, 'closings.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const TIMEZONE = 'America/Manaus';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Returns current date and time information strictly in America/Manaus (UTC-4)
 */
export function getManausDateTime(dateInput?: Date | string): {
  dateStr: string; // YYYY-MM-DD
  dateFormatted: string; // DD/MM/YYYY
  timeStr: string; // HH:mm:ss
  hour: number;
  minute: number;
  fullDate: Date;
} {
  const d = dateInput ? new Date(dateInput) : new Date();

  const formatterDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatterDate.format(d); // "YYYY-MM-DD"

  const formatterTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const timeStr = formatterTime.format(d); // "HH:mm:ss"

  const parts = formatterTime.formatToParts(d);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

  const [y, m, day] = dateStr.split('-');
  const dateFormatted = `${day}/${m}/${y}`;

  return {
    dateStr,
    dateFormatted,
    timeStr,
    hour,
    minute,
    fullDate: d,
  };
}

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------
export function getSettings(): CashRegisterSettings {
  ensureDataDir();
  const defaultSettings: CashRegisterSettings = {
    initialFloatDefault: 100.0,
    adminPin: '1226',
    autoCloseTime: '23:00',
    openTime: '16:00',
    timezone: TIMEZONE,
  };

  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf-8');
    return defaultSettings;
  }

  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<CashRegisterSettings>): CashRegisterSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

// -------------------------------------------------------------
// ORDERS STORAGE & OPERATIONS
// -------------------------------------------------------------
export function getAllOrders(): StoredOrder[] {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) {
    // Seed with realistic demo orders for the current date
    const seeded = createSeedOrders();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAllOrders(orders: StoredOrder[]): void {
  ensureDataDir();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

export function createOrder(
  data: Omit<StoredOrder, 'id' | 'orderNumber' | 'createdAt' | 'localDate' | 'localTime'>
): StoredOrder {
  const orders = getAllOrders();
  const manausNow = getManausDateTime();

  const nextOrderNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber || 0)) + 1 : 1001;
  const newOrder: StoredOrder = {
    ...data,
    id: `#${nextOrderNumber}`,
    orderNumber: nextOrderNumber,
    createdAt: new Date().toISOString(),
    localDate: manausNow.dateStr,
    localTime: manausNow.timeStr,
    status: data.status || 'completed',
    paymentStatus: data.paymentStatus || 'paid',
  };

  orders.unshift(newOrder);
  saveAllOrders(orders);
  return newOrder;
}

export function updateOrderStatus(
  orderId: string,
  status: 'completed' | 'canceled' | 'pending',
  paymentStatus?: 'paid' | 'pending' | 'canceled'
): StoredOrder | null {
  const orders = getAllOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;

  orders[idx].status = status;
  if (paymentStatus) {
    orders[idx].paymentStatus = paymentStatus;
    // update payments array status if needed
    orders[idx].payments = orders[idx].payments.map((p) => ({
      ...p,
      status: paymentStatus === 'paid' ? 'completed' : paymentStatus === 'pending' ? 'pending' : 'pending',
    }));
  }

  saveAllOrders(orders);
  return orders[idx];
}

// -------------------------------------------------------------
// CLOSINGS STORAGE & OPERATIONS
// -------------------------------------------------------------
export function getAllClosings(): DailyClosing[] {
  ensureDataDir();
  if (!fs.existsSync(CLOSINGS_FILE)) {
    // Seed with previous days' closings for demonstration
    const seeded = createSeedClosings();
    fs.writeFileSync(CLOSINGS_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const raw = fs.readFileSync(CLOSINGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAllClosings(closings: DailyClosing[]): void {
  ensureDataDir();
  fs.writeFileSync(CLOSINGS_FILE, JSON.stringify(closings, null, 2), 'utf-8');
}

/**
 * Calculates financial metrics and payment method breakdown for a set of orders
 */
export function calculateClosingMetrics(
  dateStr: string,
  ordersForDate: StoredOrder[],
  initialFloat: number = 100.0,
  closedBy: string = 'Sistema Automático (23:00)',
  isAutomatic: boolean = true
): DailyClosing {
  const [y, m, d] = dateStr.split('-');
  const dateFormatted = `${d}/${m}/${y}`;
  const manausNow = getManausDateTime();

  const totalOrders = ordersForDate.length;
  const completedOrders = ordersForDate.filter((o) => o.status === 'completed');
  const canceledOrders = ordersForDate.filter((o) => o.status === 'canceled');
  const pendingOrders = ordersForDate.filter((o) => o.status === 'pending');

  let grossRevenue = 0;
  let totalDiscounts = 0;
  let totalDeliveryFees = 0;
  let canceledAmount = 0;
  let pendingPaymentsTotal = 0;

  // Payment breakdown buckets
  const debit = { count: 0, total: 0 };
  const credit = { count: 0, total: 0 };
  const pix = { count: 0, total: 0 };
  const cash = { count: 0, total: 0 };
  const otherBreakdown: Record<string, { count: number; total: number }> = {};
  let otherCount = 0;
  let otherTotal = 0;

  // Process completed orders
  for (const order of completedOrders) {
    grossRevenue += order.subtotal;
    totalDiscounts += order.discount || 0;
    totalDeliveryFees += order.deliveryFee || 0;

    // Check payments in order
    const payments = order.payments && order.payments.length > 0
      ? order.payments
      : [
          {
            method: (order as any).paymentMethod || 'pix',
            amount: order.total,
            status: order.paymentStatus === 'pending' ? 'pending' : 'completed',
          } as OrderPayment,
        ];

    for (const p of payments) {
      if (p.status === 'pending') {
        pendingPaymentsTotal += p.amount;
        continue;
      }

      // Process received amounts by payment method
      switch (p.method) {
        case 'debit':
          debit.count += 1;
          debit.total += p.amount;
          break;
        case 'credit':
          credit.count += 1;
          credit.total += p.amount;
          break;
        case 'pix':
          pix.count += 1;
          pix.total += p.amount;
          break;
        case 'cash':
          cash.count += 1;
          cash.total += p.amount;
          break;
        default: {
          otherCount += 1;
          otherTotal += p.amount;
          const label = p.label || 'Outros';
          if (!otherBreakdown[label]) {
            otherBreakdown[label] = { count: 0, total: 0 };
          }
          otherBreakdown[label].count += 1;
          otherBreakdown[label].total += p.amount;
          break;
        }
      }
    }
  }

  // Canceled and Pending amounts calculation
  for (const order of canceledOrders) {
    canceledAmount += order.total;
  }
  for (const order of pendingOrders) {
    pendingPaymentsTotal += order.total;
  }

  // Formula as required: debit + credit + pix + cash + other = totalReceived
  const totalReceived = debit.total + credit.total + pix.total + cash.total + otherTotal;

  // Average ticket
  const completedCount = completedOrders.length;
  const averageTicket = completedCount > 0 ? totalReceived / completedCount : 0;

  return {
    id: `FECH-${dateStr}`,
    date: dateStr,
    dateFormatted,
    closedAt: new Date().toISOString(),
    closedAtFormatted: `${dateFormatted} às ${manausNow.timeStr.substring(0, 5)}`,
    closedBy,
    isAutomatic,
    status: 'closed',
    totalOrders,
    completedOrders: completedCount,
    canceledOrders: canceledOrders.length,
    pendingOrders: pendingOrders.length,
    grossRevenue,
    totalDiscounts,
    totalDeliveryFees,
    totalReceived,
    averageTicket,
    payments: {
      debit,
      credit,
      pix,
      cash: {
        ...cash,
        initialFloat,
        expectedInDrawer: cash.total + initialFloat,
      },
      other: {
        count: otherCount,
        total: otherTotal,
        breakdown: otherBreakdown,
      },
    },
    pendingPaymentsTotal,
    canceledAmount,
    initialFloat,
    orderIds: ordersForDate.map((o) => o.id),
  };
}

/**
 * Executes closing for a given date. Idempotent: does not overwrite if already closed,
 * unless forced by admin.
 */
export function executeDailyClosing(
  targetDateStr?: string,
  closedBy: string = 'Sistema Automático (23:00)',
  isAutomatic: boolean = true,
  force: boolean = false,
  customInitialFloat?: number
): { success: boolean; message: string; closing: DailyClosing } {
  const manausNow = getManausDateTime();
  const dateStr = targetDateStr || manausNow.dateStr;

  const closings = getAllClosings();
  const existingIndex = closings.findIndex((c) => c.date === dateStr);

  if (existingIndex !== -1 && !force && closings[existingIndex].status === 'closed') {
    return {
      success: false,
      message: `O caixa da data ${dateStr} já foi fechado anteriormente às ${closings[existingIndex].closedAtFormatted}.`,
      closing: closings[existingIndex],
    };
  }

  const allOrders = getAllOrders();
  const ordersForDate = allOrders.filter((o) => o.localDate === dateStr);
  const settings = getSettings();
  const initialFloat = customInitialFloat !== undefined ? customInitialFloat : settings.initialFloatDefault;

  const newClosing = calculateClosingMetrics(dateStr, ordersForDate, initialFloat, closedBy, isAutomatic);

  // Mark orders as shift closed
  const updatedOrders = allOrders.map((o) => {
    if (o.localDate === dateStr) {
      return { ...o, shiftClosedId: newClosing.id };
    }
    return o;
  });
  saveAllOrders(updatedOrders);

  if (existingIndex !== -1) {
    // Keep audit log if reopening or re-closing
    newClosing.auditLog = [
      ...(closings[existingIndex].auditLog || []),
      {
        action: 'REFECHAMENTO',
        timestamp: new Date().toISOString(),
        user: closedBy,
        reason: 'Recalculado e fechado pelo administrador',
      },
    ];
    closings[existingIndex] = newClosing;
  } else {
    closings.unshift(newClosing);
  }

  saveAllClosings(closings);

  return {
    success: true,
    message: `Fechamento do dia ${newClosing.dateFormatted} realizado com sucesso!`,
    closing: newClosing,
  };
}

/**
 * Allows authorized reopening of a closed shift with audit trail
 */
export function reopenDailyClosing(
  dateStr: string,
  user: string,
  reason: string
): { success: boolean; message: string; closing?: DailyClosing } {
  const closings = getAllClosings();
  const idx = closings.findIndex((c) => c.date === dateStr);
  if (idx === -1) {
    return { success: false, message: `Fechamento para a data ${dateStr} não encontrado.` };
  }

  const closing = closings[idx];
  closing.status = 'reopened';
  closing.auditLog = closing.auditLog || [];
  closing.auditLog.push({
    action: 'REABERTURA',
    timestamp: new Date().toISOString(),
    user,
    reason,
  });

  saveAllClosings(closings);
  return {
    success: true,
    message: `Caixa do dia ${closing.dateFormatted} reaberto com sucesso.`,
    closing,
  };
}

/**
 * Returns the live shift status for today in America/Manaus
 */
export function getLiveShiftStatus(): ShiftStatusLive {
  const manausNow = getManausDateTime();
  const settings = getSettings();
  const allOrders = getAllOrders();
  const todayOrders = allOrders.filter((o) => o.localDate === manausNow.dateStr);

  const closings = getAllClosings();
  const existingClosing = closings.find((c) => c.date === manausNow.dateStr && c.status === 'closed');

  const isStoreOpen = manausNow.hour >= 16 && manausNow.hour < 23;
  const isClosedForToday = !!existingClosing;

  // Real-time live calculation of metrics for today
  const liveClosing = calculateClosingMetrics(
    manausNow.dateStr,
    todayOrders,
    settings.initialFloatDefault,
    'Ao Vivo (Não Fechado)',
    false
  );

  return {
    localDate: manausNow.dateStr,
    localTime: manausNow.timeStr,
    isStoreOpen,
    isClosedForToday,
    existingClosing,
    liveClosing: existingClosing || liveClosing,
    orders: todayOrders,
    settings,
  };
}

/**
 * Generates the WhatsApp summary strictly according to prompt specification:
 * 
 * FECHAMENTO DE CAIXA — CLASH BURGUER  
 * Data: 21/10/2026
 * 
 * Pedidos concluídos: 35
 * 
 * 💳 Cartão de débito: R$ 250,00  
 * 💳 Cartão de crédito: R$ 320,00  
 * 📲 PIX: R$ 480,00  
 * 💵 Dinheiro: R$ 150,00
 * 
 * TOTAL RECEBIDO: R$ 1.200,00
 * 
 * Pedidos cancelados: 2  
 * Pagamentos pendentes: R$ 0,00
 */
export function generateWhatsAppClosingSummary(closing: DailyClosing): string {
  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  let text = `FECHAMENTO DE CAIXA — CLASH BURGUER\n`;
  text += `Data: ${closing.dateFormatted}\n\n`;

  text += `Pedidos concluídos: ${closing.completedOrders}\n\n`;

  text += `💳 Cartão de débito: ${formatBRL(closing.payments.debit.total)}\n`;
  text += `💳 Cartão de crédito: ${formatBRL(closing.payments.credit.total)}\n`;
  text += `📲 PIX: ${formatBRL(closing.payments.pix.total)}\n`;
  text += `💵 Dinheiro: ${formatBRL(closing.payments.cash.total)}\n`;

  if (closing.payments.other && closing.payments.other.total > 0) {
    text += `🏷️ Outras formas: ${formatBRL(closing.payments.other.total)}\n`;
  }

  text += `\n*TOTAL RECEBIDO: ${formatBRL(closing.totalReceived)}*\n\n`;

  text += `Pedidos cancelados: ${closing.canceledOrders}\n`;
  text += `Pagamentos pendentes: ${formatBRL(closing.pendingPaymentsTotal)}\n`;

  if (closing.payments.cash.initialFloat > 0) {
    text += `\n💵 Fundo Inicial de Caixa: ${formatBRL(closing.payments.cash.initialFloat)}\n`;
    text += `💰 Total Esperado no Caixa Físico: ${formatBRL(closing.payments.cash.expectedInDrawer)}\n`;
  }

  text += `📊 Ticket Médio: ${formatBRL(closing.averageTicket)}\n`;
  text += `🕒 Fechado em: ${closing.closedAtFormatted} por ${closing.closedBy}`;

  return text;
}

/**
 * Generates CSV / Excel export string for a closing
 */
export function generateClosingCSV(closing: DailyClosing, orders: StoredOrder[]): string {
  const formatNum = (v: number) => v.toFixed(2).replace('.', ',');
  let csv = `RELATÓRIO DE FECHAMENTO DE CAIXA - CLASH BURGUER\n`;
  csv += `Data;${closing.dateFormatted}\n`;
  csv += `Fechado em;${closing.closedAtFormatted}\n`;
  csv += `Responsável;${closing.closedBy}\n`;
  csv += `Status;${closing.status === 'closed' ? 'Fechado' : 'Reaberto'}\n\n`;

  csv += `RESUMO FINANCEIRO\n`;
  csv += `Indicador;Valor\n`;
  csv += `Total de Pedidos;${closing.totalOrders}\n`;
  csv += `Pedidos Concluídos;${closing.completedOrders}\n`;
  csv += `Pedidos Cancelados;${closing.canceledOrders}\n`;
  csv += `Pedidos Pendentes;${closing.pendingOrders}\n`;
  csv += `Faturamento Bruto;R$ ${formatNum(closing.grossRevenue)}\n`;
  csv += `Total de Descontos;R$ ${formatNum(closing.totalDiscounts)}\n`;
  csv += `Total Taxas de Entrega;R$ ${formatNum(closing.totalDeliveryFees)}\n`;
  csv += `TOTAL RECEBIDO;R$ ${formatNum(closing.totalReceived)}\n`;
  csv += `Ticket Médio;R$ ${formatNum(closing.averageTicket)}\n\n`;

  csv += `SEPARAÇÃO POR FORMA DE PAGAMENTO\n`;
  csv += `Modalidade;Qtd Pagamentos;Total Recebido\n`;
  csv += `Cartão de Débito;${closing.payments.debit.count};R$ ${formatNum(closing.payments.debit.total)}\n`;
  csv += `Cartão de Crédito;${closing.payments.credit.count};R$ ${formatNum(closing.payments.credit.total)}\n`;
  csv += `PIX;${closing.payments.pix.count};R$ ${formatNum(closing.payments.pix.total)}\n`;
  csv += `Dinheiro;${closing.payments.cash.count};R$ ${formatNum(closing.payments.cash.total)}\n`;
  csv += `Outras Formas;${closing.payments.other.count};R$ ${formatNum(closing.payments.other.total)}\n`;
  csv += `Fundo Inicial de Caixa;1;R$ ${formatNum(closing.payments.cash.initialFloat)}\n`;
  csv += `Total Esperado Caixa Físico;-;R$ ${formatNum(closing.payments.cash.expectedInDrawer)}\n\n`;

  csv += `DETALHAMENTO DE PEDIDOS DA DATA\n`;
  csv += `Pedido;Hora;Cliente;Tipo;Status;Pagamento;Subtotal;Taxa;Total\n`;
  for (const o of orders) {
    const payStr = (o.payments || []).map((p) => `${p.method.toUpperCase()}: R$ ${formatNum(p.amount)}`).join(' | ');
    csv += `${o.id};${o.localTime};"${o.customerName}";${o.deliveryType};${o.status};"${payStr}";R$ ${formatNum(o.subtotal)};R$ ${formatNum(o.deliveryFee)};R$ ${formatNum(o.total)}\n`;
  }

  return csv;
}

// -------------------------------------------------------------
// SEED GENERATION (Realistic data for immediate testing)
// -------------------------------------------------------------
function createSeedOrders(): StoredOrder[] {
  const manausNow = getManausDateTime();
  const today = manausNow.dateStr;

  // Compute yesterday and day before
  const yestDate = new Date();
  yestDate.setDate(yestDate.getDate() - 1);
  const yestStr = getManausDateTime(yestDate).dateStr;

  return [
    {
      id: '#1001',
      orderNumber: 1001,
      createdAt: `${today}T20:15:00.000Z`,
      localDate: today,
      localTime: '16:15:00',
      customerName: 'Carlos Eduardo',
      customerPhone: '(97) 98401-2233',
      deliveryType: 'delivery',
      items: [
        { name: 'Clash Smash Duplo', quantity: 2, price: 18.0, itemTotalPrice: 36.0 },
        { name: 'Batata Frita Tradicional', quantity: 1, price: 12.0, itemTotalPrice: 12.0 },
        { name: 'Coca-Cola Lata 350ml', quantity: 2, price: 5.0, itemTotalPrice: 10.0 },
      ],
      subtotal: 58.0,
      deliveryFee: 2.0,
      discount: 0,
      total: 60.0,
      status: 'completed',
      paymentStatus: 'paid',
      payments: [{ method: 'pix', amount: 60.0, status: 'completed' }],
    },
    {
      id: '#1002',
      orderNumber: 1002,
      createdAt: `${today}T20:45:00.000Z`,
      localDate: today,
      localTime: '16:45:00',
      customerName: 'Mariana Silva',
      customerPhone: '(97) 98114-5566',
      deliveryType: 'mesa',
      tableNumber: '02',
      items: [
        { name: 'Clash Bacon', quantity: 2, price: 20.0, itemTotalPrice: 40.0 },
        { name: 'Suco Natural de Acerola', quantity: 2, price: 6.0, itemTotalPrice: 12.0 },
      ],
      subtotal: 52.0,
      deliveryFee: 0,
      discount: 0,
      total: 52.0,
      status: 'completed',
      paymentStatus: 'paid',
      payments: [{ method: 'credit', amount: 52.0, status: 'completed' }],
    },
    {
      id: '#1003',
      orderNumber: 1003,
      createdAt: `${today}T21:10:00.000Z`,
      localDate: today,
      localTime: '17:10:00',
      customerName: 'João Pedro Ramos',
      customerPhone: '(97) 99122-8877',
      deliveryType: 'delivery',
      items: [
        { name: 'Kikão Especial', quantity: 3, price: 10.0, itemTotalPrice: 30.0 },
        { name: 'Água Mineral 300ml', quantity: 2, price: 3.0, itemTotalPrice: 6.0 },
      ],
      subtotal: 36.0,
      deliveryFee: 2.0,
      discount: 0,
      total: 38.0,
      status: 'completed',
      paymentStatus: 'paid',
      payments: [{ method: 'cash', amount: 38.0, status: 'completed' }],
      cashChangeFor: 'R$ 50,00',
    },
    {
      id: '#1004',
      orderNumber: 1004,
      createdAt: `${today}T21:40:00.000Z`,
      localDate: today,
      localTime: '17:40:00',
      customerName: 'Beatriz Lima',
      customerPhone: '(97) 98833-4411',
      deliveryType: 'mesa',
      tableNumber: '01',
      items: [
        { name: 'Clash Calabresa', quantity: 1, price: 18.0, itemTotalPrice: 18.0 },
        { name: 'Clash Salsicha', quantity: 1, price: 18.0, itemTotalPrice: 18.0 },
        { name: 'Bolo Simples', quantity: 1, price: 6.0, itemTotalPrice: 6.0 },
      ],
      subtotal: 42.0,
      deliveryFee: 0,
      discount: 0,
      total: 42.0,
      status: 'completed',
      paymentStatus: 'paid',
      payments: [{ method: 'debit', amount: 42.0, status: 'completed' }],
    },
    {
      id: '#1005',
      orderNumber: 1005,
      createdAt: `${today}T22:05:00.000Z`,
      localDate: today,
      localTime: '18:05:00',
      customerName: 'Renato Oliveira',
      customerPhone: '(97) 98221-9988',
      deliveryType: 'delivery',
      items: [
        { name: 'Clash Supremo', quantity: 2, price: 25.0, itemTotalPrice: 50.0 },
        { name: 'Batata com Cheddar e Bacon', quantity: 1, price: 22.0, itemTotalPrice: 22.0 },
      ],
      subtotal: 72.0,
      deliveryFee: 2.0,
      discount: 0,
      total: 74.0,
      status: 'completed',
      paymentStatus: 'paid',
      // Pagamento dividido / split: R$ 34 no PIX e R$ 40 no Crédito
      payments: [
        { method: 'pix', amount: 34.0, status: 'completed' },
        { method: 'credit', amount: 40.0, status: 'completed' },
      ],
    },
    {
      id: '#1006',
      orderNumber: 1006,
      createdAt: `${today}T22:30:00.000Z`,
      localDate: today,
      localTime: '18:30:00',
      customerName: 'Cliente Cancelado Teste',
      customerPhone: '(97) 98111-0000',
      deliveryType: 'delivery',
      items: [{ name: 'Clash Smash', quantity: 1, price: 15.0, itemTotalPrice: 15.0 }],
      subtotal: 15.0,
      deliveryFee: 2.0,
      discount: 0,
      total: 17.0,
      status: 'canceled',
      paymentStatus: 'canceled',
      payments: [{ method: 'pix', amount: 17.0, status: 'pending' }],
      orderNotes: 'Cliente desistiu antes do preparo',
    },
    {
      id: '#1007',
      orderNumber: 1007,
      createdAt: `${today}T23:00:00.000Z`,
      localDate: today,
      localTime: '19:00:00',
      customerName: 'Lucas Ferreira',
      customerPhone: '(97) 98455-7722',
      deliveryType: 'mesa',
      tableNumber: '03',
      items: [
        { name: 'Kikão Tradicional Simples', quantity: 2, price: 6.0, itemTotalPrice: 12.0 },
        { name: 'Suco Natural de Maracujá', quantity: 2, price: 6.0, itemTotalPrice: 12.0 },
      ],
      subtotal: 24.0,
      deliveryFee: 0,
      discount: 0,
      total: 24.0,
      status: 'completed',
      paymentStatus: 'paid',
      payments: [{ method: 'cash', amount: 24.0, status: 'completed' }],
    },
  ];
}

function createSeedClosings(): DailyClosing[] {
  // Create 2 realistic previous days' closings for demonstration and comparison
  const d1 = new Date();
  d1.setDate(d1.getDate() - 1);
  const m1 = getManausDateTime(d1);

  const d2 = new Date();
  d2.setDate(d2.getDate() - 2);
  const m2 = getManausDateTime(d2);

  return [
    {
      id: `FECH-${m1.dateStr}`,
      date: m1.dateStr,
      dateFormatted: m1.dateFormatted,
      closedAt: `${m1.dateStr}T23:00:00.000Z`,
      closedAtFormatted: `${m1.dateFormatted} às 23:00`,
      closedBy: 'Sistema Automático (23:00)',
      isAutomatic: true,
      status: 'closed',
      totalOrders: 32,
      completedOrders: 30,
      canceledOrders: 2,
      pendingOrders: 0,
      grossRevenue: 1140.0,
      totalDiscounts: 0,
      totalDeliveryFees: 60.0,
      totalReceived: 1200.0,
      averageTicket: 40.0,
      payments: {
        debit: { count: 6, total: 250.0 },
        credit: { count: 8, total: 320.0 },
        pix: { count: 12, total: 480.0 },
        cash: {
          count: 4,
          total: 150.0,
          initialFloat: 100.0,
          expectedInDrawer: 250.0,
        },
        other: { count: 0, total: 0 },
      },
      pendingPaymentsTotal: 0,
      canceledAmount: 70.0,
      initialFloat: 100.0,
      orderIds: [],
    },
    {
      id: `FECH-${m2.dateStr}`,
      date: m2.dateStr,
      dateFormatted: m2.dateFormatted,
      closedAt: `${m2.dateStr}T23:00:00.000Z`,
      closedAtFormatted: `${m2.dateFormatted} às 23:00`,
      closedBy: 'Sistema Automático (23:00)',
      isAutomatic: true,
      status: 'closed',
      totalOrders: 28,
      completedOrders: 27,
      canceledOrders: 1,
      pendingOrders: 0,
      grossRevenue: 980.0,
      totalDiscounts: 0,
      totalDeliveryFees: 54.0,
      totalReceived: 1034.0,
      averageTicket: 38.3,
      payments: {
        debit: { count: 5, total: 210.0 },
        credit: { count: 7, total: 290.0 },
        pix: { count: 11, total: 414.0 },
        cash: {
          count: 4,
          total: 120.0,
          initialFloat: 100.0,
          expectedInDrawer: 220.0,
        },
        other: { count: 0, total: 0 },
      },
      pendingPaymentsTotal: 0,
      canceledAmount: 35.0,
      initialFloat: 100.0,
      orderIds: [],
    },
  ];
}
