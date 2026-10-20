export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  badge?: string;
  addonGroup?: 'burgers' | 'kikao' | 'sides';
  flavors?: string[];
}

export interface Category {
  id: string;
  name: string;
  subtitle?: string;
  icon?: string;
  description?: string;
}

export interface RestaurantInfo {
  name: string;
  shortName: string;
  tagline: string;
  type: string;
  phone: string;
  phoneFormatted: string;
  whatsappNumber: string;
  deliveryFee: number;
  deliveryTime: string;
  status: string;
  openingHours: string;
  location: string;
  city: string;
  instagram: string;
  instagramUrl: string;
  tiktok: string;
  tiktokUrl: string;
  pixKey: string;
  pixKeyType: string;
  bannerAnnouncement: string;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedAddons: Addon[];
  notes: string;
  itemTotalPrice: number;
}

export type DeliveryType = 'delivery' | 'pickup' | 'mesa';

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash';

export interface CustomerData {
  name: string;
  phone: string;
  deliveryType: DeliveryType;
  tableNumber?: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  reference: string;
  paymentMethod: PaymentMethod;
  cashChangeFor: string;
  orderNotes: string;
}
