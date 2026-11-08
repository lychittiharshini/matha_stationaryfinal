import React, { useState } from 'react';
import {
  X,
  LogOut,
  LayoutDashboard,
  Package,
  Sparkles,
  Printer,
  Trophy,
  Tag,
  Users,
  ShoppingBag,
  Share2,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Download,
  Bell,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  ShieldAlert,
  Globe,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Square,
  Filter,
  ArrowUpDown,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
  NotificationLog,
  ShopSettings,
  OrderStatus
} from '../../types';
import { db, storage } from '../../lib/firebase';
import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { ProductModal, ProductType, ProductModalData } from './ProductModal';
import { CategoryModal } from './CategoryModal';
import { ServiceModal } from './ServiceModal';
import { deleteStorageFile } from '../../lib/storageHelper';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  stationeryProducts: StationeryProduct[];
  fancyProducts: FancyProduct[];
  sportsProducts: SportsProduct[];
  categories: Category[];
  services: ServiceItem[];
  orders: Order[];
  offers: Offer[];
  customers: Customer[];
  socialAccounts: SocialMediaAccount[];
  shopSettings: ShopSettings;
  notifications: NotificationLog[];
  onRefreshData?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  stationeryProducts,
  fancyProducts,
  sportsProducts,
  categories,
  services,
  orders,
  offers,
  customers,
  socialAccounts,
  shopSettings,
  notifications,
  onRefreshData,
}) => {
  const { user, isAdmin, logout, authError } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'category-images'
    | 'orders'
    | 'stationery'
    | 'fancy'
    | 'sports'
    | 'categories'
    | 'services'
    | 'offers'
    | 'customers'
    | 'social'
    | 'settings'
  >('overview');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  // --- Modals State ---
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalType, setProductModalType] = useState<ProductType>('stationery');
  const [editingProduct, setEditingProduct] = useState<ProductModalData | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryDefaultType, setCategoryDefaultType] = useState<'stationery' | 'fancy' | 'sports'>('stationery');

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // --- Global Notification & Feedback State ---
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // --- Search, Filter & Bulk Selection: Stationery ---
  const [stationerySearch, setStationerySearch] = useState('');
  const [stationeryCatFilter, setStationeryCatFilter] = useState('all');
  const [stationeryStockFilter, setStationeryStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [stationerySort, setStationerySort] = useState<'newest' | 'name' | 'price-asc' | 'price-desc'>('newest');
  const [selectedStationeryIds, setSelectedStationeryIds] = useState<string[]>([]);

  // --- Search, Filter & Bulk Selection: Kids Fancy ---
  const [fancySearch, setFancySearch] = useState('');
  const [fancyCatFilter, setFancyCatFilter] = useState('all');
  const [fancyStockFilter, setFancyStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [fancySort, setFancySort] = useState<'newest' | 'name' | 'price-asc' | 'price-desc'>('newest');
  const [selectedFancyIds, setSelectedFancyIds] = useState<string[]>([]);

  // --- Search, Filter & Bulk Selection: Sports Items ---
  const [sportsSearch, setSportsSearch] = useState('');
  const [sportsCatFilter, setSportsCatFilter] = useState('all');
  const [sportsStockFilter, setSportsStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [sportsSort, setSportsSort] = useState<'newest' | 'name' | 'price-asc' | 'price-desc'>('newest');
  const [selectedSportsIds, setSelectedSportsIds] = useState<string[]>([]);

  // --- Category Search & Filter ---
  const [catSearch, setCatSearch] = useState('');
  const [catTypeFilter, setCatTypeFilter] = useState<'all' | 'stationery' | 'fancy' | 'sports'>('all');

  // --- Service Search & Filter ---
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 'xerox' | 'printing' | 'lamination' | 'other'>('all');

  // --- Homepage Category Images Management State ---
  const [pendingImages, setPendingImages] = useState<
    Record<string, { file: File; previewUrl: string } | null>
  >({});
  const [uploadingCategory, setUploadingCategory] = useState<Record<string, boolean>>({});
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [imageErrorMsg, setImageErrorMsg] = useState<string | null>(null);

  interface MainCategoryConfig {
    key: 'stationery' | 'fancy' | 'xerox' | 'sports';
    docId: string;
    number: string;
    name: string;
    nameTelugu: string;
    description: string;
    accentBg: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const mainCategoryConfigs: MainCategoryConfig[] = [
    {
      key: 'stationery',
      docId: 'main_stationery',
      number: '01',
      name: 'Stationery Items',
      nameTelugu: 'స్టేషనరీ వస్తువులు',
      description: 'Pens, pencils, notebooks, registers, school supplies, art materials, office stationery & books.',
      accentBg: 'bg-[#1F3B2E] text-[#E8DCC6]',
      icon: Package,
    },
    {
      key: 'fancy',
      docId: 'main_fancy',
      number: '02',
      name: "Kids' Fancy Stationery Items",
      nameTelugu: 'పిల్లల ఫ్యాన్సీ స్టేషనరీ',
      description: 'Cartoon erasers, fancy sharpeners, cute pens, mini diaries, pencil boxes, stickers & gift sets.',
      accentBg: 'bg-[#CBB3E8] text-[#1F3B2E]',
      icon: Sparkles,
    },
    {
      key: 'xerox',
      docId: 'main_xerox',
      number: '03',
      name: 'Xerox & Print',
      nameTelugu: 'జిరాక్స్ & ప్రింట్',
      description: 'Black & white single/double-side Xerox, colour single/double printing, and lamination.',
      accentBg: 'bg-[#1F3B2E] text-[#E8DCC6]',
      icon: Printer,
    },
    {
      key: 'sports',
      docId: 'main_sports',
      number: '04',
      name: 'Sports Items',
      nameTelugu: 'స్పోర్ట్స్ ఐటమ్స్',
      description: 'Small cricket bats, tennis balls, wicket sets, badminton rackets, skipping ropes & sports equipment.',
      accentBg: 'bg-[#E8DCC6] text-[#1F3B2E]',
      icon: Trophy,
    },
  ];

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const handleCategoryImageSelect = (
    catKey: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setImageErrorMsg(null);
    setImageSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    const isValidType =
      ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) ||
      ALLOWED_IMAGE_EXTS.includes(ext);

    if (!isValidType) {
      setImageErrorMsg(
        `Invalid file type "${file.name}". Please upload a JPG, JPEG, PNG, or WEBP image.`
      );
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setImageErrorMsg(
        `File size (${sizeMb} MB) exceeds the 5MB limit. Please choose a smaller image.`
      );
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingImages((prev) => ({
      ...prev,
      [catKey]: { file, previewUrl },
    }));
    e.target.value = '';
  };

  const handleCancelCategoryPreview = (catKey: string) => {
    const pending = pendingImages[catKey];
    if (pending) {
      URL.revokeObjectURL(pending.previewUrl);
    }
    setPendingImages((prev) => ({ ...prev, [catKey]: null }));
  };

  const handleUploadCategorySave = async (config: MainCategoryConfig) => {
    const pending = pendingImages[config.key];
    if (!pending) return;

    setUploadingCategory((prev) => ({ ...prev, [config.key]: true }));
    setImageErrorMsg(null);
    setImageSuccessMsg(null);

    try {
      const file = pending.file;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const storagePath = `category_images/${config.key}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, storagePath);

      // Upload to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || 'image/jpeg',
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Clean up previous storage file if it exists
      const existingDoc = categories.find((c) => c.id === config.docId);
      if (existingDoc?.storagePath && existingDoc.storagePath !== storagePath) {
        deleteObject(ref(storage, existingDoc.storagePath)).catch(() => {});
      }

      // Save download URL to Firestore category document
      const categoryDocData: Category = {
        id: config.docId,
        name: config.name,
        nameTelugu: config.nameTelugu,
        type: config.key,
        order: parseInt(config.number, 10),
        imageUrl: downloadUrl,
        storagePath: storageRef.fullPath,
        isMainCategory: true,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'categories', config.docId), categoryDocData, { merge: true });

      URL.revokeObjectURL(pending.previewUrl);
      setPendingImages((prev) => ({ ...prev, [config.key]: null }));
      setImageSuccessMsg(
        `✓ Successfully uploaded and saved image for ${config.name}! The customer homepage has been updated.`
      );
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error('Firebase Storage upload error:', error);
      setImageErrorMsg(
        `Failed to upload image for ${config.name}: ${error instanceof Error ? error.message : 'Upload error'}`
      );
    } finally {
      setUploadingCategory((prev) => ({ ...prev, [config.key]: false }));
    }
  };

  const handleDeleteCategoryImage = async (config: MainCategoryConfig) => {
    const existingDoc = categories.find((c) => c.id === config.docId);
    if (!existingDoc?.imageUrl) return;

    const confirm = window.confirm(
      `Are you sure you want to remove the image for "${config.name}"? The customer homepage will immediately revert to the default category icon.`
    );
    if (!confirm) return;

    setUploadingCategory((prev) => ({ ...prev, [config.key]: true }));
    setImageErrorMsg(null);
    setImageSuccessMsg(null);

    try {
      if (existingDoc.storagePath) {
        await deleteObject(ref(storage, existingDoc.storagePath)).catch((err) => {
          console.warn('Storage delete warning:', err);
        });
      }

      await setDoc(
        doc(db, 'categories', config.docId),
        {
          id: config.docId,
          name: config.name,
          nameTelugu: config.nameTelugu,
          type: config.key,
          imageUrl: '',
          storagePath: '',
          isMainCategory: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setImageSuccessMsg(
        `✓ Image removed for ${config.name}. Default icon has been restored on the customer homepage.`
      );
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error('Delete category image error:', error);
      setImageErrorMsg(
        `Failed to remove image: ${error instanceof Error ? error.message : 'Delete error'}`
      );
    } finally {
      setUploadingCategory((prev) => ({ ...prev, [config.key]: false }));
    }
  };

  // --- Modals & Product Action Handlers ---
  const handleOpenAddProduct = (type: ProductType) => {
    setProductModalType(type);
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (type: ProductType, prod: any) => {
    setProductModalType(type);
    setEditingProduct({
      id: prod.id,
      name: prod.name,
      nameTelugu: prod.nameTelugu,
      categoryId: prod.categoryId || prod.subCategory,
      categoryName: prod.categoryName || prod.subCategory,
      subCategory: prod.subCategory,
      description: prod.description || '',
      price: prod.price,
      rateOnRequest: prod.rateOnRequest,
      inStock: prod.inStock,
      imageUrl: prod.imageUrl,
      storagePath: prod.storagePath,
      brand: prod.brand,
      ageGroup: prod.ageGroup,
    });
    setProductModalOpen(true);
  };

  const handleDeleteProduct = async (
    collectionName: string,
    id: string,
    name: string,
    storagePath?: string
  ) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"? This cannot be undone.`)) return;
    try {
      if (storagePath) await deleteStorageFile(storagePath);
      await deleteDoc(doc(db, collectionName, id));
      setActionSuccessMsg(`✓ Successfully deleted product "${name}".`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  const handleBulkStockUpdate = async (
    collectionName: string,
    ids: string[],
    inStockStatus: boolean,
    clearSelection: () => void
  ) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, collectionName, id), {
            inStock: inStockStatus,
            updatedAt: new Date().toISOString(),
          })
        )
      );
      clearSelection();
      setActionSuccessMsg(
        `✓ Updated availability for ${ids.length} products to ${inStockStatus ? 'In Stock' : 'Out of Stock'}.`
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to bulk update stock: ${err.message}`);
    }
  };

  const handleBulkMoveCategory = async (
    collectionName: string,
    ids: string[],
    targetCategory: Category,
    clearSelection: () => void
  ) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) => {
          const updatePayload: any = {
            categoryId: targetCategory.id,
            categoryName: targetCategory.name,
            updatedAt: new Date().toISOString(),
          };
          if (collectionName === 'fancy_products') {
            updatePayload.subCategory = targetCategory.name;
          }
          return updateDoc(doc(db, collectionName, id), updatePayload);
        })
      );
      clearSelection();
      setActionSuccessMsg(
        `✓ Moved ${ids.length} products to category "${targetCategory.name}".`
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to bulk move products: ${err.message}`);
    }
  };

  const handleBulkDelete = async (
    collectionName: string,
    itemsList: any[],
    ids: string[],
    clearSelection: () => void
  ) => {
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `⚠️ Are you sure you want to permanently delete ALL ${ids.length} selected products? This action cannot be undone.`
      )
    )
      return;

    try {
      await Promise.all(
        ids.map(async (id) => {
          const item = itemsList.find((it) => it.id === id);
          if (item?.storagePath) await deleteStorageFile(item.storagePath);
          return deleteDoc(doc(db, collectionName, id));
        })
      );
      clearSelection();
      setActionSuccessMsg(`✓ Successfully deleted ${ids.length} products.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to bulk delete products: ${err.message}`);
    }
  };

  const handleDeleteCategoryWithCheck = async (cat: Category) => {
    let linkedCount = 0;
    if (cat.type === 'stationery') {
      linkedCount = stationeryProducts.filter((p) => p.categoryId === cat.id).length;
    } else if (cat.type === 'fancy') {
      linkedCount = fancyProducts.filter(
        (p) => p.subCategory === cat.name || p.categoryId === cat.id
      ).length;
    } else if (cat.type === 'sports') {
      linkedCount = sportsProducts.filter((p) => p.categoryId === cat.id).length;
    }

    let confirmMsg = `Are you sure you want to delete category "${cat.name}"?`;
    if (linkedCount > 0) {
      confirmMsg += `\n\nNotice: ${linkedCount} products currently belong to this category. Their products will remain safe in your store under "General".`;
    }
    if (!window.confirm(confirmMsg)) return;

    try {
      if (cat.storagePath) await deleteStorageFile(cat.storagePath);
      await deleteDoc(doc(db, 'categories', cat.id));
      setActionSuccessMsg(`✓ Category "${cat.name}" deleted successfully.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  const handleDeleteService = async (service: ServiceItem) => {
    if (!window.confirm(`Are you sure you want to delete service "${service.name}"?`)) return;
    try {
      if (service.storagePath) await deleteStorageFile(service.storagePath);
      await deleteDoc(doc(db, 'services', service.id));
      setActionSuccessMsg(`✓ Service "${service.name}" deleted successfully.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to delete service: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  // If not logged in as authorized admin, deny access and redirect to login page
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-[#F7F3EB] rounded-3xl shadow-2xl border-2 border-[#1F3B2E] p-8 text-center animate-fade-in">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#E8DCC6] text-[#1F3B2E] flex items-center justify-center hover:bg-[#D8C7AA] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-rose-700 text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h3 className="font-brand-title font-bold text-2xl text-[#1F3B2E]">
            Access Denied
          </h3>
          <p className="text-xs text-[#1F3B2E]/75 mt-2 mb-6 leading-relaxed">
            This dashboard is restricted to the authorized store administrator. Please authenticate using your Admin ID and password.
          </p>

          <button
            onClick={() => {
              onClose();
              window.location.hash = '#/admin-login';
            }}
            className="w-full py-3.5 px-4 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Go to Admin Login Page
          </button>
        </div>
      </div>
    );
  }

  // --- KPI Stats ---
  const totalProducts = stationeryProducts.length + fancyProducts.length + sportsProducts.length;
  const newOrdersCount = orders.filter((o) => o.status === 'New').length;

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.warn('Update order status error', e);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Permanently delete order #${orderId}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.warn('Delete order error', e);
    }
  };

  const exportCustomersToCSV = () => {
    const headers = ['Customer ID', 'Full Name', 'Phone Number', 'Marketing Consent', 'Total Orders', 'Subscribed At'];
    const rows = customers.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.phone}"`,
      c.marketingConsent ? 'YES' : 'NO',
      c.totalOrders || 1,
      c.createdAt || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sree_Durga_Mata_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-7xl h-[95vh] bg-[#F7F3EB] rounded-3xl shadow-2xl border-2 border-[#1F3B2E] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1F3B2E] text-[#E8DCC6] px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#2C5241]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#CBB3E8] text-[#1F3B2E] flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-brand-title font-bold text-base sm:text-lg text-white">
                SREE DURGA MATA – Admin Portal
              </h2>
              <span className="text-[10px] text-[#CBB3E8] uppercase tracking-wider block font-semibold">
                Store Administrator Portal • Hyderabad
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-[#2C5241] hover:bg-rose-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#2C5241] text-[#E8DCC6] hover:bg-[#CBB3E8] hover:text-[#1F3B2E] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="bg-[#E8DCC6] border-b border-[#D8C7AA] px-4 flex items-center gap-1 overflow-x-auto scrollbar-none py-2 shrink-0">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'category-images', label: 'Category Images', icon: ImageIcon },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag, badge: newOrdersCount },
            { id: 'stationery', label: `Stationery (${stationeryProducts.length})`, icon: Package },
            { id: 'fancy', label: `Kids' Fancy (${fancyProducts.length})`, icon: Sparkles },
            { id: 'sports', label: `Sports Items (${sportsProducts.length})`, icon: Trophy },
            { id: 'categories', label: `Categories (${categories.length})`, icon: Tag },
            { id: 'services', label: `Xerox & Print (${services.length})`, icon: Printer },
            { id: 'offers', label: `Offers (${offers.length})`, icon: Bell },
            { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
            { id: 'social', label: `Social Media (${socialAccounts.length})`, icon: Share2 },
            { id: 'settings', label: 'Shop Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1F3B2E] text-[#E8DCC6] shadow-sm'
                    : 'text-[#1F3B2E] hover:bg-[#D8C7AA]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-extrabold ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#F7F3EB]">
          {/* Global Action Success Banner */}
          {actionSuccessMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button
                onClick={() => setActionSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold p-1 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <span className="text-[11px] font-bold text-[#1F3B2E]/60 uppercase block">Total Orders</span>
                  <div className="text-2xl font-black text-[#1F3B2E] mt-1">{orders.length}</div>
                  <span className="text-[11px] text-amber-700 font-bold">{newOrdersCount} New Action Required</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <span className="text-[11px] font-bold text-[#1F3B2E]/60 uppercase block">Total Products</span>
                  <div className="text-2xl font-black text-[#1F3B2E] mt-1">{totalProducts}</div>
                  <span className="text-[11px] text-[#1F3B2E]/70">
                    {stationeryProducts.length} Stat • {fancyProducts.length} Fancy • {sportsProducts.length} Sports
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <span className="text-[11px] font-bold text-[#1F3B2E]/60 uppercase block">Xerox Services</span>
                  <div className="text-2xl font-black text-[#1F3B2E] mt-1">{services.length}</div>
                  <span className="text-[11px] text-[#1F3B2E]/70">B&W, Colour & Lamination</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <span className="text-[11px] font-bold text-[#1F3B2E]/60 uppercase block">Customers</span>
                  <div className="text-2xl font-black text-[#1F3B2E] mt-1">{customers.length}</div>
                  <span className="text-[11px] text-emerald-700 font-bold">Registered & Active</span>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-2xl border border-[#D8C7AA] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-[#1F3B2E] uppercase tracking-wider">
                    Recent Customer Orders
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#1F3B2E] hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-[#1F3B2E]/60 py-4 text-center">No orders received yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F7F3EB] text-[#1F3B2E]/70 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Order ID</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Mobile</th>
                          <th className="p-2.5">Items</th>
                          <th className="p-2.5">Estimate</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F7F3EB]">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#F7F3EB]/50">
                            <td className="p-2.5 font-bold">#{ord.id}</td>
                            <td className="p-2.5">{ord.customerName}</td>
                            <td className="p-2.5 font-mono">{ord.mobileNumber}</td>
                            <td className="p-2.5">{ord.items.length} items</td>
                            <td className="p-2.5 font-bold">₹{ord.totalEstimate}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900">
                                {ord.status}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <a
                                href={`https://wa.me/91${ord.mobileNumber.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                                  ord.customerName
                                )},%20regarding%20your%20Order%20%23${ord.id}%20at%20Sree%20Durga%20Mata`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Homepage Category Images Quick Access Card in Overview */}
              <div className="bg-[#1F3B2E] text-[#E8DCC6] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#CBB3E8] text-[#1F3B2E] flex items-center justify-center font-bold shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-brand-title font-bold text-base text-white">
                      Homepage Category Images Management
                    </h3>
                    <p className="text-xs text-[#E8DCC6]/80 mt-0.5">
                      Upload, preview, replace, or delete images for the four homepage category cards (Stationery, Kids' Fancy, Xerox & Print, Sports).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('category-images')}
                  className="px-4 py-2 bg-[#CBB3E8] hover:bg-[#bfa2e2] text-[#1F3B2E] font-bold text-xs rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  Manage Category Images →
                </button>
              </div>
            </div>
          )}

          {/* TAB: CATEGORY IMAGES */}
          {activeTab === 'category-images' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-white p-5 rounded-2xl border border-[#D8C7AA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1F3B2E] text-[#CBB3E8] flex items-center justify-center font-bold">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <h3 className="font-brand-title font-bold text-lg text-[#1F3B2E]">
                      Homepage Category Images
                    </h3>
                  </div>
                  <p className="text-xs text-[#1F3B2E]/70 mt-1 max-w-2xl">
                    Manage the hero images displayed on each of the four main cards on the customer homepage. Uploaded images are stored permanently in Firebase Storage and linked to Firestore. If an image is removed, the customer homepage displays the official category icon automatically.
                  </p>
                </div>

                <div className="bg-[#F7F3EB] px-3.5 py-2.5 rounded-xl border border-[#D8C7AA] text-[11px] text-[#1F3B2E]/80 shrink-0">
                  <span className="font-bold block text-[#1F3B2E]">Supported Formats:</span>
                  <span>JPG, JPEG, PNG, WEBP (Max 5MB)</span>
                </div>
              </div>

              {/* Success Notification Alert */}
              {imageSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{imageSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setImageSuccessMsg(null)}
                    className="text-emerald-800 hover:text-emerald-950 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Error Notification Alert */}
              {imageErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{imageErrorMsg}</span>
                  </div>
                  <button
                    onClick={() => setImageErrorMsg(null)}
                    className="text-rose-800 hover:text-rose-950 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* 2x2 Grid of Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mainCategoryConfigs.map((config) => {
                  const Icon = config.icon;
                  const existingDoc = categories.find((c) => c.id === config.docId);
                  const hasExistingImage = !!(existingDoc?.imageUrl && existingDoc.imageUrl.trim() !== '');
                  const pending = pendingImages[config.key];
                  const isUploading = !!uploadingCategory[config.key];
                  const fileInputId = `file-input-${config.key}`;

                  return (
                    <div
                      key={config.key}
                      className="bg-white rounded-3xl border-2 border-[#D8C7AA] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        id={fileInputId}
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={(e) => handleCategoryImageSelect(config.key, e)}
                        className="hidden"
                        disabled={isUploading}
                      />

                      <div>
                        {/* Header: Title, Telugu & Status Badge */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1F3B2E] text-[#E8DCC6] flex items-center justify-center font-brand-title font-black text-sm">
                              {config.number}
                            </div>
                            <div>
                              <h4 className="font-brand-title font-bold text-base text-[#1F3B2E]">
                                {config.name}
                              </h4>
                              <span className="text-[11px] text-[#1F3B2E]/60 block font-medium">
                                {config.nameTelugu}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {pending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                Pending Save
                              </span>
                            ) : hasExistingImage ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Active on Homepage
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F7F3EB] text-[#1F3B2E]/70 border border-[#D8C7AA]">
                                Default Icon Active
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Image Preview / Display Box */}
                        <div className="mb-4">
                          {pending ? (
                            /* 1. Live Preview of Selected File Waiting for Save */
                            <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-black/5 border-2 border-dashed border-amber-500 shadow-inner group">
                              <img
                                src={pending.previewUrl}
                                alt="Selected preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-white">
                                <span className="text-xs font-bold truncate">
                                  {pending.file.name}
                                </span>
                                <span className="text-[10px] text-white/80">
                                  Size: {(pending.file.size / (1024 * 1024)).toFixed(2)} MB • Ready to save
                                </span>
                              </div>
                            </div>
                          ) : hasExistingImage ? (
                            /* 2. Active Image Display from Firebase Storage */
                            <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-[#E8DCC6]/30 border border-[#D8C7AA] shadow-sm group">
                              <img
                                src={existingDoc.imageUrl}
                                alt={config.name}
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              />
                              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Live on Website</span>
                              </div>
                              {existingDoc.updatedAt && (
                                <div className="absolute bottom-2 right-3 text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                                  Updated: {new Date(existingDoc.updatedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* 3. Empty State with Fallback Category Icon */
                            <div className="w-full h-52 rounded-2xl border-2 border-dashed border-[#D8C7AA] bg-[#F7F3EB]/60 flex flex-col items-center justify-center p-4 text-center">
                              <div className={`w-14 h-14 rounded-2xl ${config.accentBg} flex items-center justify-center mb-2 shadow-sm`}>
                                <Icon className="w-7 h-7" />
                              </div>
                              <span className="font-bold text-xs text-[#1F3B2E]">
                                No custom image uploaded
                              </span>
                              <span className="text-[11px] text-[#1F3B2E]/60 max-w-xs mt-0.5">
                                The customer homepage is currently displaying the official category icon as fallback.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-[#F7F3EB]">
                        {pending ? (
                          /* Pending actions: Save or Cancel */
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => handleUploadCategorySave(config)}
                              className="flex-1 py-2.5 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Uploading to Firebase...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-[#CBB3E8]" />
                                  <span>Save Image to Firebase</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => handleCancelCategoryPreview(config.key)}
                              className="px-3.5 py-2.5 bg-[#E8DCC6] hover:bg-[#D8C7AA] text-[#1F3B2E] font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : hasExistingImage ? (
                          /* Existing image actions: Replace or Remove */
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={fileInputId}
                              className={`flex-1 py-2.5 bg-white hover:bg-[#F7F3EB] border border-[#1F3B2E] text-[#1F3B2E] font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isUploading ? 'opacity-50 pointer-events-none' : ''
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-[#1F3B2E]" />
                              <span>Replace Image</span>
                            </label>

                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => handleDeleteCategoryImage(config)}
                              className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Remove image and restore default icon"
                            >
                              {isUploading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-800" />
                              ) : (
                                <>
                                  <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Remove</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          /* Initial upload button */
                          <label
                            htmlFor={fileInputId}
                            className={`w-full py-2.5 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isUploading ? 'opacity-50 pointer-events-none' : ''
                            }`}
                          >
                            <Upload className="w-4 h-4 text-[#CBB3E8]" />
                            <span>Select & Upload Image</span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D8C7AA]">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  {['all', 'New', 'Confirmed', 'Processing', 'Ready for pickup', 'Completed', 'Cancelled'].map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          statusFilter === st
                            ? 'bg-[#1F3B2E] text-[#E8DCC6]'
                            : 'bg-[#F7F3EB] text-[#1F3B2E] hover:bg-[#E8DCC6]'
                        }`}
                      >
                        {st === 'all' ? 'All Orders' : st}
                      </button>
                    )
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3B2E]/50" />
                  <input
                    type="text"
                    placeholder="Search name, phone or ID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {orders
                  .filter((o) => {
                    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
                    const q = orderSearch.toLowerCase().trim();
                    const matchSearch =
                      !q ||
                      o.customerName.toLowerCase().includes(q) ||
                      o.mobileNumber.includes(q) ||
                      o.id.toLowerCase().includes(q);
                    return matchStatus && matchSearch;
                  })
                  .map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D8C7AA] shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7F3EB] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#1F3B2E]">
                              Order #{ord.id}
                            </span>
                            <span className="text-xs text-[#1F3B2E]/60">
                              • {new Date(ord.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-[#1F3B2E] mt-1">
                            <strong>{ord.customerName}</strong> • Phone: <span className="font-mono">{ord.mobileNumber}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#D8C7AA] bg-[#F7F3EB] text-[#1F3B2E] focus:outline-none"
                          >
                            <option value="New">New</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Ready for pickup">Ready for pickup</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          <a
                            href={`https://wa.me/91${ord.mobileNumber.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                              ord.customerName
                            )},%20update%20on%20your%20Order%20%23${ord.id}%20from%20SREE%20DURGA%20MATA:%20Status%20is%20now%20${encodeURIComponent(
                              ord.status
                            )}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                            title="Message Customer on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="font-semibold text-[#1F3B2E] block mb-1">
                          Items & Services ({ord.items.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F7F3EB] p-2.5 rounded-xl">
                          {ord.items.map((it) => (
                            <div key={it.cartItemId} className="flex justify-between text-[11px]">
                              <span>• {it.title} × {it.quantity}</span>
                              <span className="font-bold">
                                {it.price ? `₹${it.price * it.quantity}` : 'Rate on Req.'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {ord.customerMessage && (
                        <div className="text-xs bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900">
                          <strong>Note:</strong> {ord.customerMessage}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs font-bold pt-1 text-[#1F3B2E]">
                        <span>Status: {ord.status}</span>
                        <span className="text-sm">Total Estimate: ₹{ord.totalEstimate}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Success Alert Banner */}
          {actionSuccessMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button
                onClick={() => setActionSuccessMsg(null)}
                className="text-emerald-800 hover:text-emerald-950 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB: STATIONERY PRODUCTS */}
          {activeTab === 'stationery' && (() => {
            const stationeryCategories = categories.filter(
              (c) => c.type === 'stationery' && !c.isMainCategory && !c.id.startsWith('main_')
            );

            const filteredStationery = stationeryProducts
              .filter((p) => {
                const q = stationerySearch.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  p.name.toLowerCase().includes(q) ||
                  (p.nameTelugu && p.nameTelugu.toLowerCase().includes(q)) ||
                  (p.description && p.description.toLowerCase().includes(q)) ||
                  (p.brand && p.brand.toLowerCase().includes(q));
                const matchesCat = stationeryCatFilter === 'all' || p.categoryId === stationeryCatFilter;
                const matchesStock =
                  stationeryStockFilter === 'all' ||
                  (stationeryStockFilter === 'in' ? p.inStock : !p.inStock);
                return matchesSearch && matchesCat && matchesStock;
              })
              .sort((a, b) => {
                if (stationerySort === 'name') return a.name.localeCompare(b.name);
                if (stationerySort === 'price-asc') return (a.price || 0) - (b.price || 0);
                if (stationerySort === 'price-desc') return (b.price || 0) - (a.price || 0);
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
              });

            const allSelected =
              filteredStationery.length > 0 &&
              filteredStationery.every((p) => selectedStationeryIds.includes(p.id));

            return (
              <div className="space-y-4">
                {/* Header with Title and Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <div>
                    <h3 className="font-brand-title font-bold text-base text-[#1F3B2E]">
                      Stationery Products Inventory ({stationeryProducts.length})
                    </h3>
                    <p className="text-[11px] text-[#1F3B2E]/60">
                      Unlimited products • Notebooks, pens, school supplies, registers & office goods
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenAddProduct('stationery')}
                    className="px-4 py-2 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#CBB3E8]" />
                    <span>Add Stationery Product</span>
                  </button>
                </div>

                {/* Search & Filters Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#D8C7AA] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3B2E]/40" />
                    <input
                      type="text"
                      placeholder="Search stationery by name, brand, or Telugu..."
                      value={stationerySearch}
                      onChange={(e) => setStationerySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={stationeryCatFilter}
                      onChange={(e) => setStationeryCatFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="all">All Subcategories</option>
                      {stationeryCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={stationeryStockFilter}
                      onChange={(e) => setStationeryStockFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="all">All Availability</option>
                      <option value="in">In Stock Only</option>
                      <option value="out">Out of Stock Only</option>
                    </select>

                    <select
                      value={stationerySort}
                      onChange={(e) => setStationerySort(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedStationeryIds.length > 0 && (
                  <div className="p-3 bg-[#1F3B2E] text-[#E8DCC6] rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckSquare className="w-4 h-4 text-[#CBB3E8]" />
                      <span>{selectedStationeryIds.length} items selected</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() =>
                          handleBulkStockUpdate(
                            'stationery_products',
                            selectedStationeryIds,
                            true,
                            () => setSelectedStationeryIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition-colors"
                      >
                        Mark In Stock
                      </button>

                      <button
                        onClick={() =>
                          handleBulkStockUpdate(
                            'stationery_products',
                            selectedStationeryIds,
                            false,
                            () => setSelectedStationeryIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer transition-colors"
                      >
                        Mark Out of Stock
                      </button>

                      {stationeryCategories.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const targetCat = stationeryCategories.find((c) => c.id === e.target.value);
                            if (targetCat) {
                              handleBulkMoveCategory(
                                'stationery_products',
                                selectedStationeryIds,
                                targetCat,
                                () => setSelectedStationeryIds([])
                              );
                            }
                            e.target.value = '';
                          }}
                          defaultValue=""
                          className="px-2.5 py-1.5 rounded-lg bg-[#2C5241] text-white font-semibold text-xs border border-[#CBB3E8]/30 cursor-pointer"
                        >
                          <option value="" disabled>
                            Move to Category...
                          </option>
                          {stationeryCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              Move to: {c.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={() =>
                          handleBulkDelete(
                            'stationery_products',
                            stationeryProducts,
                            selectedStationeryIds,
                            () => setSelectedStationeryIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected</span>
                      </button>

                      <button
                        onClick={() => setSelectedStationeryIds([])}
                        className="px-2.5 py-1.5 rounded-lg bg-[#2C5241] hover:bg-[#3d6e58] text-[#E8DCC6] font-semibold cursor-pointer"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}

                {/* Select All Checkbox Row */}
                <div className="flex items-center justify-between text-xs font-semibold text-[#1F3B2E]/70 px-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStationeryIds(filteredStationery.map((p) => p.id));
                        } else {
                          setSelectedStationeryIds([]);
                        }
                      }}
                      className="rounded text-[#1F3B2E] focus:ring-[#1F3B2E] w-4 h-4 cursor-pointer"
                    />
                    <span>Select All ({filteredStationery.length} products)</span>
                  </label>
                  <span>Showing {filteredStationery.length} of {stationeryProducts.length} items</span>
                </div>

                {/* Product Cards Grid */}
                {filteredStationery.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-[#D8C7AA] text-center space-y-2">
                    <Package className="w-10 h-10 text-[#1F3B2E]/30 mx-auto" />
                    <h4 className="font-bold text-sm text-[#1F3B2E]">No stationery products found</h4>
                    <p className="text-xs text-[#1F3B2E]/60 max-w-sm mx-auto">
                      Try adjusting your search query, clearing filters, or click "Add Stationery Product" to create one.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStationery.map((p) => {
                      const isSelected = selectedStationeryIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`bg-white p-4 rounded-2xl border-2 transition-all shadow-sm flex flex-col justify-between group ${
                            isSelected
                              ? 'border-[#1F3B2E] ring-2 ring-[#1F3B2E]/20 bg-[#F7F3EB]/30'
                              : 'border-[#D8C7AA] hover:border-[#1F3B2E]/60'
                          }`}
                        >
                          <div>
                            {/* Card Top: Checkbox, Category, Actions */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStationeryIds((prev) => [...prev, p.id]);
                                    } else {
                                      setSelectedStationeryIds((prev) => prev.filter((id) => id !== p.id));
                                    }
                                  }}
                                  className="rounded text-[#1F3B2E] focus:ring-[#1F3B2E] w-4 h-4 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold uppercase text-[#1F3B2E]/60 bg-[#F7F3EB] px-2 py-0.5 rounded border border-[#D8C7AA] truncate max-w-[130px]">
                                  {p.categoryName}
                                </span>
                              </label>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditProduct('stationery', p)}
                                  className="p-1.5 rounded-lg bg-[#E8DCC6] hover:bg-[#D8C7AA] text-[#1F3B2E] text-xs font-semibold cursor-pointer transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProduct('stationery_products', p.id, p.name, p.storagePath)
                                  }
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Product Info with Image */}
                            <div className="flex items-start gap-3">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F7F3EB] border border-[#D8C7AA] shrink-0">
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-brand-title font-bold text-sm text-[#1F3B2E] line-clamp-1">
                                  {p.name}
                                </h4>
                                {p.nameTelugu && (
                                  <span className="text-[11px] text-[#1F3B2E]/70 block truncate font-medium">
                                    {p.nameTelugu}
                                  </span>
                                )}
                                {p.brand && (
                                  <span className="text-[10px] text-[#1F3B2E]/60 block font-semibold">
                                    Brand: {p.brand}
                                  </span>
                                )}
                                <div className="text-xs font-bold text-[#1F3B2E] mt-1">
                                  {p.rateOnRequest || !p.price ? (
                                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      Rate on Request
                                    </span>
                                  ) : (
                                    <span className="text-sm font-black text-[#1F3B2E]">₹{p.price}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-[#1F3B2E]/70 mt-2.5 line-clamp-2">
                              {p.description}
                            </p>
                          </div>

                          {/* Footer Stock Toggle */}
                          <div className="mt-4 pt-3 border-t border-[#F7F3EB] flex items-center justify-between">
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'stationery_products', p.id), {
                                  inStock: !p.inStock,
                                  updatedAt: new Date().toISOString(),
                                });
                                if (onRefreshData) onRefreshData();
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                p.inStock
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                  : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                              }`}
                            >
                              {p.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                            </button>

                            <button
                              onClick={() => handleOpenEditProduct('stationery', p)}
                              className="text-xs font-bold text-[#1F3B2E] hover:underline"
                            >
                              Edit Details →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: KIDS FANCY PRODUCTS */}
          {activeTab === 'fancy' && (() => {
            const fancyCategories = categories.filter(
              (c) => c.type === 'fancy' && !c.isMainCategory && !c.id.startsWith('main_')
            );

            const filteredFancy = fancyProducts
              .filter((p) => {
                const q = fancySearch.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  p.name.toLowerCase().includes(q) ||
                  (p.nameTelugu && p.nameTelugu.toLowerCase().includes(q)) ||
                  (p.description && p.description.toLowerCase().includes(q)) ||
                  (p.subCategory && p.subCategory.toLowerCase().includes(q));
                const matchesCat =
                  fancyCatFilter === 'all' ||
                  p.subCategory === fancyCatFilter ||
                  (p as any).categoryId === fancyCatFilter;
                const matchesStock =
                  fancyStockFilter === 'all' || (fancyStockFilter === 'in' ? p.inStock : !p.inStock);
                return matchesSearch && matchesCat && matchesStock;
              })
              .sort((a, b) => {
                if (fancySort === 'name') return a.name.localeCompare(b.name);
                if (fancySort === 'price-asc') return (a.price || 0) - (b.price || 0);
                if (fancySort === 'price-desc') return (b.price || 0) - (a.price || 0);
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
              });

            const allSelected =
              filteredFancy.length > 0 && filteredFancy.every((p) => selectedFancyIds.includes(p.id));

            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <div>
                    <h3 className="font-brand-title font-bold text-base text-[#1F3B2E]">
                      Kids' Fancy Stationery Inventory ({fancyProducts.length})
                    </h3>
                    <p className="text-[11px] text-[#1F3B2E]/60">
                      Strictly children's novelty stationery • Cartoon erasers, fancy sharpeners, cute pens & sets
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenAddProduct('fancy')}
                    className="px-4 py-2 bg-[#CBB3E8] hover:bg-[#bba0dd] text-[#1F3B2E] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Fancy Item</span>
                  </button>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#D8C7AA] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3B2E]/40" />
                    <input
                      type="text"
                      placeholder="Search fancy items by cartoon character, type, or Telugu..."
                      value={fancySearch}
                      onChange={(e) => setFancySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={fancyCatFilter}
                      onChange={(e) => setFancyCatFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="all">All Subcategories</option>
                      {fancyCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={fancyStockFilter}
                      onChange={(e) => setFancyStockFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="all">All Availability</option>
                      <option value="in">In Stock Only</option>
                      <option value="out">Out of Stock Only</option>
                    </select>

                    <select
                      value={fancySort}
                      onChange={(e) => setFancySort(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedFancyIds.length > 0 && (
                  <div className="p-3 bg-[#1F3B2E] text-[#E8DCC6] rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckSquare className="w-4 h-4 text-[#CBB3E8]" />
                      <span>{selectedFancyIds.length} items selected</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() =>
                          handleBulkStockUpdate('fancy_products', selectedFancyIds, true, () =>
                            setSelectedFancyIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition-colors"
                      >
                        Mark In Stock
                      </button>

                      <button
                        onClick={() =>
                          handleBulkStockUpdate('fancy_products', selectedFancyIds, false, () =>
                            setSelectedFancyIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer transition-colors"
                      >
                        Mark Out of Stock
                      </button>

                      {fancyCategories.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const targetCat = fancyCategories.find((c) => c.id === e.target.value);
                            if (targetCat) {
                              handleBulkMoveCategory('fancy_products', selectedFancyIds, targetCat, () =>
                                setSelectedFancyIds([])
                              );
                            }
                            e.target.value = '';
                          }}
                          defaultValue=""
                          className="px-2.5 py-1.5 rounded-lg bg-[#2C5241] text-white font-semibold text-xs border border-[#CBB3E8]/30 cursor-pointer"
                        >
                          <option value="" disabled>
                            Move to Category...
                          </option>
                          {fancyCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              Move to: {c.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={() =>
                          handleBulkDelete('fancy_products', fancyProducts, selectedFancyIds, () =>
                            setSelectedFancyIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected</span>
                      </button>

                      <button
                        onClick={() => setSelectedFancyIds([])}
                        className="px-2.5 py-1.5 rounded-lg bg-[#2C5241] hover:bg-[#3d6e58] text-[#E8DCC6] font-semibold cursor-pointer"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}

                {/* Selection Count Header */}
                <div className="flex items-center justify-between text-xs font-semibold text-[#1F3B2E]/70 px-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFancyIds(filteredFancy.map((p) => p.id));
                        } else {
                          setSelectedFancyIds([]);
                        }
                      }}
                      className="rounded text-[#1F3B2E] focus:ring-[#1F3B2E] w-4 h-4 cursor-pointer"
                    />
                    <span>Select All ({filteredFancy.length} items)</span>
                  </label>
                  <span>Showing {filteredFancy.length} of {fancyProducts.length} items</span>
                </div>

                {/* Product Grid */}
                {filteredFancy.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-[#D8C7AA] text-center space-y-2">
                    <Sparkles className="w-10 h-10 text-[#CBB3E8] mx-auto" />
                    <h4 className="font-bold text-sm text-[#1F3B2E]">No kids' fancy items found</h4>
                    <p className="text-xs text-[#1F3B2E]/60 max-w-sm mx-auto">
                      Click "Add Fancy Item" above to add novelty erasers, fancy sharpeners, pens, diaries, or stationery sets.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFancy.map((p) => {
                      const isSelected = selectedFancyIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`bg-white p-4 rounded-2xl border-2 transition-all shadow-sm flex flex-col justify-between group ${
                            isSelected
                              ? 'border-[#1F3B2E] ring-2 ring-[#CBB3E8] bg-[#F7F3EB]/30'
                              : 'border-[#CBB3E8]/60 hover:border-[#1F3B2E]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFancyIds((prev) => [...prev, p.id]);
                                    } else {
                                      setSelectedFancyIds((prev) => prev.filter((id) => id !== p.id));
                                    }
                                  }}
                                  className="rounded text-[#1F3B2E] focus:ring-[#1F3B2E] w-4 h-4 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold uppercase text-[#1F3B2E] bg-[#CBB3E8]/40 px-2 py-0.5 rounded border border-[#CBB3E8] truncate max-w-[130px]">
                                  {p.subCategory}
                                </span>
                              </label>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditProduct('fancy', p)}
                                  className="p-1.5 rounded-lg bg-[#E8DCC6] hover:bg-[#D8C7AA] text-[#1F3B2E] text-xs font-semibold cursor-pointer"
                                  title="Edit Fancy Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProduct('fancy_products', p.id, p.name, p.storagePath)
                                  }
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F7F3EB] border border-[#D8C7AA] shrink-0">
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-brand-title font-bold text-sm text-[#1F3B2E] line-clamp-1">
                                  {p.name}
                                </h4>
                                {p.nameTelugu && (
                                  <span className="text-[11px] text-[#1F3B2E]/70 block truncate font-medium">
                                    {p.nameTelugu}
                                  </span>
                                )}
                                {p.ageGroup && (
                                  <span className="text-[10px] text-[#1F3B2E]/60 block font-semibold">
                                    Age: {p.ageGroup}
                                  </span>
                                )}
                                <div className="text-xs font-bold text-[#1F3B2E] mt-1">
                                  {p.rateOnRequest || !p.price ? (
                                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      Rate on Request
                                    </span>
                                  ) : (
                                    <span className="text-sm font-black text-[#1F3B2E]">₹{p.price}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-[#1F3B2E]/70 mt-2.5 line-clamp-2">
                              {p.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#F7F3EB] flex items-center justify-between">
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'fancy_products', p.id), {
                                  inStock: !p.inStock,
                                  updatedAt: new Date().toISOString(),
                                });
                                if (onRefreshData) onRefreshData();
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                p.inStock
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                  : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                              }`}
                            >
                              {p.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                            </button>

                            <button
                              onClick={() => handleOpenEditProduct('fancy', p)}
                              className="text-xs font-bold text-[#1F3B2E] hover:underline"
                            >
                              Edit Details →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: SPORTS ITEMS */}
          {activeTab === 'sports' && (() => {
            const sportsCategories = categories.filter(
              (c) => c.type === 'sports' && !c.isMainCategory && !c.id.startsWith('main_')
            );

            const filteredSports = sportsProducts
              .filter((p) => {
                const q = sportsSearch.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  p.name.toLowerCase().includes(q) ||
                  (p.nameTelugu && p.nameTelugu.toLowerCase().includes(q)) ||
                  (p.description && p.description.toLowerCase().includes(q)) ||
                  (p.brand && p.brand.toLowerCase().includes(q));
                const matchesCat = sportsCatFilter === 'all' || p.categoryId === sportsCatFilter;
                const matchesStock =
                  sportsStockFilter === 'all' || (sportsStockFilter === 'in' ? p.inStock : !p.inStock);
                return matchesSearch && matchesCat && matchesStock;
              })
              .sort((a, b) => {
                if (sportsSort === 'name') return a.name.localeCompare(b.name);
                if (sportsSort === 'price-asc') return (a.price || 0) - (b.price || 0);
                if (sportsSort === 'price-desc') return (b.price || 0) - (a.price || 0);
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
              });

            const allSelected =
              filteredSports.length > 0 && filteredSports.every((p) => selectedSportsIds.includes(p.id));

            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <div>
                    <h3 className="font-brand-title font-bold text-base text-[#1F3B2E]">
                      Sports Items Inventory ({sportsProducts.length})
                    </h3>
                    <p className="text-[11px] text-[#1F3B2E]/60">
                      Unlimited sports products • Small cricket bats, balls, skipping ropes & sports equipment
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenAddProduct('sports')}
                    className="px-4 py-2 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#CBB3E8]" />
                    <span>Add Sports Item</span>
                  </button>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#D8C7AA] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3B2E]/40" />
                    <input
                      type="text"
                      placeholder="Search sports goods by name, brand, or Telugu..."
                      value={sportsSearch}
                      onChange={(e) => setSportsSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={sportsCatFilter}
                      onChange={(e) => setSportsCatFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="all">All Subcategories</option>
                      {sportsCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={sportsStockFilter}
                      onChange={(e) => setSportsStockFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="all">All Availability</option>
                      <option value="in">In Stock Only</option>
                      <option value="out">Out of Stock Only</option>
                    </select>

                    <select
                      value={sportsSort}
                      onChange={(e) => setSportsSort(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedSportsIds.length > 0 && (
                  <div className="p-3 bg-[#1F3B2E] text-[#E8DCC6] rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckSquare className="w-4 h-4 text-[#CBB3E8]" />
                      <span>{selectedSportsIds.length} items selected</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() =>
                          handleBulkStockUpdate('sports_products', selectedSportsIds, true, () =>
                            setSelectedSportsIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition-colors"
                      >
                        Mark In Stock
                      </button>

                      <button
                        onClick={() =>
                          handleBulkStockUpdate('sports_products', selectedSportsIds, false, () =>
                            setSelectedSportsIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer transition-colors"
                      >
                        Mark Out of Stock
                      </button>

                      {sportsCategories.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const targetCat = sportsCategories.find((c) => c.id === e.target.value);
                            if (targetCat) {
                              handleBulkMoveCategory('sports_products', selectedSportsIds, targetCat, () =>
                                setSelectedSportsIds([])
                              );
                            }
                            e.target.value = '';
                          }}
                          defaultValue=""
                          className="px-2.5 py-1.5 rounded-lg bg-[#2C5241] text-white font-semibold text-xs border border-[#CBB3E8]/30 cursor-pointer"
                        >
                          <option value="" disabled>
                            Move to Category...
                          </option>
                          {sportsCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              Move to: {c.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={() =>
                          handleBulkDelete('sports_products', sportsProducts, selectedSportsIds, () =>
                            setSelectedSportsIds([])
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected</span>
                      </button>

                      <button
                        onClick={() => setSelectedSportsIds([])}
                        className="px-2.5 py-1.5 rounded-lg bg-[#2C5241] hover:bg-[#3d6e58] text-[#E8DCC6] font-semibold cursor-pointer"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}

                {/* Selection Count Header */}
                <div className="flex items-center justify-between text-xs font-semibold text-[#1F3B2E]/70 px-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSportsIds(filteredSports.map((p) => p.id));
                        } else {
                          setSelectedSportsIds([]);
                        }
                      }}
                      className="rounded text-[#1F3B2E] focus:ring-[#1F3B2E] w-4 h-4 cursor-pointer"
                    />
                    <span>Select All ({filteredSports.length} items)</span>
                  </label>
                  <span>Showing {filteredSports.length} of {sportsProducts.length} items</span>
                </div>

                {/* Product Grid */}
                {filteredSports.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-[#D8C7AA] text-center space-y-2">
                    <Trophy className="w-10 h-10 text-[#1F3B2E]/30 mx-auto" />
                    <h4 className="font-bold text-sm text-[#1F3B2E]">No sports products found</h4>
                    <p className="text-xs text-[#1F3B2E]/60 max-w-sm mx-auto">
                      Click "Add Sports Item" above to add cricket bats, balls, badminton rackets, or sports equipment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSports.map((p) => {
                      const isSelected = selectedSportsIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`bg-white p-4 rounded-2xl border-2 transition-all shadow-sm flex flex-col justify-between group ${
                            isSelected
                              ? 'border-[#1F3B2E] ring-2 ring-[#1F3B2E]/20 bg-[#F7F3EB]/30'
                              : 'border-[#D8C7AA] hover:border-[#1F3B2E]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSportsIds((prev) => [...prev, p.id]);
                                    } else {
                                      setSelectedSportsIds((prev) => prev.filter((id) => id !== p.id));
                                    }
                                  }}
                                  className="rounded text-[#1F3B2E] focus:ring-[#1F3B2E] w-4 h-4 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold uppercase text-[#1F3B2E] bg-[#E8DCC6] px-2 py-0.5 rounded border border-[#D8C7AA] truncate max-w-[130px]">
                                  {p.categoryName}
                                </span>
                              </label>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditProduct('sports', p)}
                                  className="p-1.5 rounded-lg bg-[#E8DCC6] hover:bg-[#D8C7AA] text-[#1F3B2E] text-xs font-semibold cursor-pointer"
                                  title="Edit Sports Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProduct('sports_products', p.id, p.name, p.storagePath)
                                  }
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F7F3EB] border border-[#D8C7AA] shrink-0">
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-brand-title font-bold text-sm text-[#1F3B2E] line-clamp-1">
                                  {p.name}
                                </h4>
                                {p.nameTelugu && (
                                  <span className="text-[11px] text-[#1F3B2E]/70 block truncate font-medium">
                                    {p.nameTelugu}
                                  </span>
                                )}
                                {p.brand && (
                                  <span className="text-[10px] text-[#1F3B2E]/60 block font-semibold">
                                    Brand: {p.brand}
                                  </span>
                                )}
                                <div className="text-xs font-bold text-[#1F3B2E] mt-1">
                                  {p.rateOnRequest || !p.price ? (
                                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      Rate on Request
                                    </span>
                                  ) : (
                                    <span className="text-sm font-black text-[#1F3B2E]">₹{p.price}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-[#1F3B2E]/70 mt-2.5 line-clamp-2">
                              {p.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#F7F3EB] flex items-center justify-between">
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'sports_products', p.id), {
                                  inStock: !p.inStock,
                                  updatedAt: new Date().toISOString(),
                                });
                                if (onRefreshData) onRefreshData();
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                p.inStock
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                  : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                              }`}
                            >
                              {p.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                            </button>

                            <button
                              onClick={() => handleOpenEditProduct('sports', p)}
                              className="text-xs font-bold text-[#1F3B2E] hover:underline"
                            >
                              Edit Details →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: UNLIMITED CATEGORY MANAGEMENT */}
          {activeTab === 'categories' && (() => {
            const rawCategories = categories.filter(
              (c) => !c.isMainCategory && !c.id.startsWith('main_')
            );

            const filteredCats = rawCategories
              .filter((c) => {
                const q = catSearch.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  c.name.toLowerCase().includes(q) ||
                  (c.nameTelugu && c.nameTelugu.toLowerCase().includes(q));
                const matchesType = catTypeFilter === 'all' || c.type === catTypeFilter;
                return matchesSearch && matchesType;
              })
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <div>
                    <h3 className="font-brand-title font-bold text-base text-[#1F3B2E]">
                      Dynamic Subcategories Management ({rawCategories.length})
                    </h3>
                    <p className="text-[11px] text-[#1F3B2E]/60">
                      Create unlimited subcategories for Stationery, Kids' Fancy, and Sports Items with images & display order
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryDefaultType(catTypeFilter === 'all' ? 'stationery' : (catTypeFilter as any));
                      setCategoryModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#CBB3E8]" />
                    <span>Add New Category</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#D8C7AA] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3B2E]/40" />
                    <input
                      type="text"
                      placeholder="Search categories by English or Telugu name..."
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={catTypeFilter}
                      onChange={(e) => setCatTypeFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="all">All Main Sections</option>
                      <option value="stationery">01. Stationery Categories</option>
                      <option value="fancy">02. Kids' Fancy Categories</option>
                      <option value="sports">04. Sports Categories</option>
                    </select>
                  </div>
                </div>

                {/* Categories Cards Grid */}
                {filteredCats.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-[#D8C7AA] text-center space-y-2">
                    <Tag className="w-10 h-10 text-[#1F3B2E]/30 mx-auto" />
                    <h4 className="font-bold text-sm text-[#1F3B2E]">No categories found</h4>
                    <p className="text-xs text-[#1F3B2E]/60 max-w-sm mx-auto">
                      Click "Add New Category" above to create subcategories without touching any code.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredCats.map((c) => {
                      // Count linked products
                      let count = 0;
                      if (c.type === 'stationery') {
                        count = stationeryProducts.filter((p) => p.categoryId === c.id).length;
                      } else if (c.type === 'fancy') {
                        count = fancyProducts.filter(
                          (p) => p.subCategory === c.name || p.categoryId === c.id
                        ).length;
                      } else if (c.type === 'sports') {
                        count = sportsProducts.filter((p) => p.categoryId === c.id).length;
                      }

                      return (
                        <div
                          key={c.id}
                          className="bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold text-[#1F3B2E] bg-[#F7F3EB] px-2 py-0.5 rounded-md border border-[#D8C7AA]">
                                {c.type === 'fancy'
                                  ? "Kids' Fancy"
                                  : c.type === 'sports'
                                  ? 'Sports'
                                  : 'Stationery'}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingCategory(c);
                                    setCategoryModalOpen(true);
                                  }}
                                  className="p-1 rounded-lg bg-[#E8DCC6] hover:bg-[#D8C7AA] text-[#1F3B2E] cursor-pointer"
                                  title="Edit Category"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategoryWithCheck(c)}
                                  className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-2.5">
                              {c.imageUrl && (
                                <img
                                  src={c.imageUrl}
                                  alt={c.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-[#D8C7AA] shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-[#1F3B2E] truncate">{c.name}</h4>
                                {c.nameTelugu && (
                                  <span className="text-[11px] text-[#1F3B2E]/60 block font-medium">
                                    {c.nameTelugu}
                                  </span>
                                )}
                              </div>
                            </div>

                            {c.description && (
                              <p className="text-[11px] text-[#1F3B2E]/70 mt-2 line-clamp-2">
                                {c.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-[#F7F3EB] flex items-center justify-between text-[11px]">
                            <span className="text-[#1F3B2E]/60 font-medium">Order: #{c.order || 1}</span>
                            <span className="font-bold text-[#1F3B2E] bg-[#E8DCC6]/60 px-2 py-0.5 rounded-full">
                              {count} products
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: SERVICES (XEROX & PRINT) */}
          {activeTab === 'services' && (() => {
            const filteredServices = services
              .filter((s) => {
                const q = serviceSearch.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  s.name.toLowerCase().includes(q) ||
                  (s.nameTelugu && s.nameTelugu.toLowerCase().includes(q)) ||
                  (s.description && s.description.toLowerCase().includes(q));
                const matchesType = serviceTypeFilter === 'all' || s.category === serviceTypeFilter;
                return matchesSearch && matchesType;
              })
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm">
                  <div>
                    <h3 className="font-brand-title font-bold text-base text-[#1F3B2E]">
                      Xerox & Printing Services Rates ({services.length})
                    </h3>
                    <p className="text-[11px] text-[#1F3B2E]/60">
                      Full control over single-side, double-side, colour printing, lamination, and counter rates
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingService(null);
                      setServiceModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#CBB3E8]" />
                    <span>Add New Service Rate</span>
                  </button>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#D8C7AA] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3B2E]/40" />
                    <input
                      type="text"
                      placeholder="Search services by name or description..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={serviceTypeFilter}
                      onChange={(e) => setServiceTypeFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-semibold text-[#1F3B2E] focus:outline-none"
                    >
                      <option value="all">All Service Categories</option>
                      <option value="xerox">Xerox (Black & White)</option>
                      <option value="printing">Colour Printing</option>
                      <option value="lamination">Lamination</option>
                      <option value="other">Other Shop Services</option>
                    </select>
                  </div>
                </div>

                {/* Services Grid */}
                {filteredServices.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-[#D8C7AA] text-center space-y-2">
                    <Printer className="w-10 h-10 text-[#1F3B2E]/30 mx-auto" />
                    <h4 className="font-bold text-sm text-[#1F3B2E]">No services found</h4>
                    <p className="text-xs text-[#1F3B2E]/60 max-w-sm mx-auto">
                      Click "Add New Service Rate" above to create Xerox or printing rates.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredServices.map((srv) => (
                      <div
                        key={srv.id}
                        className="bg-white p-5 rounded-2xl border border-[#D8C7AA] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-[#1F3B2E]/70 bg-[#F7F3EB] px-2 py-0.5 rounded border border-[#D8C7AA]">
                                {srv.category}
                              </span>
                              <h4 className="font-brand-title font-bold text-sm sm:text-base text-[#1F3B2E] mt-1.5">
                                {srv.name}
                              </h4>
                              {srv.nameTelugu && (
                                <span className="text-[11px] text-[#1F3B2E]/60 block font-medium">
                                  {srv.nameTelugu}
                                </span>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-black text-base text-[#1F3B2E]">
                                {srv.rateOnRequest || !srv.priceStartingFrom ? (
                                  'Rate on Request'
                                ) : (
                                  `₹${srv.priceStartingFrom}`
                                )}
                              </span>
                              {srv.rateUnit && (
                                <span className="text-[10px] text-[#1F3B2E]/60 block uppercase font-bold">
                                  {srv.rateUnit}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-[#1F3B2E]/70 mt-2.5 leading-relaxed">
                            {srv.description}
                          </p>

                          {/* Options Chips */}
                          {srv.options && srv.options.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-[#F7F3EB]">
                              <span className="text-[10px] font-bold text-[#1F3B2E]/60 uppercase block mb-1.5">
                                Available Options ({srv.options.length}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {srv.options.map((opt, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded-lg bg-[#F7F3EB] border border-[#D8C7AA] text-[11px] font-medium text-[#1F3B2E]"
                                  >
                                    {opt.label}
                                    {opt.price !== undefined && (
                                      <strong className="ml-1 text-[#1F3B2E]">₹{opt.price}</strong>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Service Actions Footer */}
                        <div className="mt-4 pt-3 border-t border-[#F7F3EB] flex items-center justify-between">
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, 'services', srv.id), {
                                available: !srv.available,
                              });
                              if (onRefreshData) onRefreshData();
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                              srv.available
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {srv.available ? '✓ Counter Available' : '✗ Temporarily Unavailable'}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingService(srv);
                                setServiceModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#E8DCC6] hover:bg-[#D8C7AA] text-[#1F3B2E] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Service</span>
                            </button>

                            <button
                              onClick={() => handleDeleteService(srv)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: OFFERS */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#D8C7AA]">
                <div>
                  <h3 className="font-bold text-sm text-[#1F3B2E]">Offers & Promotions ({offers.length})</h3>
                  <span className="text-[11px] text-[#1F3B2E]/60">Manage promotional banners</span>
                </div>
                <button
                  onClick={() => {
                    const title = prompt('Offer Title:');
                    if (!title) return;
                    const desc = prompt('Description:') || '';
                    const newId = `off_${Date.now()}`;
                    const newOff: Offer = {
                      id: newId,
                      title,
                      description: desc,
                      discountBadge: 'SPECIAL DEAL',
                      posterUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=700&q=80',
                      startDate: new Date().toISOString().slice(0, 10),
                      expiryDate: '2026-12-31',
                      isActive: true,
                      createdAt: new Date().toISOString(),
                    };
                    setDoc(doc(db, 'offers', newId), newOff).then(() => {
                      if (onRefreshData) onRefreshData();
                    });
                  }}
                  className="px-3 py-1.5 bg-[#1F3B2E] text-[#E8DCC6] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Offer</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((off) => (
                  <div key={off.id} className="bg-white p-4 rounded-2xl border border-[#D8C7AA] space-y-3">
                    <h4 className="font-bold text-sm text-[#1F3B2E]">{off.title}</h4>
                    <p className="text-xs text-[#1F3B2E]/70">{off.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-[#F7F3EB]">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8DCC6]">
                        {off.discountBadge}
                      </span>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete offer?')) {
                            await deleteDoc(doc(db, 'offers', off.id));
                            if (onRefreshData) onRefreshData();
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D8C7AA]">
                <div>
                  <h3 className="font-bold text-sm text-[#1F3B2E]">
                    Customer Records ({customers.length})
                  </h3>
                  <span className="text-[11px] text-[#1F3B2E]/60">
                    Customers who ordered or sent enquiries
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3B2E]/50" />
                    <input
                      type="text"
                      placeholder="Search customer name or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={exportCustomersToCSV}
                    className="px-3 py-1.5 bg-[#1F3B2E] text-[#E8DCC6] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#D8C7AA] overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F3EB] text-[#1F3B2E]/70 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Mobile Number</th>
                      <th className="p-3">Orders</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F7F3EB]">
                    {customers
                      .filter((c) => {
                        const q = customerSearch.toLowerCase().trim();
                        return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
                      })
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-[#F7F3EB]/50">
                          <td className="p-3 font-bold text-[#1F3B2E]">{c.name}</td>
                          <td className="p-3 font-mono">{c.phone}</td>
                          <td className="p-3 font-bold">{c.totalOrders || 1}</td>
                          <td className="p-3 text-[11px] text-[#1F3B2E]/70">{c.createdAt?.slice(0, 10)}</td>
                          <td className="p-3">
                            <a
                              href={`https://wa.me/91${c.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                                c.name
                              )},%20Greetings%20from%20SREE%20DURGA%20MATA`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SOCIAL MEDIA */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#D8C7AA]">
                <div>
                  <h3 className="font-bold text-sm text-[#1F3B2E]">
                    Social Media Management ({socialAccounts.length})
                  </h3>
                  <span className="text-[11px] text-[#1F3B2E]/60">
                    Directly synced with Contact Section on customer website
                  </span>
                </div>

                <button
                  onClick={() => {
                    const platform = prompt('Platform (Instagram / Facebook / YouTube / WhatsApp / Other):') || 'Instagram';
                    const accountName = prompt('Account Name or Handle (e.g. @sreedurgamata):') || '@account';
                    const profileUrl = prompt('Profile URL (e.g. https://instagram.com/...):') || 'https://instagram.com';
                    const newId = `soc_${Date.now()}`;
                    const newSoc: SocialMediaAccount = {
                      id: newId,
                      platform: platform as any,
                      accountName,
                      profileUrl,
                      iconKey: platform,
                      order: socialAccounts.length + 1,
                      isActive: true,
                    };
                    setDoc(doc(db, 'social_media', newId), newSoc).then(() => {
                      if (onRefreshData) onRefreshData();
                    });
                  }}
                  className="px-3 py-1.5 bg-[#1F3B2E] text-[#E8DCC6] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Social Link</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {socialAccounts.map((soc) => (
                  <div
                    key={soc.id}
                    className="bg-white p-4 rounded-2xl border border-[#D8C7AA] shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-[#E8DCC6] text-[#1F3B2E] text-[10px] font-bold">
                        {soc.platform}
                      </span>
                      <button
                        onClick={async () => {
                          await updateDoc(doc(db, 'social_media', soc.id), {
                            isActive: !soc.isActive,
                          });
                          if (onRefreshData) onRefreshData();
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          soc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {soc.isActive ? 'Visible' : 'Hidden'}
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#1F3B2E]">{soc.accountName}</h4>
                      <a
                        href={soc.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#1F3B2E]/60 truncate block hover:underline"
                      >
                        {soc.profileUrl}
                      </a>
                    </div>

                    <div className="pt-2 border-t border-[#F7F3EB] flex items-center justify-between">
                      <button
                        onClick={async () => {
                          const newUrl = prompt('Enter new Profile URL:', soc.profileUrl);
                          if (newUrl) {
                            await updateDoc(doc(db, 'social_media', soc.id), { profileUrl: newUrl });
                            if (onRefreshData) onRefreshData();
                          }
                        }}
                        className="text-xs font-bold text-[#1F3B2E] hover:underline"
                      >
                        Edit URL
                      </button>

                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete social link ${soc.accountName}?`)) {
                            await deleteDoc(doc(db, 'social_media', soc.id));
                            if (onRefreshData) onRefreshData();
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
         
{activeTab === 'settings' && (
  <div className="max-w-2xl bg-white p-6 rounded-3xl border border-[#D8C7AA] shadow-sm space-y-4">
    <h3 className="font-brand-title font-bold text-lg text-[#1F3B2E]">
      Store Information & Contact Details
    </h3>

    <form
      onSubmit={async (e) => {
        e.preventDefault();

        try {
          setSavingSettings(true);

          await setDoc(
            doc(db, 'shop_settings', 'main'),
            settingsForm,
            { merge: true }
          );

          alert('Store details saved to Firebase!');

          if (onRefreshData) {
            await onRefreshData();
          }
        } catch (error) {
          console.error('Settings save error:', error);
          alert('Failed to save store details. Please try again.');
        } finally {
          setSavingSettings(false);
        }
      }}
      className="space-y-3 text-xs"
    >
      <div>
        <label className="font-bold block mb-1">Shop Name:</label>
        <input
          type="text"
          value={settingsForm.shopName || ''}
          onChange={(e) =>
            setSettingsForm(prev => ({
              ...prev,
              shopName: e.target.value
            }))
          }
          className="w-full p-2.5 rounded-xl border border-[#D8C7AA]"
        />
      </div>

      <div>
        <label className="font-bold block mb-1">Subtitle:</label>
        <input
          type="text"
          value={settingsForm.shopSubtitle || ''}
          onChange={(e) =>
            setSettingsForm(prev => ({
              ...prev,
              shopSubtitle: e.target.value
            }))
          }
          className="w-full p-2.5 rounded-xl border border-[#D8C7AA]"
        />
      </div>

      <div>
        <label className="font-bold block mb-1">Official Address:</label>
        <textarea
          rows={2}
          value={settingsForm.address || ''}
          onChange={(e) =>
            setSettingsForm(prev => ({
              ...prev,
              address: e.target.value
            }))
          }
          className="w-full p-2.5 rounded-xl border border-[#D8C7AA]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="font-bold block mb-1">Phone Number:</label>
          <input
            type="tel"
            value={settingsForm.phone || ''}
            onChange={(e) =>
              setSettingsForm(prev => ({
                ...prev,
                phone: e.target.value
              }))
            }
            className="w-full p-2.5 rounded-xl border border-[#D8C7AA]"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="font-bold block mb-1">WhatsApp Number:</label>
          <input
            type="tel"
            value={settingsForm.whatsapp || ''}
            onChange={(e) =>
              setSettingsForm(prev => ({
                ...prev,
                whatsapp: e.target.value
              }))
            }
            className="w-full p-2.5 rounded-xl border border-[#D8C7AA]"
            placeholder="Enter WhatsApp number"
          />
        </div>
      </div>

      <div>
        <label className="font-bold block mb-1">Gmail Address:</label>
        <input
          type="email"
          value={settingsForm.email || ''}
          onChange={(e) =>
            setSettingsForm(prev => ({
              ...prev,
              email: e.target.value
            }))
          }
          className="w-full p-2.5 rounded-xl border border-[#D8C7AA]"
          placeholder="Enter Gmail address"
        />
      </div>

      <div>
        <label className="font-bold block mb-1">Opening Hours:</label>
        <input
          type="text"
          value={settingsForm.openingHours || ''}
          onChange={(e) =>
            setSettingsForm(prev => ({
              ...prev,
              openingHours: e.target.value
            }))
          }
          className="w-full p-2.5 rounded-xl border border-[#D8C7AA]"
        />
      </div>

      <button
        type="submit"
        disabled={savingSettings}
        className="w-full py-3 bg-[#1F3B2E] text-[#E8DCC6] hover:bg-[#2C5241] font-bold rounded-xl cursor-pointer mt-4 disabled:opacity-50"
      >
        {savingSettings ? 'Saving...' : 'Save to Firebase'}
      </button>
    </form>
  </div>
)}

      

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={(msg) => {
          setActionSuccessMsg(msg);
          if (onRefreshData) onRefreshData();
        }}
        productType={productModalType}
        categories={categories}
        initialData={editingProduct}
      />

      {/* Category Add/Edit Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={(msg) => {
          setActionSuccessMsg(msg);
          if (onRefreshData) onRefreshData();
        }}
        initialData={editingCategory}
        defaultType={categoryDefaultType}
        totalCategoriesCount={categories.length}
      />

      {/* Service Add/Edit Modal */}
      <ServiceModal
        isOpen={serviceModalOpen}
        onClose={() => {
          setServiceModalOpen(false);
          setEditingService(null);
        }}
        onSuccess={(msg) => {
          setActionSuccessMsg(msg);
          if (onRefreshData) onRefreshData();
        }}
        initialData={editingService}
        totalServicesCount={services.length}
      />
    </div>
  );
};

