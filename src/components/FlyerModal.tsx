import React from 'react';
import { X, Sparkles, MessageCircle, Instagram } from 'lucide-react';
import { RestaurantInfo } from '../types';

interface FlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantInfo;
}

export const FlyerModal: React.FC<FlyerModalProps> = ({
  isOpen,
  onClose,
  restaurant,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-zinc-950 text-white rounded-3xl p-6 shadow-2xl border border-pink-500/40 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Fechar panfleto"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-bold border border-pink-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cardápio Oficial Clash Burguer</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-wide">
            CLASH BURGUER & KIKÃO
          </h3>
          <p className="text-xs text-zinc-400">
            Taxa de entrega fixa: R$ 2,00 • Pedidos rápidos via WhatsApp
          </p>
        </div>

        <div className="space-y-5 text-xs">
          {/* Smash Burgers */}
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-pink-500/20">
            <h4 className="text-pink-400 font-extrabold uppercase tracking-wider mb-2.5 text-sm flex items-center justify-between">
              <span>NOSSOS BURGERS SMASH</span>
              <span className="text-[10px] text-zinc-400">Pão Brioche</span>
            </h4>
            <div className="space-y-2 divide-y divide-zinc-800">
              <div className="flex justify-between pt-1">
                <div>
                  <strong className="text-white text-sm">CLASH</strong>
                  <p className="text-zinc-400 text-[11px]">Pão brioche, carne smash, cheddar, tomate, cebola caramelizada, alface</p>
                </div>
                <span className="text-pink-400 font-black text-sm">R$ 20,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white text-sm">CLASH DUPLO</strong>
                  <p className="text-zinc-400 text-[11px]">Pão brioche, 2 carnes smash, 2 cheddars, tomate, cebola caramelizada, alface</p>
                </div>
                <span className="text-pink-400 font-black text-sm">R$ 30,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white text-sm">CLASH BACON</strong>
                  <p className="text-zinc-400 text-[11px]">Pão brioche, carne smash, bacon, cheddar, tomate, cebola caramelizada, alface</p>
                </div>
                <span className="text-pink-400 font-black text-sm">R$ 26,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white text-sm">CLASH CALABRESA</strong>
                  <p className="text-zinc-400 text-[11px]">Pão brioche, carne smash, calabresa, cheddar, tomate, cebola caramelizada, alface</p>
                </div>
                <span className="text-pink-400 font-black text-sm">R$ 26,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white text-sm">CLASH SALSICHA</strong>
                  <p className="text-zinc-400 text-[11px]">Pão brioche, carne smash, salsicha especial, cheddar, tomate, cebola caramelizada, alface</p>
                </div>
                <span className="text-pink-400 font-black text-sm">R$ 25,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white text-sm">CLASHZÃO</strong>
                  <p className="text-zinc-400 text-[11px]">Pão brioche, 2 carnes smash, 3 cheddars, bacon, calabresa, ovo, tomate, cebola caramelizada, alface</p>
                </div>
                <span className="text-pink-400 font-black text-sm">R$ 35,00</span>
              </div>
            </div>
          </div>

          {/* Hambúrgueres Tradicionais */}
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-pink-500/20">
            <h4 className="text-pink-400 font-extrabold uppercase tracking-wider mb-2.5 text-sm flex items-center justify-between">
              <span>HAMBÚRGUERES TRADICIONAIS</span>
              <span className="text-[10px] text-zinc-400">Pão Brioche</span>
            </h4>
            <div className="space-y-2 divide-y divide-zinc-800">
              <div className="flex justify-between pt-1">
                <div>
                  <strong className="text-white">Hambúrguer</strong>
                  <p className="text-zinc-400 text-[11px]">Pão brioche, carne de hambúrguer, presunto e queijo derretido</p>
                </div>
                <span className="text-pink-400 font-black">R$ 10,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">X-Salada</strong>
                  <p className="text-zinc-400 text-[11px]">Carne, presunto, queijo, tomate, cebola e alface</p>
                </div>
                <span className="text-pink-400 font-black">R$ 10,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">X-Calabresa / X-Bacon / X-Salsicha</strong>
                  <p className="text-zinc-400 text-[11px]">Com recheio especial selecionado</p>
                </div>
                <span className="text-pink-400 font-black">R$ 15,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">X-Tudo</strong>
                  <p className="text-zinc-400 text-[11px]">Carne, bacon, calabresa, salsicha, presunto, queijo, salada</p>
                </div>
                <span className="text-pink-400 font-black">R$ 20,00</span>
              </div>
            </div>
          </div>

          {/* Kikão */}
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-pink-500/20">
            <h4 className="text-pink-400 font-extrabold uppercase tracking-wider mb-2.5 text-sm">
              LINHA KIKÃO (Hot Dog Regional)
            </h4>
            <div className="space-y-2 divide-y divide-zinc-800">
              <div className="flex justify-between pt-1">
                <div>
                  <strong className="text-white">Kikão Simples</strong>
                  <p className="text-zinc-400 text-[11px]">Pão, molho artesanal, queijo ralado, salsicha, batata palha</p>
                </div>
                <span className="text-pink-400 font-black">R$ 6,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">Kikão Bacon / Carne / Calabresa</strong>
                  <p className="text-zinc-400 text-[11px]">Com recheio especial selecionado</p>
                </div>
                <span className="text-pink-400 font-black">R$ 10,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">Kikão Tudo</strong>
                  <p className="text-zinc-400 text-[11px]">Pão, molho especial, salsicha, queijo ralado, batata palha, calabresa, bacon, carne e maionese</p>
                </div>
                <span className="text-pink-400 font-black">R$ 15,00</span>
              </div>
            </div>
          </div>

          {/* Porções */}
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-pink-500/20">
            <h4 className="text-pink-400 font-extrabold uppercase tracking-wider mb-2.5 text-sm">
              PORÇÕES & BATATAS FRITAS
            </h4>
            <div className="space-y-2 divide-y divide-zinc-800">
              <div className="flex justify-between pt-1">
                <div>
                  <strong className="text-white">Batata Frita Tradicional</strong>
                  <p className="text-zinc-400 text-[11px]">Batata sequinha e crocante (200g)</p>
                </div>
                <span className="text-pink-400 font-black">R$ 8,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">Batata Calabresa</strong>
                  <p className="text-zinc-400 text-[11px]">Com calabresa dourada acebolada e queijo</p>
                </div>
                <span className="text-pink-400 font-black">R$ 15,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">Batata Bacon</strong>
                  <p className="text-zinc-400 text-[11px]">Com queijo cremoso e cubos de bacon</p>
                </div>
                <span className="text-pink-400 font-black">R$ 15,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">Batata Tudo</strong>
                  <p className="text-zinc-400 text-[11px]">Completa com queijo, bacon, calabresa e maionese</p>
                </div>
                <span className="text-pink-400 font-black">R$ 20,00</span>
              </div>
            </div>
          </div>

          {/* Doces & Bolos */}
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-pink-500/20">
            <h4 className="text-pink-400 font-extrabold uppercase tracking-wider mb-2.5 text-sm flex items-center justify-between">
              <span>DOCES & BOLOS</span>
              <span className="text-[10px] text-zinc-400">Sobremesas</span>
            </h4>
            <div className="space-y-2 divide-y divide-zinc-800">
              <div className="flex justify-between pt-1">
                <div>
                  <strong className="text-white">Bolo Simples</strong>
                  <p className="text-zinc-400 text-[11px]">Fatia de bolo caseiro macio e fofinho</p>
                </div>
                <span className="text-pink-400 font-black">R$ 6,00</span>
              </div>
            </div>
          </div>

          {/* Bebidas */}
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-pink-500/20">
            <h4 className="text-pink-400 font-extrabold uppercase tracking-wider mb-2.5 text-sm flex items-center justify-between">
              <span>BEBIDAS</span>
              <span className="text-[10px] text-zinc-400">Geladas</span>
            </h4>
            <div className="space-y-2 divide-y divide-zinc-800">
              <div className="flex justify-between pt-1">
                <div>
                  <strong className="text-white">Suco Natural (400ml)</strong>
                  <p className="text-zinc-400 text-[11px]">Sabores: Maracujá ou Acerola</p>
                </div>
                <span className="text-pink-400 font-black">R$ 7,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">Coca-Cola Lata 350ml</strong>
                  <p className="text-zinc-400 text-[11px]">Trincando de gelada</p>
                </div>
                <span className="text-pink-400 font-black">R$ 7,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">Coca-Cola 1 Litro</strong>
                  <p className="text-zinc-400 text-[11px]">Garrafa 1L bem gelada</p>
                </div>
                <span className="text-pink-400 font-black">R$ 13,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <div>
                  <strong className="text-white">Água Mineral de 300ml</strong>
                  <p className="text-zinc-400 text-[11px]">Garrafinha sem gás gelada</p>
                </div>
                <span className="text-pink-400 font-black">R$ 3,00</span>
              </div>
            </div>
          </div>

          {/* Social info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-300 font-semibold">{restaurant.phoneFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-400" />
              <span className="text-zinc-300 font-semibold">{restaurant.instagram}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-extrabold py-3 rounded-2xl cursor-pointer hover:opacity-95 transition-opacity"
        >
          Fechar e Montar Pedido
        </button>
      </div>
    </div>
  );
};
