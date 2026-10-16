import React from 'react';
import { Plus, Check, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  quantityInCart: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  quantityInCart,
}) => {
  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group relative bg-white rounded-3xl p-4 sm:p-5 border border-pink-100 hover:border-pink-300 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
    >
      <div>
        {/* Top Badges / Status */}
        <div className="flex items-center justify-between gap-2 mb-2 min-h-[22px]">
          {product.badge ? (
            <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{product.badge}</span>
            </div>
          ) : (
            <div></div>
          )}

          {quantityInCart > 0 && (
            <div className="bg-emerald-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{quantityInCart} no pedido</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-gray-900 group-hover:text-pink-600 transition-colors leading-snug">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer & Action */}
      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">A partir de</span>
          <span className="text-base sm:text-lg font-black text-pink-600 leading-tight">
            {formatCurrency(product.price)}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectProduct(product);
          }}
          className="flex items-center gap-1.5 bg-pink-50 hover:bg-pink-600 text-pink-600 hover:text-white px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 group/btn shadow-2xs hover:shadow-md hover:shadow-pink-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 transition-transform group-hover/btn:rotate-90" />
          <span>Adicionar</span>
        </button>
      </div>
    </div>
  );
};
