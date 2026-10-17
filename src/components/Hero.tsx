import React from 'react';
import { Bike, Clock, Flame, Sparkles, MapPin, Phone, FileText } from 'lucide-react';
import { RestaurantInfo } from '../types';

interface HeroProps {
  restaurant: RestaurantInfo;
  onSelectCategory: (categoryId: string) => void;
  onOpenFlyer: () => void;
}

export const Hero: React.FC<HeroProps> = ({ restaurant, onSelectCategory, onOpenFlyer }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-pink-50/70 via-white to-pink-50/40 border-b border-pink-100 py-6 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100/80 text-pink-700 rounded-full text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-pink-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Cardápio Oficial & Delivery Direto</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              O melhor sabor com a rapidez que você merece!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
              Burgers artesanais smash com pão brioche amanteigado e o autêntico Kikão com batata palha e queijo ralado generoso. Monte seu pedido e enviamos direto pro WhatsApp!
            </p>
          </div>

          {/* Quick feature pill cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-white p-3 rounded-2xl border border-pink-100 shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block font-medium leading-none">Taxa fixa</span>
                <span className="text-sm font-extrabold text-gray-900 leading-tight">R$ {restaurant.deliveryFee.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-pink-100 shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block font-medium leading-none">Tempo médio</span>
                <span className="text-sm font-extrabold text-gray-900 leading-tight">{restaurant.deliveryTime}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-pink-100 shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block font-medium leading-none">Modalidade</span>
                <span className="text-sm font-extrabold text-gray-900 leading-tight">Entrega ou Balcão</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-pink-100 shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block font-medium leading-none">WhatsApp</span>
                <span className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight truncate">{restaurant.phoneFormatted}</span>
              </div>
            </div>
          </div>

          {/* Quick action triggers */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => onSelectCategory('burgers-smash')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 shadow-xs transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" /> Ver Linha Clash
            </button>
            
            <button
              onClick={() => onSelectCategory('kikao')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-pink-200 text-pink-600 text-xs font-bold hover:bg-pink-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ver Linha Kikão
            </button>

            <button
              onClick={onOpenFlyer}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" /> Ver Panfleto Original
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
