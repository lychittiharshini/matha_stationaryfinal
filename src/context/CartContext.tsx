import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, StationeryProduct, FancyProduct, SportsProduct, ServiceItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: StationeryProduct | FancyProduct | SportsProduct, quantity?: number, forcedType?: 'stationery' | 'fancy' | 'sports') => void;
  addServiceToCart: (service: ServiceItem, quantity?: number, optionsText?: string, calculatedPrice?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalEstimate: number;
  hasRateOnRequest: boolean;
  totalItemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isOrderTrackingOpen: boolean;
  setIsOrderTrackingOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sdm_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('sdm_cart', JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save cart', e);
    }
  }, [items]);

  const addToCart = (
    product: StationeryProduct | FancyProduct | SportsProduct,
    quantity: number = 1,
    forcedType?: 'stationery' | 'fancy' | 'sports'
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.type !== 'service');
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.type !== 'service'
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      let itemType: 'stationery' | 'fancy' | 'sports' = 'stationery';
      if (forcedType) {
        itemType = forcedType;
      } else if ('subCategory' in product) {
        itemType = 'fancy';
      } else if (product.id.startsWith('sports-') || product.id.startsWith('sport-')) {
        itemType = 'sports';
      }

      const newItem: CartItem = {
        cartItemId: `${product.id}_${Date.now()}`,
        type: itemType,
        productId: product.id,
        title: product.name,
        titleTelugu: product.nameTelugu,
        price: product.price,
        rateOnRequest: product.rateOnRequest || !product.price,
        quantity,
        imageUrl: product.imageUrl,
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const addServiceToCart = (
    service: ServiceItem,
    quantity: number = 1,
    optionsText?: string,
    calculatedPrice?: number
  ) => {
    const unitPrice = calculatedPrice !== undefined ? calculatedPrice : service.priceStartingFrom;
    const newItem: CartItem = {
      cartItemId: `srv_${service.id}_${Date.now()}`,
      type: 'service',
      productId: service.id,
      title: `${service.name}${optionsText ? ` (${optionsText})` : ''}`,
      titleTelugu: service.nameTelugu,
      price: unitPrice,
      rateOnRequest: service.rateOnRequest || unitPrice === undefined,
      quantity,
      serviceNotes: optionsText,
    };
    setItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalEstimate = items.reduce((acc, item) => {
    if (item.price && !item.rateOnRequest) {
      return acc + item.price * item.quantity;
    }
    return acc;
  }, 0);

  const hasRateOnRequest = items.some((item) => item.rateOnRequest || !item.price);
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addServiceToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalEstimate,
        hasRateOnRequest,
        totalItemCount,
        isCartOpen,
        setIsCartOpen,
        isOrderTrackingOpen,
        setIsOrderTrackingOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
