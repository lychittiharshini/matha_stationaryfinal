import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db, initializeDatabaseIfEmpty } from './lib/firebase';
import {
  initialCategories,
  initialStationeryProducts,
  initialFancyProducts,
  initialSportsProducts,
  initialServices,
  initialOffers,
  initialSocialMedia,
  initialShopSettings
} from './lib/seedData';
import {
  StationeryProduct,
  FancyProduct,
  SportsProduct,
  Category,
  ServiceItem,
  Order,
  Offer,
  Customer,
  SocialMediaAccount,
  ShopSettings,
  NotificationLog
} from './types';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { CategoryCardsGrid, MainCategoryKey } from './components/CategoryCardsGrid';
import { StationeryPage } from './components/pages/StationeryPage';
import { FancyPage } from './components/pages/FancyPage';
import { XeroxPrintPage } from './components/pages/XeroxPrintPage';
import { SportsPage } from './components/pages/SportsPage';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CartModal } from './components/CartModal';
import { AdminPortal } from './components/admin/AdminPortal';

import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { useAuth } from './context/AuthContext';

function MainAppContent() {
  const { isAdmin } = useAuth();

  // Navigation State: 'home' | MainCategoryKey | 'admin-login' | 'admin-dashboard'
  const [activeView, setActiveView] = useState<'home' | MainCategoryKey | 'admin-login' | 'admin-dashboard'>('home');

  // Firestore live states
  const [stationeryProducts, setStationeryProducts] = useState<StationeryProduct[]>(initialStationeryProducts);
  const [fancyProducts, setFancyProducts] = useState<FancyProduct[]>(initialFancyProducts);
  const [sportsProducts, setSportsProducts] = useState<SportsProduct[]>(initialSportsProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialMediaAccount[]>(initialSocialMedia);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(initialShopSettings);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Hash-based routing & Unauthorized Direct URL Protection
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#/admin-dashboard' || hash === '#admin-dashboard') {
        if (!isAdmin) {
          // Deny access if unauthorized and redirect to login page
          window.location.hash = '#/admin-login';
          setActiveView('admin-login');
          setIsAdminOpen(false);
        } else {
          setActiveView('admin-dashboard');
          setIsAdminOpen(true);
        }
      } else if (hash === '#/admin-login' || hash === '#admin-login' || hash === '#/admin' || hash === '#admin') {
        if (isAdmin) {
          setActiveView('admin-dashboard');
          setIsAdminOpen(true);
        } else {
          setActiveView('admin-login');
          setIsAdminOpen(false);
        }
      } else if (hash === '#/stationery') {
        setActiveView('stationery');
      } else if (hash === '#/fancy') {
        setActiveView('fancy');
      } else if (hash === '#/xerox') {
        setActiveView('xerox');
      } else if (hash === '#/sports') {
        setActiveView('sports');
      } else if (!hash || hash === '#/' || hash === '#') {
        if (activeView !== 'admin-login' && activeView !== 'admin-dashboard') {
          setActiveView('home');
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isAdmin]);

  useEffect(() => {
    initializeDatabaseIfEmpty();

    // 1. Stationery products listener
    const unsubStationery = onSnapshot(
      collection(db, 'stationery_products'),
      (snap) => {
        const list: StationeryProduct[] = [];
        snap.forEach((d) => list.push(d.data() as StationeryProduct));
        setStationeryProducts(list);
      },
      (err) => console.warn('Stationery listener:', err)
    );

    // 2. Kids Fancy products listener
    const unsubFancy = onSnapshot(
      collection(db, 'fancy_products'),
      (snap) => {
        const list: FancyProduct[] = [];
        snap.forEach((d) => list.push(d.data() as FancyProduct));
        setFancyProducts(list);
      },
      (err) => console.warn('Fancy listener:', err)
    );

    // 3. Sports products listener
    const unsubSports = onSnapshot(
      collection(db, 'sports_products'),
      (snap) => {
        const list: SportsProduct[] = [];
        snap.forEach((d) => list.push(d.data() as SportsProduct));
        setSportsProducts(list);
      },
      (err) => console.warn('Sports listener:', err)
    );

    // 4. Categories listener
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const list: Category[] = [];
        snap.forEach((d) => list.push(d.data() as Category));
        list.sort((a, b) => a.order - b.order);
        setCategories(list);
      },
      (err) => console.warn('Categories listener:', err)
    );

    // 5. Services listener
    const unsubServices = onSnapshot(
      collection(db, 'services'),
      (snap) => {
        const list: ServiceItem[] = [];
        snap.forEach((d) => list.push(d.data() as ServiceItem));
        list.sort((a, b) => a.order - b.order);
        setServices(list);
      },
      (err) => console.warn('Services listener:', err)
    );

    // 6. Orders listener
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const list: Order[] = [];
        snap.forEach((d) => {
          const data = d.data();
          let parsedItems = data.items;
          if (typeof data.items === 'string') {
            try {
              parsedItems = JSON.parse(data.items);
            } catch {
              parsedItems = [];
            }
          }
          list.push({ ...data, items: parsedItems } as Order);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(list);
      },
      (err) => console.warn('Orders listener:', err)
    );

    // 7. Offers listener
    const unsubOffers = onSnapshot(
      collection(db, 'offers'),
      (snap) => {
        if (!snap.empty) {
          const list: Offer[] = [];
          snap.forEach((d) => list.push(d.data() as Offer));
          setOffers(list);
        }
      },
      (err) => console.warn('Offers listener:', err)
    );

    // 8. Customers listener
    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snap) => {
        const list: Customer[] = [];
        snap.forEach((d) => list.push(d.data() as Customer));
        setCustomers(list);
      },
      (err) => console.warn('Customers listener:', err)
    );

    // 9. Social Media listener
    const unsubSocial = onSnapshot(
      collection(db, 'social_media'),
      (snap) => {
        if (!snap.empty) {
          const list: SocialMediaAccount[] = [];
          snap.forEach((d) => list.push(d.data() as SocialMediaAccount));
          list.sort((a, b) => a.order - b.order);
          setSocialAccounts(list);
        }
      },
      (err) => console.warn('Social listener:', err)
    );

    // 10. Shop settings listener
    const unsubSettings = onSnapshot(
      doc(db, 'shop_settings', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          setShopSettings(docSnap.data() as ShopSettings);
        }
      },
      (err) => console.warn('Settings listener:', err)
    );

    // 11. Notifications listener
    const unsubNotifications = onSnapshot(
      collection(db, 'notifications'),
      (snap) => {
        const list: NotificationLog[] = [];
        snap.forEach((d) => list.push(d.data() as NotificationLog));
        list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        setNotifications(list);
      },
      (err) => console.warn('Notifications listener:', err)
    );

    return () => {
      unsubStationery();
      unsubFancy();
      unsubSports();
      unsubCategories();
      unsubServices();
      unsubOrders();
      unsubOffers();
      unsubCustomers();
      unsubSocial();
      unsubSettings();
      unsubNotifications();
    };
  }, []);

  const handleSelectCategory = (key: MainCategoryKey) => {
    setActiveView(key);
    window.location.hash = `#/${key}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setActiveView('home');
    window.location.hash = '#/';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminFromFooter = () => {
    if (isAdmin) {
      window.location.hash = '#/admin-dashboard';
      setActiveView('admin-dashboard');
      setIsAdminOpen(true);
    } else {
      window.location.hash = '#/admin-login';
      setActiveView('admin-login');
      setIsAdminOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EB] text-[#1F3B2E] selection:bg-[#CBB3E8] selection:text-[#1F3B2E]">
      {/* 1. FIRST: ONE SINGLE HORIZONTAL HEADER */}
      <Header onGoHome={handleGoHome} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1">
        {/* SEPARATE ADMIN LOGIN PAGE */}
        {activeView === 'admin-login' && (
          <AdminLoginPage
            onSuccess={() => {
              window.location.hash = '#/admin-dashboard';
              setActiveView('admin-dashboard');
              setIsAdminOpen(true);
            }}
            onBackToStore={handleGoHome}
          />
        )}

        {/* HOMEPAGE */}
        {activeView === 'home' && (
          <>
            {/* 2. SECOND: EXACTLY FOUR MAIN CATEGORY CARDS */}
            <CategoryCardsGrid
              onSelectCategory={handleSelectCategory}
              stationeryCount={stationeryProducts.length}
              fancyCount={fancyProducts.length}
              sportsCount={sportsProducts.length}
              categories={categories}
            />

            {/* 3. THIRD & FOURTH: CONTACT SECTION & GOOGLE MAPS */}
            <ContactSection
              settings={shopSettings}
              socialAccounts={socialAccounts}
            />
          </>
        )}

        {/* DEDICATED SEPARATE CATEGORY PAGES */}
        {activeView === 'stationery' && (
          <StationeryPage
            products={stationeryProducts}
            categories={categories}
            onBack={handleGoHome}
          />
        )}

        {activeView === 'fancy' && (
          <FancyPage
            products={fancyProducts}
            categories={categories}
            onBack={handleGoHome}
          />
        )}

        {activeView === 'xerox' && (
          <XeroxPrintPage
            services={services}
            onBack={handleGoHome}
          />
        )}

        {activeView === 'sports' && (
          <SportsPage
            products={sportsProducts}
            categories={categories}
            onBack={handleGoHome}
          />
        )}
      </main>

      {/* 5. FIFTH: VERY SIMPLE FOOTER WITH TINY DISCREET ADMIN LOGIN LINK */}
      <Footer onOpenAdmin={handleOpenAdminFromFooter} />

      {/* Simple Customer Cart & Order Request Modal */}
      <CartModal />

      {/* Secure Admin Portal */}
      <AdminPortal
        isOpen={isAdminOpen || activeView === 'admin-dashboard'}
        onClose={() => {
          setIsAdminOpen(false);
          if (activeView === 'admin-dashboard') {
            handleGoHome();
          }
        }}
        stationeryProducts={stationeryProducts}
        fancyProducts={fancyProducts}
        sportsProducts={sportsProducts}
        categories={categories}
        services={services}
        orders={orders}
        offers={offers}
        customers={customers}
        socialAccounts={socialAccounts}
        shopSettings={shopSettings}
        notifications={notifications}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </CartProvider>
    </LanguageProvider>
  );
}

