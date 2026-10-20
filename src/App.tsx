import { useState, useEffect, useMemo } from 'react';
import cardapioData from './data/cardapio.json';
import { Product, CartItem, Addon, RestaurantInfo, Category } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { FlyerModal } from './components/FlyerModal';
import { TableQRModal } from './components/TableQRModal';
import { Footer } from './components/Footer';
import { formatCurrency } from './utils/formatters';
import { checkStoreStatus, StoreStatus } from './utils/storeHours';
import { detectTableFromUrl, clearTableSession } from './utils/tableService';
import { ShoppingBag, ArrowRight, Search, UtensilsCrossed, Clock, AlertTriangle, QrCode } from 'lucide-react';

export default function App() {
  const restaurant = cardapioData.restaurantInfo as RestaurantInfo;
  const categories = cardapioData.categories as Category[];
  const products = cardapioData.products as Product[];
  const availableAddons = cardapioData.addons as Record<string, Addon[]>;

  // Store open/close status (open 16:00 to 23:00)
  const [storeStatus, setStoreStatus] = useState<StoreStatus>(() => checkStoreStatus());

  // Table (Mesa) origin identification state
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [tableNotice, setTableNotice] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Detect table from URL (?origem=mesa&mesa=01) or restore session
  useEffect(() => {
    const checkTable = () => {
      const res = detectTableFromUrl();
      if (res.isTableOrder && res.tableNumber) {
        setTableNumber(res.tableNumber);
        setTableNotice(null);
      } else if (res.invalidError) {
        setTableNotice(res.invalidError);
        setTableNumber(null);
      } else {
        setTableNumber(null);
        setTableNotice(null);
      }
    };

    checkTable();
    window.addEventListener('popstate', checkTable);
    return () => window.removeEventListener('popstate', checkTable);
  }, []);

  const handleExitTableMode = () => {
    clearTableSession();
    setTableNumber(null);
    setTableNotice(null);
  };

  const handleSelectTableForTesting = (table: string) => {
    sessionStorage.setItem('clash_table_number', table);
    setTableNumber(table);
    setTableNotice(null);
    const url = new URL(window.location.href);
    url.searchParams.set('origem', 'mesa');
    url.searchParams.set('mesa', table);
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    // Recheck every 30 seconds
    const interval = setInterval(() => {
      setStoreStatus(checkStoreStatus());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('clash_burguer_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('clash_burguer_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // UI state
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || 'burgers-smash');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFlyerOpen, setIsFlyerOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    isOpen: boolean;
    message: string;
    url: string;
  }>({
    isOpen: false,
    message: '',
    url: '',
  });

  // Calculate cart metrics
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  }, [cart]);

  // Product counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const map = new Map<string, Product[]>();
    categories.forEach((cat) => map.set(cat.id, []));
    filteredProducts.forEach((prod) => {
      if (map.has(prod.category)) {
        map.get(prod.category)!.push(prod);
      } else {
        // category not found in predefined list, append fallback
        map.set(prod.category, [prod]);
      }
    });
    return map;
  }, [filteredProducts, categories]);

  // Cart operations
  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedAddons: Addon[],
    notes: string
  ) => {
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const itemTotalPrice = (product.price + addonsTotal) * quantity;
    const cartItemId = `${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newItem: CartItem = {
      cartItemId,
      product,
      quantity,
      selectedAddons,
      notes,
      itemTotalPrice,
    };

    setCart((prev) => [...prev, newItem]);
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const addonsTotal = item.selectedAddons.reduce((sum, a) => sum + a.price, 0);
          return {
            ...item,
            quantity: newQuantity,
            itemTotalPrice: (item.product.price + addonsTotal) * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    // Smooth scroll to target section if present
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      const yOffset = -180;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleOrderSuccess = (message: string, url: string) => {
    setIsCartOpen(false);
    setOrderSuccess({
      isOpen: true,
      message,
      url,
    });
  };

  return (
    <div className="min-h-screen bg-[#faf7f9] text-gray-900 flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Top Header */}
      <Header
        restaurant={restaurant}
        storeStatus={storeStatus}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenFlyer={() => setIsFlyerOpen(true)}
        tableNumber={tableNumber}
        onExitTableMode={handleExitTableMode}
      />

      {/* Invalid Table Notice (if user enters an invalid table number) */}
      {tableNotice && (
        <div className="bg-amber-500 text-white py-2.5 px-4 shadow-sm z-30 animate-in fade-in">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
              <span>{tableNotice} O site continuará em modo de atendimento normal (Delivery).</span>
            </span>
            <button
              onClick={() => setTableNotice(null)}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Active Table (Mesa) Mode Banner */}
      {tableNumber && (
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white py-2 px-4 shadow-sm z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-black">
              <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-sm shrink-0">
                🍔
              </span>
              <span className="text-sm font-black">
                Pedido da mesa {tableNumber ? parseInt(tableNumber, 10) : '1'}
              </span>
            </div>
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={handleExitTableMode}
                className="text-[11px] bg-white text-pink-700 hover:bg-pink-50 px-3 py-1 rounded-full font-black shadow-xs cursor-pointer transition-colors"
              >
                Mudar para Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Closed Banner (active between 23:00 and 16:00) */}
      {!storeStatus.isOpen && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 text-white py-3 px-4 shadow-md sticky top-[106px] z-30">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-white/20 rounded-xl shrink-0">
                <Clock className="w-4 h-4 text-amber-200 animate-pulse" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-wide">
                  Estamos fechados no momento e retornaremos novamente no outro dia às 16:00 da tarde!
                </p>
                <p className="text-[11px] text-pink-100 font-medium">
                  Horário de funcionamento: das 16:00 às 23:00. Você ainda pode navegar pelo cardápio e agendar seu pedido pelo WhatsApp!
                </p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold bg-white/20 px-3 py-1 rounded-full whitespace-nowrap shadow-xs">
              Abre às 16:00
            </span>
          </div>
        </div>
      )}

      {/* Hero Banner (hidden when searching for minimal distraction) */}
      {!searchQuery && (
        <Hero
          restaurant={restaurant}
          onSelectCategory={handleSelectCategory}
          onOpenFlyer={() => setIsFlyerOpen(true)}
          tableNumber={tableNumber}
        />
      )}

      {/* Sticky Categories Navigation */}
      {!searchQuery && (
        <CategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          categoryCounts={categoryCounts}
        />
      )}

      {/* Main Catalog Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-12">
        {/* If search query is active */}
        {searchQuery ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-pink-600" />
                  <span>Resultados da busca para "{searchQuery}"</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Encontramos {filteredProducts.length}{' '}
                  {filteredProducts.length === 1 ? 'item' : 'itens'} no cardápio
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                Limpar busca
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 max-w-md mx-auto">
                <UtensilsCrossed className="w-12 h-12 text-pink-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800 mb-1">Nenhum item encontrado</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Tente buscar por termos como "clash", "kikão", "batata", "bacon" ou "coca".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-pink-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Ver Todo o Cardápio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => {
                  const qty = cart
                    .filter((item) => item.product.id === product.id)
                    .reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectProduct={setSelectedProduct}
                      quantityInCart={qty}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Normal Category Sections */
          categories.map((category) => {
            const catProducts = groupedProducts.get(category.id) || [];
            if (catProducts.length === 0) return null;

            return (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-48 space-y-4"
              >
                {/* Category Header */}
                <div className="border-b border-pink-100 pb-3 flex items-end justify-between">
                  <div>
                    {category.subtitle && (
                      <span className="text-[11px] font-black uppercase tracking-wider text-pink-600 block">
                        {category.subtitle}
                      </span>
                    )}
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-white px-2.5 py-1 rounded-full border border-pink-100 shrink-0">
                    {catProducts.length} {catProducts.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {catProducts.map((product) => {
                    const qty = cart
                      .filter((item) => item.product.id === product.id)
                      .reduce((sum, item) => sum + item.quantity, 0);

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelectProduct={setSelectedProduct}
                        quantityInCart={qty}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Floating Bottom Bar for Mobile / Instant Cart Access */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 text-white p-3.5 rounded-2xl font-black shadow-xl shadow-pink-500/35 flex items-center justify-between active:scale-98 transition-all cursor-pointer animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-2 bg-white text-pink-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Ver Pedido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">{formatCurrency(cartTotal)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Product Customization Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        availableAddons={availableAddons}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer & Checkout */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        restaurant={restaurant}
        storeStatus={storeStatus}
        tableNumber={tableNumber}
        onExitTableMode={handleExitTableMode}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Success Confirmation Modal */}
      <OrderSuccessModal
        isOpen={orderSuccess.isOpen}
        onClose={() => setOrderSuccess({ ...orderSuccess, isOpen: false })}
        messageText={orderSuccess.message}
        whatsappUrl={orderSuccess.url}
        restaurant={restaurant}
        onReset={handleClearCart}
      />

      {/* Original Print Flyer Modal */}
      <FlyerModal
        isOpen={isFlyerOpen}
        onClose={() => setIsFlyerOpen(false)}
        restaurant={restaurant}
      />

      {/* Mesas 01-04 QR Code Modal */}
      <TableQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        currentTable={tableNumber}
        onSelectTableForTesting={handleSelectTableForTesting}
      />

      {/* Footer */}
      <Footer
        restaurant={restaurant}
        onOpenFlyer={() => setIsFlyerOpen(true)}
        onOpenQRModal={() => setIsQRModalOpen(true)}
      />
    </div>
  );
}
