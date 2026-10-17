export interface StoreStatus {
  isOpen: boolean;
  statusText: string;
  nextOpenText: string;
  closedMessage: string;
  currentHour: number;
}

export function checkStoreStatus(): StoreStatus {
  const now = new Date();
  const currentHour = now.getHours();

  // Clash Burguer is open from 16:00 (4 PM) to 23:00 (11 PM)
  // At 23:00, the store closes and reopens at 16:00 the next day.
  const isOpen = currentHour >= 16 && currentHour < 23;

  if (isOpen) {
    return {
      isOpen: true,
      statusText: 'Aberto para Pedidos',
      nextOpenText: 'Fecha às 23:00',
      closedMessage: '',
      currentHour,
    };
  }

  return {
    isOpen: false,
    statusText: 'Fechado no momento',
    nextOpenText: 'Abre hoje às 16:00',
    closedMessage: 'Estamos fechados no momento e retornaremos novamente no outro dia às 16:00 da tarde.',
    currentHour,
  };
}
