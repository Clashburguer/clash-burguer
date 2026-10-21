export interface StoreStatus {
  isOpen: boolean;
  statusText: string;
  nextOpenText: string;
  closedMessage: string;
  currentHour: number;
  timezone: string;
}

export function getManausHour(): number {
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Manaus',
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return new Date().getHours();
  }
}

export function checkStoreStatus(): StoreStatus {
  const currentHour = getManausHour();

  // Clash Burguer is open from 16:00 (4 PM) to 23:00 (11 PM) Manaus time (UTC-4)
  // At 23:00, store closes and reopens at 16:00 next day.
  const isOpen = currentHour >= 16 && currentHour < 23;

  if (isOpen) {
    return {
      isOpen: true,
      statusText: 'Aberto para Pedidos',
      nextOpenText: 'Fecha às 23:00',
      closedMessage: '',
      currentHour,
      timezone: 'America/Manaus',
    };
  }

  return {
    isOpen: false,
    statusText: 'Fechado no momento',
    nextOpenText: 'Abre às 16:00',
    closedMessage: 'Estamos fechados no momento e retornaremos novamente no outro dia às 16:00 da tarde.',
    currentHour,
    timezone: 'America/Manaus',
  };
}
