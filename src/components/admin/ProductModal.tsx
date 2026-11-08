import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Tag,
  Package
} from 'lucide-react';
import { Category, StationeryProduct, FancyProduct, SportsProduct } from '../../types';
import { validateImageFile, uploadImageFile, deleteStorageFile } from '../../lib/storageHelper';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type ProductType = 'stationery' | 'fancy' | 'sports';

export interface ProductModalData {
  id?: string;
  name: string;
  nameTelugu?: string;
  categoryId: string;
  categoryName: string;
  subCategory?: string; // used by fancy products
  description: string;
  price?: number;
  rateOnRequest: boolean;
  inStock: boolean;
  imageUrl: string;
  storagePath?: string;
  brand?: string;
  ageGroup?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  productType: ProductType;
  categories: Category[];
  initialData?: ProductModalData | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productType,
  categories,
  initialData,
}) => {
  const isEdit = Boolean(initialData?.id);

  // Subcategories matching this product type
  const matchingCategories = categories.filter(
    (c) => c.type === productType && !c.isMainCategory && !c.id.startsWith('main_')
  );

  const defaultCat = matchingCategories[0] || {
    id: `cat-${productType}-general`,
    name: productType === 'fancy' ? 'Novelty Stationery' : productType === 'sports' ? 'General Sports' : 'General Stationery',
  };

  const [name, setName] = useState('');
  const [nameTelugu, setNameTelugu] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'request'>('fixed');
  const [price, setPrice] = useState<string>('50');
  const [inStock, setInStock] = useState<boolean>(true);
  const [brand, setBrand] = useState('');
  const [ageGroup, setAgeGroup] = useState('All Ages');

  // Image states
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentStoragePath, setCurrentStoragePath] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialData) {
        setName(initialData.name || '');
        setNameTelugu(initialData.nameTelugu || '');
        const catId = initialData.categoryId || initialData.subCategory || defaultCat.id;
        const catObj = matchingCategories.find((c) => c.id === catId || c.name === catId);
        setCategoryId(catObj ? catObj.id : catId);
        setCategoryName(catObj ? catObj.name : initialData.categoryName || defaultCat.name);
        setDescription(initialData.description || '');
        setPriceType(initialData.rateOnRequest || !initialData.price ? 'request' : 'fixed');
        setPrice(initialData.price ? initialData.price.toString() : '');
        setInStock(initialData.inStock !== false);
        setBrand(initialData.brand || '');
        setAgeGroup(initialData.ageGroup || 'All Ages');
        setCurrentImageUrl(initialData.imageUrl || '');
        setCurrentStoragePath(initialData.storagePath || '');
      } else {
        // Reset to clean defaults
        setName('');
        setNameTelugu('');
        setCategoryId(defaultCat.id);
        setCategoryName(defaultCat.name);
        setDescription('');
        setPriceType('fixed');
        setPrice('50');
        setInStock(true);
        setBrand('');
        setAgeGroup('All Ages');
        setCurrentImageUrl('');
        setCurrentStoragePath('');
      }
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [isOpen, initialData, productType]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid image file.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCurrentImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = currentImageUrl;
      let finalStoragePath = currentStoragePath;

      // 1. Upload new image file if selected
      if (selectedFile) {
        const uploadResult = await uploadImageFile(selectedFile, `${productType}_products`);
        finalImageUrl = uploadResult.downloadUrl;
        
        // Clean up previous storage file if it exists and changed
        if (currentStoragePath && currentStoragePath !== uploadResult.storagePath) {
          await deleteStorageFile(currentStoragePath);
        }
        finalStoragePath = uploadResult.storagePath;
      } else if (!currentImageUrl && currentStoragePath) {
        // Image was removed
        await deleteStorageFile(currentStoragePath);
        finalStoragePath = '';
      }

      // If still no image, use high-quality domain fallback
      if (!finalImageUrl) {
        finalImageUrl =
          productType === 'fancy'
            ? 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80'
            : productType === 'sports'
            ? 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80';
      }

      const numPrice = priceType === 'fixed' && price ? parseFloat(price) : undefined;
      const isRateOnReq = priceType === 'request' || !numPrice || isNaN(numPrice);

      const productId = initialData?.id || `${productType}_${Date.now()}`;
      const collectionName =
        productType === 'fancy'
          ? 'fancy_products'
          : productType === 'sports'
          ? 'sports_products'
          : 'stationery_products';

      const catObj = matchingCategories.find((c) => c.id === categoryId);
      const resolvedCategoryName = catObj ? catObj.name : categoryName || 'General';

      const payload: any = {
        id: productId,
        name: name.trim(),
        nameTelugu: nameTelugu.trim() || undefined,
        categoryId: categoryId || 'general',
        categoryName: resolvedCategoryName,
        description: description.trim() || `${name.trim()} available at Sree Durga Mata.`,
        price: !isRateOnReq && numPrice ? numPrice : 0,
        rateOnRequest: isRateOnReq,
        inStock: inStock,
        imageUrl: finalImageUrl,
        storagePath: finalStoragePath || undefined,
        createdAt: initialData?.id ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (brand.trim()) payload.brand = brand.trim();
      if (productType === 'fancy') {
        payload.subCategory = resolvedCategoryName;
        payload.ageGroup = ageGroup;
      }

      await setDoc(doc(db, collectionName, productId), payload, { merge: true });

      onSuccess(
        isEdit
          ? `✓ Product "${name}" updated successfully!`
          : `✓ Product "${name}" added to ${productType.toUpperCase()} inventory!`
      );
      onClose();
    } catch (err: any) {
      console.error('Save product error:', err);
      setErrorMsg(`Failed to save product: ${err.message || 'Unknown database error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSectionTitle = () => {
    const typeLabel =
      productType === 'fancy'
        ? "Kids' Fancy Item"
        : productType === 'sports'
        ? 'Sports Item'
        : 'Stationery Product';
    return isEdit ? `Edit ${typeLabel}` : `Add New ${typeLabel}`;
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#F7F3EB] rounded-3xl shadow-2xl border-2 border-[#1F3B2E] overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-[#1F3B2E] text-[#E8DCC6] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CBB3E8] text-[#1F3B2E] flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-brand-title font-bold text-base sm:text-lg text-white">
                {getSectionTitle()}
              </h3>
              <span className="text-[10px] text-[#CBB3E8] uppercase tracking-wider block font-semibold">
                Permanent Firestore & Firebase Storage Sync
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C5241] text-[#E8DCC6] hover:bg-[#CBB3E8] hover:text-[#1F3B2E] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                Product Name (English) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Classmate Long Notebook / Cartoon Eraser Set"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                Telugu Name (ఐచ్ఛికం - Optional)
              </label>
              <input
                type="text"
                value={nameTelugu}
                onChange={(e) => setNameTelugu(e.target.value)}
                placeholder="e.g. క్లాస్‌మేట్ లాంగ్ నోట్‌బుక్"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              />
            </div>
          </div>

          {/* Row 2: Category and Brand/Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                Category / Subcategory <span className="text-rose-600">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  const sel = matchingCategories.find((c) => c.id === e.target.value);
                  if (sel) setCategoryName(sel.name);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              >
                {matchingCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.nameTelugu ? `(${cat.nameTelugu})` : ''}
                  </option>
                ))}
              </select>
              {matchingCategories.length === 0 && (
                <span className="text-[10px] text-amber-700 block mt-1">
                  Tip: Add dynamic categories in the "Categories" tab!
                </span>
              )}
            </div>

            {productType === 'fancy' ? (
              <div>
                <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                  Age Recommendation
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                >
                  <option value="All Ages">All Kids</option>
                  <option value="3-5 Years">3-5 Years (Preschool)</option>
                  <option value="6-9 Years">6-9 Years (Primary)</option>
                  <option value="10+ Years">10+ Years (Students)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                  Brand / Manufacturer (Optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Classmate, Doms, Apsara, SG"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                />
              </div>
            )}
          </div>

          {/* Row 3: Pricing & Availability */}
          <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F3B2E]">Pricing Method</label>
              <div className="flex items-center gap-1 bg-[#F7F3EB] p-1 rounded-xl border border-[#D8C7AA]">
                <button
                  type="button"
                  onClick={() => setPriceType('fixed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    priceType === 'fixed'
                      ? 'bg-[#1F3B2E] text-[#E8DCC6] shadow-sm'
                      : 'text-[#1F3B2E]/70 hover:text-[#1F3B2E]'
                  }`}
                >
                  Specific Price (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setPriceType('request')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    priceType === 'request'
                      ? 'bg-[#1F3B2E] text-[#E8DCC6] shadow-sm'
                      : 'text-[#1F3B2E]/70 hover:text-[#1F3B2E]'
                  }`}
                >
                  Rate on Request
                </button>
              </div>
            </div>

            {priceType === 'fixed' ? (
              <div className="pt-2 border-t border-[#F7F3EB] flex items-center gap-3">
                <span className="text-sm font-bold text-[#1F3B2E]">₹ Price:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required={priceType === 'fixed'}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-36 px-3 py-1.5 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-bold text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                />
                <span className="text-[11px] text-[#1F3B2E]/60">
                  Displayed directly to customers on product card
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-[#1F3B2E]/70 italic pt-1">
                "Rate on Request" will be displayed instead of a fixed amount. Customers can inquire via WhatsApp.
              </p>
            )}

            {/* Availability Toggle */}
            <div className="pt-3 border-t border-[#F7F3EB] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1F3B2E] block">Product Availability</span>
                <span className="text-[11px] text-[#1F3B2E]/60">
                  Controls whether customers can add this item to their order selection
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInStock(!inStock)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  inStock
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {inStock ? '✓ In Stock' : '✗ Out of Stock'}
              </button>
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Premium quality paper notebook with durable binding, smooth writing surface, 172 ruled pages."
              className="w-full p-3 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
            />
          </div>

          {/* Row 5: Product Image from Computer */}
          <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F3B2E]">Product Image</label>
              <span className="text-[11px] text-[#1F3B2E]/60">JPG, PNG, WEBP (Max 5MB)</span>
            </div>

            {/* Image Preview Box */}
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#D8C7AA] overflow-hidden bg-[#F7F3EB] flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : currentImageUrl ? (
                  <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#1F3B2E]/30" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#CBB3E8]" />
                    <span>Choose Image from Computer</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {(previewUrl || currentImageUrl) && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[#1F3B2E]/70 leading-snug">
                  {selectedFile
                    ? `Selected: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB) - will upload to Firebase Storage.`
                    : currentImageUrl
                    ? 'Current image active. Select a new file above to replace it.'
                    : 'No custom image chosen yet. A default category photo will be used if left empty.'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-[#D8C7AA] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D8C7AA] bg-white text-[#1F3B2E] font-bold text-xs hover:bg-[#F7F3EB] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#CBB3E8]" />
                  <span>{isEdit ? 'Save Changes' : 'Create Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
