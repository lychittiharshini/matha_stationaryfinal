import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { StationeryProduct, Category } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

interface StationeryPageProps {
  products: StationeryProduct[];
  categories: Category[];
  onBack: () => void;
}

export const StationeryPage: React.FC<StationeryPageProps> = ({
  products,
  categories,
  onBack,
}) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItem, setAddedItem] = useState<string | null>(null);

  // Subcategories for stationery (excluding homepage main category cards)
  const stationeryCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'stationery' && !c.isMainCategory && !c.id.startsWith('main_'));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedSubCat === 'all' || prod.categoryId === selectedSubCat;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch =
        prod.name.toLowerCase().includes(q) ||
        (prod.nameTelugu && prod.nameTelugu.toLowerCase().includes(q)) ||
        prod.description.toLowerCase().includes(q) ||
        (prod.categoryName && prod.categoryName.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedSubCat, searchQuery]);

  const handleQtyChange = (id: string, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[id] || 1;
      return { ...prev, [id]: Math.max(1, cur + delta) };
    });
  };

  const handleAdd = (prod: StationeryProduct) => {
    const qty = quantities[prod.id] || 1;
    addToCart(prod, qty, 'stationery');
    setAddedItem(prod.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top back navigation button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D8C7AA] text-xs font-bold text-[#1F3B2E] hover:bg-[#E8DCC6] transition-colors cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToCategories}</span>
        </button>
      </div>

      {/* Category Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D8C7AA] shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#1F3B2E] text-[#E8DCC6] flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-brand-title font-bold text-2xl sm:text-3xl text-[#1F3B2E]">
              {t.catStationeryTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#1F3B2E]/75 mt-0.5">
              {t.catStationeryDesc}
            </p>
          </div>
        </div>

        {/* Search & Subcategory filter toolbar */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3B2E]/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/50 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
            />
          </div>

          {/* Subcategories (Admin controlled) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedSubCat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedSubCat === 'all'
                  ? 'bg-[#1F3B2E] text-[#E8DCC6]'
                  : 'bg-[#F7F3EB] text-[#1F3B2E] hover:bg-[#E8DCC6] border border-[#D8C7AA]'
              }`}
            >
              {t.allCategories} ({products.length})
            </button>
            {stationeryCategories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedSubCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedSubCat === cat.id
                      ? 'bg-[#1F3B2E] text-[#E8DCC6]'
                      : 'bg-[#F7F3EB] text-[#1F3B2E] hover:bg-[#E8DCC6] border border-[#D8C7AA]'
                  }`}
                >
                  {language === 'te' && cat.nameTelugu ? cat.nameTelugu : cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#D8C7AA] p-8">
          <AlertCircle className="w-10 h-10 text-[#1F3B2E]/40 mx-auto mb-2" />
          <h3 className="font-bold text-[#1F3B2E] text-base">No products found</h3>
          <p className="text-xs text-[#1F3B2E]/70 mt-1">
            Try adjusting your search terms or selecting another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const qty = quantities[p.id] || 1;
            const isAdded = addedItem === p.id;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#D8C7AA] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 w-full bg-[#E8DCC6]/30 overflow-hidden relative">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.inStock ? 'bg-[#1F3B2E] text-[#E8DCC6]' : 'bg-rose-700 text-white'
                        }`}
                      >
                        {p.inStock ? t.inStock : t.outOfStock}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <span className="text-[10px] uppercase font-bold text-[#1F3B2E]/60 block">
                      {p.categoryName}
                    </span>
                    <h3 className="font-bold text-sm text-[#1F3B2E] mt-0.5 line-clamp-2">
                      {language === 'te' && p.nameTelugu ? p.nameTelugu : p.name}
                    </h3>
                    <p className="text-xs text-[#1F3B2E]/70 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-[#F7F3EB] mt-2">
                  <div className="flex items-center justify-between my-3">
                    <div>
                      <span className="text-[10px] text-[#1F3B2E]/60 uppercase block font-semibold">
                        {t.price}
                      </span>
                      {p.rateOnRequest || !p.price ? (
                        <span className="text-xs font-bold text-[#1F3B2E] bg-[#CBB3E8]/40 px-2 py-0.5 rounded">
                          {t.rateOnRequest}
                        </span>
                      ) : (
                        <span className="text-base font-extrabold text-[#1F3B2E]">₹{p.price}</span>
                      )}
                    </div>

                    {/* Quantity counter */}
                    {p.inStock && (
                      <div className="flex items-center border border-[#D8C7AA] rounded-lg bg-[#F7F3EB] p-0.5">
                        <button
                          onClick={() => handleQtyChange(p.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-[#1F3B2E] hover:bg-white rounded cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-[#1F3B2E]">
                          {qty}
                        </span>
                        <button
                          onClick={() => handleQtyChange(p.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#1F3B2E] hover:bg-white rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleAdd(p)}
                    disabled={!p.inStock}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !p.inStock
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : isAdded
                        ? 'bg-[#1F3B2E] text-white'
                        : 'bg-[#1F3B2E] text-[#E8DCC6] hover:bg-[#2C5241]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#CBB3E8]" />
                        <span>{t.addedToCart}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 text-[#CBB3E8]" />
                        <span>{t.addToCart}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
