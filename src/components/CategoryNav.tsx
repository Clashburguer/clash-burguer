import React, { useRef } from 'react';
import { Flame, Utensils, Sparkles, Package, ShoppingBag, CupSoda, IceCream, Cake, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '../types';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-4 h-4 shrink-0" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 shrink-0" />;
      case 'Package':
        return <Package className="w-4 h-4 shrink-0" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-4 h-4 shrink-0" />;
      case 'CupSoda':
        return <CupSoda className="w-4 h-4 shrink-0" />;
      case 'IceCream':
        return <IceCream className="w-4 h-4 shrink-0" />;
      case 'Cake':
        return <Cake className="w-4 h-4 shrink-0" />;
      case 'Utensils':
      default:
        return <Utensils className="w-4 h-4 shrink-0" />;
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-[106px] z-30 bg-white/95 backdrop-blur-md border-b border-pink-100 py-2.5 px-4 shadow-2xs">
      <div className="max-w-6xl mx-auto relative flex items-center">
        {/* Left scroll arrow button for desktop */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-pink-200 text-gray-600 hover:text-pink-600 hover:border-pink-400 shadow-xs mr-2 shrink-0 cursor-pointer transition-colors"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable list */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 w-full"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`whitespace-nowrap flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/25 scale-[1.02]'
                    : 'bg-pink-50/70 hover:bg-pink-100/70 text-gray-700 hover:text-pink-700 border border-pink-100'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-pink-500'}>
                  {getIcon(cat.icon)}
                </span>
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-white text-gray-500 border border-pink-100'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right scroll arrow button for desktop */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-pink-200 text-gray-600 hover:text-pink-600 hover:border-pink-400 shadow-xs ml-2 shrink-0 cursor-pointer transition-colors"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
