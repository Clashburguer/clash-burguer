import { CartItem, CustomerData, RestaurantInfo } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function buildWhatsAppMessage(
  cart: CartItem[],
  customer: CustomerData,
  restaurant: RestaurantInfo,
  deliveryFee: number,
  discount: number = 0
): string {
  const isMesa = customer.deliveryType === 'mesa' || !!customer.tableNumber;
  const tableDisplay = customer.tableNumber || '01';
  const subtotal = cart.reduce((acc, item) => acc + item.itemTotalPrice, 0);
  const actualDeliveryFee = (!isMesa && customer.deliveryType === 'delivery') ? deliveryFee : 0;
  const grandTotal = Math.max(0, subtotal + actualDeliveryFee - discount);
  const orderId = Math.floor(1000 + Math.random() * 9000);
  const dateStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Identification based on order mode
  let text = '';
  if (isMesa) {
    text += `🍔 *PEDIDO NA MESA | Mesa: ${tableDisplay}*\n`;
  } else {
    text += `🛵 *PEDIDO DELIVERY*\n`;
  }
  text += `⏰ Horário: ${dateStr} • #${orderId}\n`;
  
  const currentHour = new Date().getHours();
  if (currentHour < 16 || currentHour >= 23) {
    text += `⚠️ *Aviso: Pedido enviado com a loja fechada. (Atendimento retorna às 16:00)*\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (isMesa) {
    text += `👤 *DADOS DO PEDIDO NA MESA*\n`;
    text += `• Identificação: *🍔 PEDIDO NA MESA | Mesa: ${tableDisplay}*\n`;
    text += `• Cliente: *${customer.name.trim()}*\n`;
    if (customer.phone && customer.phone.trim()) {
      text += `• Contato: *${customer.phone.trim()}*\n`;
    }
    text += `\n`;
  } else {
    text += `👤 *DADOS DO CLIENTE*\n`;
    text += `• Nome: *${customer.name.trim()}*\n`;
    text += `• Contato: *${customer.phone.trim()}*\n`;
    text += `• Modalidade: *${customer.deliveryType === 'delivery' ? '🛵 PEDIDO DELIVERY' : '🏬 RETIRADA NO BALCÃO'}*\n\n`;

    if (customer.deliveryType === 'delivery') {
      text += `📍 *ENDEREÇO DE ENTREGA*\n`;
      text += `• Bairro: ${customer.neighborhood.trim()}\n`;
      text += `• Rua/Av: ${customer.street.trim()}, Nº ${customer.number.trim()}\n`;
      if (customer.complement.trim()) {
        text += `• Complemento: ${customer.complement.trim()}\n`;
      }
      if (customer.reference.trim()) {
        text += `• Ponto de Referência: ${customer.reference.trim()}\n`;
      }
      text += `\n`;
    }
  }

  text += `📋 *ITENS DO PEDIDO*\n`;
  cart.forEach((item, index) => {
    text += `*${item.quantity}x ${item.product.name}* (${formatCurrency(item.product.price)} un) = *${formatCurrency(item.itemTotalPrice)}*\n`;
    
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      text += `   ↳ Adicionais:\n`;
      item.selectedAddons.forEach((addon) => {
        text += `      + ${addon.name} (+${formatCurrency(addon.price)})\n`;
      });
    }
    if (item.notes && item.notes.trim()) {
      text += `   ↳ Obs: _"${item.notes.trim()}"_\n`;
    }
    
    if (index < cart.length - 1) {
      text += `\n`;
    }
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *RESUMO DE VALORES*\n`;
  text += `• Subtotal dos itens: ${formatCurrency(subtotal)}\n`;
  if (isMesa) {
    text += `• Taxa de entrega: Grátis (Consumo no Local)\n`;
  } else if (customer.deliveryType === 'delivery') {
    text += `• Taxa de entrega: ${formatCurrency(actualDeliveryFee)}\n`;
  } else {
    text += `• Taxa de entrega: Grátis (Retirada)\n`;
  }
  if (discount > 0) {
    text += `• Desconto: -${formatCurrency(discount)}\n`;
  }
  text += `• *TOTAL DO PEDIDO: ${formatCurrency(grandTotal)}*\n\n`;

  text += `💳 *FORMA DE PAGAMENTO*\n`;
  switch (customer.paymentMethod) {
    case 'pix':
      text += `• PIX (Chave: ${restaurant.pixKey})\n`;
      break;
    case 'credit':
      text += isMesa 
        ? `• Cartão de Crédito (Pagamento na mesa/balcão)\n` 
        : `• Cartão de Crédito (Levar maquininha)\n`;
      break;
    case 'debit':
      text += isMesa 
        ? `• Cartão de Débito (Pagamento na mesa/balcão)\n` 
        : `• Cartão de Débito (Levar maquininha)\n`;
      break;
    case 'cash':
      text += `• Dinheiro`;
      if (customer.cashChangeFor && customer.cashChangeFor.trim()) {
        text += ` (Troco para ${customer.cashChangeFor.trim()})\n`;
      } else {
        text += ` (Não precisa de troco)\n`;
      }
      break;
  }

  if (customer.orderNotes && customer.orderNotes.trim()) {
    text += `\n📝 *Observações gerais do pedido:*\n_${customer.orderNotes.trim()}_\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Aguardando a confirmação da Clash Burguer! 🚀`;

  return text;
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  // Clean phone number: remove non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  // wa.me URL
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
