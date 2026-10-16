import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { Product, Addon } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  availableAddons: Record<string, Addon[]>;
  onAddToCart: (product: Product, quantity: number, selectedAddons: Addon[], notes: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  availableAddons,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [notes, setNotes] = useState('');

  // Reset state when modal opens for a new product
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedAddons([]);
      setNotes('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Identify applicable addons
  const addonGroupKey = product.addonGroup || (product.category === 'kikao' ? 'kikao' : 'burgers');
  const addonsList = availableAddons[addonGroupKey] || [];

  const handleToggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const singleItemPrice = product.price + addonsTotal;
  const totalPrice = singleItemPrice * quantity;

  const handleConfirm = () => {
    onAddToCart(product, quantity, selectedAddons, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-pink-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Image */}
        <div className="relative aspect-16/9 w-full bg-pink-100 shrink-0 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
          
          <div className="absolute bottom-3 left-4 right-4 text-white">
            {product.badge && (
              <span className="inline-flex items-center gap-1 bg-pink-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 shadow-xs">
                <Sparkles className="w-3 h-3" /> {product.badge}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-xs">
              {product.name}
            </h2>
            <p className="text-xs sm:text-sm text-pink-100 line-clamp-2 mt-0.5">
              {product.description}
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Base price display */}
          <div className="flex items-center justify-between pb-3 border-b border-pink-100">
            <span className="text-sm font-bold text-gray-700">Preço unitário base:</span>
            <span className="text-lg font-black text-pink-600">
              {formatCurrency(product.price)}
            </span>
          </div>

          {/* Add-ons Section */}
          {addonsList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  <span>Adicionais Gostosos</span>
                  <span className="text-[11px] font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                    Opcional
                  </span>
                </h4>
                <span className="text-[11px] text-gray-400">Escolha quantos quiser</span>
              </div>
              <div className="space-y-2">
                {addonsList.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => handleToggleAddon(addon)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-pink-500 bg-pink-50/70 shadow-xs'
                          : 'border-gray-200 hover:border-pink-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-pink-600 border-pink-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-800">
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-pink-600">
                        +{formatCurrency(addon.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-extrabold text-gray-900 mb-1">
              Observações do Lanche
            </label>
            <p className="text-[11px] text-gray-500 mb-2">
              Ex: "Sem cebola", "Ponto da carne bem passado", "Maionese à parte", etc.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma preferência ou restrição alimentar?"
              rows={2}
              maxLength={150}
              className="w-full p-3 rounded-2xl border border-pink-100 bg-pink-50/30 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-hidden transition-all resize-none"
            />
          </div>
        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="p-4 bg-gray-50 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Stepper Quantity */}
          <div className="flex items-center justify-between w-full sm:w-auto bg-white border border-pink-200 rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-pink-600 hover:bg-pink-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-black text-gray-900 text-sm">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-pink-600 hover:bg-pink-50 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:flex-1 bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white py-3 px-5 rounded-2xl font-black text-sm flex items-center justify-between shadow-lg shadow-pink-500/25 active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Adicionar ao Pedido</span>
            </div>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-black">
              {formatCurrency(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
