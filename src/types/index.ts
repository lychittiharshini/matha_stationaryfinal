export interface StationeryProduct {
  id: string;
  name: string;
  nameTelugu?: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price?: number;
  rateOnRequest: boolean;
  inStock: boolean;
  imageUrl: string;
  storagePath?: string;
  featured?: boolean;
  brand?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FancyProduct {
  id: string;
  name: string;
  nameTelugu?: string;
  subCategory: string;
  categoryId?: string;
  description: string;
  price?: number;
  rateOnRequest: boolean;
  inStock: boolean;
  imageUrl: string;
  storagePath?: string;
  featured?: boolean;
  ageGroup?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SportsProduct {
  id: string;
  name: string;
  nameTelugu?: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price?: number;
  rateOnRequest: boolean;
  inStock: boolean;
  imageUrl: string;
  storagePath?: string;
  brand?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  nameTelugu?: string;
  type: 'stationery' | 'fancy' | 'sports' | 'xerox';
  order: number;
  description?: string;
  imageUrl?: string;
  storagePath?: string;
  isMainCategory?: boolean;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  nameTelugu?: string;
  category: 'xerox' | 'printing' | 'lamination' | 'other';
  description: string;
  priceStartingFrom?: number;
  rateUnit?: string;
  rateOnRequest: boolean;
  available: boolean;
  options?: { label: string; price?: number }[];
  imageUrl?: string;
  storagePath?: string;
  order: number;
}

export interface CartItem {
  cartItemId: string;
  type: 'stationery' | 'fancy' | 'sports' | 'service';
  productId: string;
  title: string;
  titleTelugu?: string;
  price?: number;
  rateOnRequest: boolean;
  quantity: number;
  imageUrl?: string;
  serviceNotes?: string;
}

export type OrderStatus = 'New' | 'Confirmed' | 'Processing' | 'Ready for pickup' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  customerName: string;
  mobileNumber: string;
  items: CartItem[];
  totalEstimate: number;
  customerMessage?: string;
  marketingConsent: boolean;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Offer {
  id: string;
  title: string;
  titleTelugu?: string;
  description: string;
  posterUrl: string;
  discountBadge: string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  marketingConsent: boolean;
  subscribedToWebNotifications: boolean;
  fcmToken?: string;
  totalOrders: number;
  lastOrderAt?: string;
  createdAt: string;
}

export interface SocialMediaAccount {
  id: string;
  platform: 'Instagram' | 'Facebook' | 'YouTube' | 'WhatsApp' | 'Pinterest' | 'Custom';
  accountName: string;
  profileUrl: string;
  iconKey: string;
  order: number;
  isActive: boolean;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  description: string;
  category: 'Shop Interior' | 'Kids Fancy' | 'Products' | 'Festival' | 'Services';
  imageUrl: string;
  isPublic: boolean;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  title: string;
  body: string;
  offerId?: string;
  sentAt: string;
  sentCount: number;
  status: 'Sent' | 'Failed';
}

export interface ShopSettings {
  id: string;
  shopName: string;
  shopSubtitle: string;
  address: string;
  email: string;
  phone: string;
  whatsapp: string;
  openingHours: string;
  mapsUrl: string;
  noticeEnglish: string;
  noticeTelugu: string;
}
