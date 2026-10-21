import { DailyClosing, StoredOrder } from '../types/cashRegister';

const TIMEZONE = 'America/Manaus';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Returns current date and time information strictly in America/Manaus (UTC-4)
 * Safe for both client and server environments (pure Intl API)
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

  const parts = timeStr.split(':');
  const hour = parseInt(parts[0] || '0', 10);
  const minute = parseInt(parts[1] || '0', 10);

  const [year, month, day] = dateStr.split('-');
  const dateFormatted = `${day}/${month}/${year}`;

  return {
    dateStr,
    dateFormatted,
    timeStr,
    hour,
    minute,
    fullDate: d,
  };
}

/**
 * Generates the WhatsApp summary message for a cash register closing
 * Follows the exact required template
 */
export function generateWhatsAppClosingSummary(closing: DailyClosing): string {
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
