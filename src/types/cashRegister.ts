export type PaymentMethodType = 'debit' | 'credit' | 'pix' | 'cash' | 'other';

export interface OrderPayment {
  method: PaymentMethodType;
  amount: number;
  label?: string; // e.g. "Vale-Refeição", "Sodexo", "Pagamento Misto"
  status: 'completed' | 'pending';
}

export interface StoredOrderItem {
  name: string;
  quantity: number;
  price: number;
  itemTotalPrice: number;
  notes?: string;
}

export interface StoredOrder {
  id: string; // e.g. "#1042"
  orderNumber: number;
  createdAt: string; // ISO string
  localDate: string; // YYYY-MM-DD in America/Manaus
  localTime: string; // HH:mm:ss in America/Manaus
  customerName: string;
  customerPhone?: string;
  deliveryType: 'delivery' | 'pickup' | 'mesa';
  tableNumber?: string;
  items: StoredOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'completed' | 'canceled' | 'pending';
  paymentStatus: 'paid' | 'pending' | 'canceled';
  payments: OrderPayment[];
  orderNotes?: string;
  cashChangeFor?: string;
  shiftClosedId?: string; // id of closing record if closed
}

export interface PaymentSummary {
  count: number;
  total: number;
}

export interface CashPaymentSummary extends PaymentSummary {
  initialFloat: number; // Fundo de caixa / troco inicial
  expectedInDrawer: number; // total em dinheiro + initialFloat
}

export interface DailyClosing {
  id: string; // e.g. "FECH-2026-10-21"
  date: string; // YYYY-MM-DD (America/Manaus)
  dateFormatted: string; // e.g. "21/10/2026"
  closedAt: string; // ISO
  closedAtFormatted: string; // e.g. "21/10/2026 às 23:00"
  closedBy: string; // "Sistema Automático (23:00)" or "Administrador"
  isAutomatic: boolean;
  status: 'closed' | 'reopened';
  
  // Resumo de contagem de pedidos
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  pendingOrders: number;
  
  // Resumo financeiro
  grossRevenue: number; // Soma dos itens de pedidos concluídos
  totalDiscounts: number;
  totalDeliveryFees: number;
  totalReceived: number; // Total recebido (débito + crédito + pix + dinheiro + outros de concluídos pagos)
  averageTicket: number; // totalReceived / completedOrders
  
  // Formas de pagamento
  payments: {
    debit: PaymentSummary;
    credit: PaymentSummary;
    pix: PaymentSummary;
    cash: CashPaymentSummary;
    other: PaymentSummary & {
      breakdown?: Record<string, { count: number; total: number }>;
    };
  };
  
  pendingPaymentsTotal: number;
  canceledAmount: number;
  initialFloat: number;
  
  notes?: string;
  auditLog?: {
    action: string;
    timestamp: string;
    user: string;
    reason: string;
  }[];
  
  orderIds: string[];
}

export interface CashRegisterSettings {
  initialFloatDefault: number; // default opening cash float
  adminPin: string; // default admin PIN (e.g. "1234")
  autoCloseTime: string; // "23:00"
  openTime: string; // "16:00"
  timezone: string; // "America/Manaus"
}

export interface ShiftStatusLive {
  localDate: string;
  localTime: string;
  isStoreOpen: boolean;
  isClosedForToday: boolean;
  existingClosing?: DailyClosing;
  liveClosing: DailyClosing;
  orders: StoredOrder[];
  settings: CashRegisterSettings;
}
