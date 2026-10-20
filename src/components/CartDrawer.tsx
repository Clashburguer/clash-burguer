import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Bike,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  Tag,
  ShoppingBag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, CustomerData, RestaurantInfo } from '../types';
import { StoreStatus } from '../utils/storeHours';
import { formatCurrency, buildWhatsAppMessage, generateWhatsAppUrl } from '../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  restaurant: RestaurantInfo;
  storeStatus: StoreStatus;
  tableNumber?: string | null;
  onExitTableMode?: () => void;
  onOrderSuccess: (message: string, url: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  restaurant,
  storeStatus,
  tableNumber,
  onExitTableMode,
  onOrderSuccess,
}) => {
  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    phone: '',
    deliveryType: tableNumber ? 'mesa' : 'delivery',
    tableNumber: tableNumber || undefined,
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    reference: '',
    paymentMethod: 'pix',
    cashChangeFor: '',
    orderNotes: '',
  });

  // Keep customer in mesa mode if tableNumber is active
  useEffect(() => {
    if (tableNumber) {
      setCustomer((prev) => ({
        ...prev,
        deliveryType: 'mesa',
        tableNumber: tableNumber,
      }));
    } else {
      setCustomer((prev) => ({
        ...prev,
        deliveryType: prev.deliveryType === 'mesa' ? 'delivery' : prev.deliveryType,
        tableNumber: undefined,
      }));
    }
  }, [tableNumber, isOpen]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent?: number; discountFixed?: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const deliveryFee = customer.deliveryType === 'delivery' ? restaurant.deliveryFee : 0;
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      discountAmount = (subtotal * appliedCoupon.discountPercent) / 100;
    } else if (appliedCoupon.discountFixed) {
      discountAmount = Math.min(subtotal, appliedCoupon.discountFixed);
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'CLASH10') {
      setAppliedCoupon({ code, discountPercent: 10 });
    } else if (code === 'BEMVINDO') {
      setAppliedCoupon({ code, discountFixed: 5 });
    } else {
      setCouponError('Cupom inválido ou expirado. Tente "CLASH10"');
    }
  };

  const handleCopyPixKey = () => {
    const textToCopy = restaurant.pixKey.replace(/\s|-/g, '');
    navigator.clipboard.writeText(textToCopy);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const validateForm = (): boolean => {
    const isMesa = customer.deliveryType === 'mesa' || !!tableNumber;
    const errors: Record<string, string> = {};

    if (!customer.name.trim()) {
      errors.name = isMesa
        ? 'Por favor, informe seu nome para o pedido na mesa'
        : 'Por favor, informe seu nome';
    }

    if (!isMesa) {
      if (!customer.phone.trim() || customer.phone.replace(/\D/g, '').length < 8) {
        errors.phone = 'Informe seu telefone / WhatsApp';
      }
      if (customer.deliveryType === 'delivery') {
        if (!customer.neighborhood.trim()) {
          errors.neighborhood = 'Informe o bairro';
        }
        if (!customer.street.trim()) {
          errors.street = 'Informe a rua / avenida';
        }
        if (!customer.number.trim()) {
          errors.number = 'Informe o número';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFinishOrder = () => {
    if (cart.length === 0) return;

    if (!validateForm()) {
      const formEl = document.getElementById('checkout-form-section');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Build WhatsApp message
    const message = buildWhatsAppMessage(
      cart,
      customer,
      restaurant,
      restaurant.deliveryFee,
      discountAmount
    );

    const whatsappUrl = generateWhatsAppUrl(restaurant.whatsappNumber, message);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#f43f5e', '#fb7185', '#ffffff'],
      });
    } catch {
      // safe fallback
    }

    // Open WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    // Notify parent for modal confirmation
    onOrderSuccess(message, whatsappUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-black leading-none">Meu Pedido</h2>
              <span className="text-[11px] text-pink-100 font-medium">
                {cart.length} {cart.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[11px] text-pink-100 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Limpar tudo
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Cart Empty State */}
          {cart.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 bg-pink-50 text-pink-400 rounded-3xl mx-auto flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1">Seu carrinho está vazio</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                Explore nosso cardápio de hambúrgueres smash e o clássico Kikão e adicione suas delícias favoritas!
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-extrabold px-6 py-3 rounded-2xl shadow-md shadow-pink-500/25 transition-all cursor-pointer"
              >
                Explorar Cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Store Closed Warning Banner */}
              {!storeStatus.isOpen && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-amber-900 mb-0.5">
                      Estamos fechados no momento!
                    </strong>
                    <span className="text-amber-800 leading-relaxed block">
                      Retornaremos novamente às 16:00 da tarde. Você ainda pode enviar seu pedido pelo WhatsApp para ficar agendado!
                    </span>
                  </div>
                </div>
              )}

              {/* Item List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Itens Selecionados
                </h3>

                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 bg-pink-50/40 rounded-2xl border border-pink-100/80 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 leading-tight">
                          {item.product.name}
                        </h4>
                        <span className="text-xs font-bold text-pink-600">
                          {formatCurrency(item.product.price)} un
                        </span>
                      </div>
                      <span className="text-sm font-black text-gray-900">
                        {formatCurrency(item.itemTotalPrice)}
                      </span>
                    </div>

                    {/* Addons List */}
                    {item.selectedAddons.length > 0 && (
                      <div className="pl-2 border-l-2 border-pink-300 ml-1 space-y-0.5 text-xs text-gray-600">
                        <span className="font-bold text-[10px] text-pink-600 uppercase tracking-wide">
                          Adicionais:
                        </span>
                        {item.selectedAddons.map((addon) => (
                          <div key={addon.id} className="flex justify-between text-[11px]">
                            <span>+ {addon.name}</span>
                            <span className="font-semibold text-pink-600">
                              +{formatCurrency(addon.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-[11px] text-gray-500 italic bg-white/70 p-1.5 rounded-lg border border-pink-100">
                        Obs: "{item.notes}"
                      </p>
                    )}

                    {/* Quantity controls and delete */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => onRemoveItem(item.cartItemId)}
                        className="text-gray-400 hover:text-rose-500 p-1 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Remover</span>
                      </button>

                      <div className="flex items-center bg-white border border-pink-200 rounded-xl p-0.5 shadow-2xs">
                        <button
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-pink-600 hover:bg-pink-50 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-black text-xs text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-pink-600 hover:bg-pink-50 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery vs Pickup vs Mesa Selector */}
              <div id="checkout-form-section" className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Tipo de Pedido
                </h3>
                {tableNumber || customer.deliveryType === 'mesa' ? (
                  <div className="p-4 bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 rounded-3xl text-white shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shrink-0">
                        🍔
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                            Consumo no Local
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black leading-tight mt-0.5">
                          PEDIDO NA MESA • MESA {customer.tableNumber || tableNumber}
                        </h4>
                        <span className="text-[11px] text-pink-100 block">
                          Seu pedido será servido diretamente nesta mesa
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-bold bg-white text-pink-600 px-3 py-1 rounded-full shadow-xs">
                        Sem taxa
                      </span>
                      {onExitTableMode && (
                        <button
                          type="button"
                          onClick={onExitTableMode}
                          className="text-[10px] text-pink-100 hover:text-white underline cursor-pointer"
                        >
                          Mudar para delivery
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCustomer({ ...customer, deliveryType: 'delivery' })}
                      className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        customer.deliveryType === 'delivery'
                          ? 'border-pink-500 bg-pink-50/80 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Bike
                          className={`w-5 h-5 ${
                            customer.deliveryType === 'delivery' ? 'text-pink-600' : 'text-gray-400'
                          }`}
                        />
                        <span className="text-xs font-extrabold text-pink-600">
                          + {formatCurrency(restaurant.deliveryFee)}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-gray-900 leading-tight">
                        Entrega
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Receba quentinho em casa ({restaurant.deliveryTime})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomer({ ...customer, deliveryType: 'pickup' })}
                      className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        customer.deliveryType === 'pickup'
                          ? 'border-pink-500 bg-pink-50/80 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Store
                          className={`w-5 h-5 ${
                            customer.deliveryType === 'pickup' ? 'text-pink-600' : 'text-gray-400'
                          }`}
                        />
                        <span className="text-xs font-extrabold text-emerald-600">Grátis</span>
                      </div>
                      <span className="text-sm font-extrabold text-gray-900 leading-tight">
                        Retirada
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Retire direto no nosso balcão
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Customer and Address Information */}
              <div className="space-y-3 bg-gray-50/80 p-4 rounded-3xl border border-pink-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                  {tableNumber || customer.deliveryType === 'mesa'
                    ? 'Identificação para Atendimento'
                    : 'Dados para Contato'}
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {tableNumber || customer.deliveryType === 'mesa'
                      ? 'Seu Nome (para entrega na mesa) *'
                      : 'Seu Nome Completo *'}
                  </label>
                  <input
                    type="text"
                    placeholder="Como podemos te chamar?"
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer({ ...customer, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    className={`w-full p-2.5 bg-white text-xs sm:text-sm rounded-xl border ${
                      formErrors.name ? 'border-rose-500 ring-2 ring-rose-200' : 'border-gray-200 focus:border-pink-500'
                    } outline-hidden`}
                  />
                  {formErrors.name && (
                    <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {tableNumber || customer.deliveryType === 'mesa'
                      ? 'WhatsApp (opcional)'
                      : 'WhatsApp para Contato *'}
                  </label>
                  <input
                    type="tel"
                    placeholder="(97) 98125-XXXX"
                    value={customer.phone}
                    onChange={(e) => {
                      setCustomer({ ...customer, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                    }}
                    className={`w-full p-2.5 bg-white text-xs sm:text-sm rounded-xl border ${
                      formErrors.phone ? 'border-rose-500 ring-2 ring-rose-200' : 'border-gray-200 focus:border-pink-500'
                    } outline-hidden`}
                  />
                  {formErrors.phone && (
                    <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                    </span>
                  )}
                </div>

                {/* If Delivery: Address inputs */}
                {customer.deliveryType === 'delivery' && (
                  <div className="space-y-2.5 pt-2 border-t border-pink-100">
                    <span className="text-xs font-extrabold text-pink-600 block">
                      Endereço de Entrega
                    </span>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Bairro *</label>
                      <input
                        type="text"
                        placeholder="Ex: Centro, Flores, Adrianópolis..."
                        value={customer.neighborhood}
                        onChange={(e) => {
                          setCustomer({ ...customer, neighborhood: e.target.value });
                          if (formErrors.neighborhood) setFormErrors({ ...formErrors, neighborhood: '' });
                        }}
                        className={`w-full p-2.5 bg-white text-xs sm:text-sm rounded-xl border ${
                          formErrors.neighborhood ? 'border-rose-500 ring-2 ring-rose-200' : 'border-gray-200 focus:border-pink-500'
                        } outline-hidden`}
                      />
                      {formErrors.neighborhood && (
                        <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.neighborhood}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Rua / Avenida *
                        </label>
                        <input
                          type="text"
                          placeholder="Nome da rua"
                          value={customer.street}
                          onChange={(e) => {
                            setCustomer({ ...customer, street: e.target.value });
                            if (formErrors.street) setFormErrors({ ...formErrors, street: '' });
                          }}
                          className={`w-full p-2.5 bg-white text-xs sm:text-sm rounded-xl border ${
                            formErrors.street ? 'border-rose-500 ring-2 ring-rose-200' : 'border-gray-200 focus:border-pink-500'
                          } outline-hidden`}
                        />
                        {formErrors.street && (
                          <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.street}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Número *
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          value={customer.number}
                          onChange={(e) => {
                            setCustomer({ ...customer, number: e.target.value });
                            if (formErrors.number) setFormErrors({ ...formErrors, number: '' });
                          }}
                          className={`w-full p-2.5 bg-white text-xs sm:text-sm rounded-xl border ${
                            formErrors.number ? 'border-rose-500 ring-2 ring-rose-200' : 'border-gray-200 focus:border-pink-500'
                          } outline-hidden`}
                        />
                        {formErrors.number && (
                          <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.number}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Complemento (opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Apto 101, Bloco B"
                          value={customer.complement}
                          onChange={(e) => setCustomer({ ...customer, complement: e.target.value })}
                          className="w-full p-2.5 bg-white text-xs sm:text-sm rounded-xl border border-gray-200 focus:border-pink-500 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Ponto de Referência
                        </label>
                        <input
                          type="text"
                          placeholder="Próximo à praça..."
                          value={customer.reference}
                          onChange={(e) => setCustomer({ ...customer, reference: e.target.value })}
                          className="w-full p-2.5 bg-white text-xs sm:text-sm rounded-xl border border-gray-200 focus:border-pink-500 outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Forma de Pagamento
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, paymentMethod: 'pix' })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      customer.paymentMethod === 'pix'
                        ? 'border-pink-500 bg-pink-50/80 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-pink-200'
                    }`}
                  >
                    <QrCode
                      className={`w-5 h-5 ${
                        customer.paymentMethod === 'pix' ? 'text-pink-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="leading-tight">
                      <span className="text-xs sm:text-sm font-extrabold text-gray-900 block">
                        PIX
                      </span>
                      <span className="text-[10px] text-pink-600 font-bold">Mais Rápido</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, paymentMethod: 'credit' })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      customer.paymentMethod === 'credit'
                        ? 'border-pink-500 bg-pink-50/80 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-pink-200'
                    }`}
                  >
                    <CreditCard
                      className={`w-5 h-5 ${
                        customer.paymentMethod === 'credit' ? 'text-pink-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="leading-tight">
                      <span className="text-xs sm:text-sm font-extrabold text-gray-900 block">
                        Crédito
                      </span>
                      <span className="text-[10px] text-gray-500">Na entrega</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, paymentMethod: 'debit' })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      customer.paymentMethod === 'debit'
                        ? 'border-pink-500 bg-pink-50/80 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-pink-200'
                    }`}
                  >
                    <CreditCard
                      className={`w-5 h-5 ${
                        customer.paymentMethod === 'debit' ? 'text-pink-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="leading-tight">
                      <span className="text-xs sm:text-sm font-extrabold text-gray-900 block">
                        Débito
                      </span>
                      <span className="text-[10px] text-gray-500">Na entrega</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, paymentMethod: 'cash' })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      customer.paymentMethod === 'cash'
                        ? 'border-pink-500 bg-pink-50/80 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-pink-200'
                    }`}
                  >
                    <Banknote
                      className={`w-5 h-5 ${
                        customer.paymentMethod === 'cash' ? 'text-pink-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="leading-tight">
                      <span className="text-xs sm:text-sm font-extrabold text-gray-900 block">
                        Dinheiro
                      </span>
                      <span className="text-[10px] text-gray-500">Com ou sem troco</span>
                    </div>
                  </button>
                </div>

                {/* Sub-options for payment */}
                {customer.paymentMethod === 'pix' && (
                  <div className="p-3 bg-pink-50/80 rounded-2xl border border-pink-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-gray-500 block">Chave PIX da Loja ({restaurant.pixKeyType}):</span>
                      <span className="text-xs font-black text-pink-700">{restaurant.pixKey}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPixKey}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all shrink-0"
                    >
                      {copiedPix ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Chave
                        </>
                      )}
                    </button>
                  </div>
                )}

                {customer.paymentMethod === 'cash' && (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Precisa de troco? Para quanto?
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Troco para R$ 50,00 ou Não preciso"
                      value={customer.cashChangeFor}
                      onChange={(e) => setCustomer({ ...customer, cashChangeFor: e.target.value })}
                      className="w-full p-2 bg-white text-xs sm:text-sm rounded-xl border border-gray-200 focus:border-pink-500 outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Coupon Code */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tem um cupom? (ex: CLASH10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm uppercase font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:border-pink-500 focus:bg-white outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <span>Cupom {appliedCoupon.code} aplicado com sucesso!</span>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-gray-400 hover:text-rose-500 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-rose-500 font-semibold">{couponError}</p>
                )}
              </div>

              {/* General Order Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observações Gerais do Pedido (opcional)
                </label>
                <textarea
                  value={customer.orderNotes}
                  onChange={(e) => setCustomer({ ...customer, orderNotes: e.target.value })}
                  placeholder="Ex: Tocar a campainha, entregar na portaria..."
                  rows={2}
                  maxLength={150}
                  className="w-full p-2.5 bg-gray-50 text-xs sm:text-sm rounded-xl border border-gray-200 focus:bg-white focus:border-pink-500 outline-hidden resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Drawer Sticky Footer with Totals & WhatsApp Button */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-pink-100 space-y-3 shrink-0 shadow-lg">
            {/* Financial summary */}
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</span>
                <span className="font-bold text-gray-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Taxa de Entrega</span>
                <span className="font-bold text-gray-800">
                  {tableNumber || customer.deliveryType === 'mesa'
                    ? `Grátis (Mesa ${tableNumber || customer.tableNumber || '01'})`
                    : customer.deliveryType === 'delivery'
                      ? formatCurrency(deliveryFee)
                      : 'Grátis (Retirada)'}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Desconto aplicado</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-lg font-black text-gray-900 pt-2 border-t border-pink-100">
                <span>Total a Pagar</span>
                <span className="text-pink-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Big WhatsApp CTA Button */}
            <button
              type="button"
              onClick={handleFinishOrder}
              className={`w-full text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-all cursor-pointer ${
                storeStatus.isOpen
                  ? 'bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 hover:from-pink-500 hover:to-rose-600 shadow-pink-500/25'
                  : 'bg-gradient-to-r from-amber-600 via-rose-500 to-pink-600 hover:opacity-95 shadow-amber-500/25'
              }`}
            >
              <span>
                {tableNumber || customer.deliveryType === 'mesa'
                  ? storeStatus.isOpen
                    ? `🍔 PEDIDO NA MESA | Mesa: ${tableNumber || customer.tableNumber || '01'}`
                    : `🍔 PEDIDO NA MESA | Mesa: ${tableNumber || customer.tableNumber || '01'} (Abre 16h)`
                  : storeStatus.isOpen
                    ? '🛵 PEDIDO DELIVERY'
                    : '🛵 PEDIDO DELIVERY (Abre 16h)'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-[10px] text-center text-gray-400 font-medium">
              Seu pedido será enviado com mensagem pronta para o WhatsApp oficial{' '}
              <strong className="text-gray-600">{restaurant.phoneFormatted}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
