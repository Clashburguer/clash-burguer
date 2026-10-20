import React from 'react';
import { ShoppingBag, Search, Clock, Bike, Instagram, Phone, X } from 'lucide-react';
import { RestaurantInfo } from '../types';
import { StoreStatus } from '../utils/storeHours';
import clashLogo from '../assets/images/clash_burguer_king_princess_logo_1792257605760.jpg';

interface HeaderProps {
  restaurant: RestaurantInfo;
  storeStatus: StoreStatus;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFlyer?: () => void;
  tableNumber?: string | null;
  onExitTableMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  restaurant,
  storeStatus,
  cartCount,
  cartTotal,
  onOpenCart,
  searchQuery,
  onSearchChange,
  tableNumber,
  onExitTableMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-xs">
      {/* Top micro bar */}
      <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 text-white py-1 px-4 text-xs font-medium">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold">
              {storeStatus.isOpen ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Aberto para Pedidos</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                  <span>Fechado • Abre às 16:00</span>
                </>
              )}
            </span>
            {!tableNumber && (
              <>
                <span className="hidden sm:inline-block text-pink-100">|</span>
                <span className="hidden sm:flex items-center gap-1 text-pink-50">
                  <Clock className="w-3.5 h-3.5" /> {restaurant.deliveryTime}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {tableNumber ? (
              <span className="flex items-center gap-1.5 font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full text-white">
                <span>🍔 Atendimento Mesa {tableNumber}</span>
                {onExitTableMode && (
                  <button
                    onClick={onExitTableMode}
                    className="text-[10px] text-pink-200 hover:text-white underline ml-1 cursor-pointer font-normal"
                    title="Mudar para delivery normal"
                  >
                    (sair)
                  </button>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-pink-100">
                <Bike className="w-3.5 h-3.5" /> Taxa: R$ {restaurant.deliveryFee.toFixed(2).replace('.', ',')}
              </span>
            )}
            <a
              href={`https://wa.me/${restaurant.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors text-white"
              title="WhatsApp da Loja"
            >
              <Phone className="w-3 h-3" />
              <span>{restaurant.phoneFormatted}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 p-0.5 shadow-md shadow-pink-500/25 flex items-center justify-center overflow-hidden">
                <img
                  src={clashLogo}
                  alt="Clash Burguer Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1.5">
                  <span>Clash</span>
                  <span className="text-pink-600">Burguer</span>
                </h1>
                {tableNumber ? (
                  <span className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-xs animate-pulse">
                    <span>🍔 MESA {tableNumber}</span>
                  </span>
                ) : (
                  <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                    Delivery
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Social Links & Cart CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={restaurant.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors hidden sm:flex items-center gap-1 text-xs font-semibold"
              title="Instagram"
            >
              <Instagram className="w-4 h-4 text-pink-500" />
              <span className="hidden lg:inline">{restaurant.instagram}</span>
            </a>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white px-3.5 py-2.5 rounded-2xl font-bold shadow-md shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-pink-600 font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-pink-500 shadow-sm animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[10px] font-medium text-pink-100 uppercase tracking-wider">Meu Pedido</span>
                <span className="text-sm font-extrabold">
                  {cartTotal > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)
                    : 'R$ 0,00'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
            <input
              type="text"
              placeholder="Buscar no cardápio... (ex: smash, kikão bacon, coca, misto)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-pink-50/60 focus:bg-white text-sm text-gray-800 placeholder-gray-400 rounded-2xl border border-pink-100 focus:border-pink-500 focus:ring-3 focus:ring-pink-500/20 transition-all outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-200 hover:bg-gray-300 w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
