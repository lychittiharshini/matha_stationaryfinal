import React from 'react';
import { BookOpen, Sparkles, Printer, Trophy, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Category } from '../types';

export type MainCategoryKey = 'stationery' | 'fancy' | 'xerox' | 'sports';

interface CategoryCardsGridProps {
  onSelectCategory: (key: MainCategoryKey) => void;
  stationeryCount: number;
  fancyCount: number;
  sportsCount: number;
  categories?: Category[];
}

export const CategoryCardsGrid: React.FC<CategoryCardsGridProps> = ({
  onSelectCategory,
  stationeryCount,
  fancyCount,
  sportsCount,
  categories = [],
}) => {
  const { language, t } = useLanguage();

  const cards = [
    {
      key: 'stationery' as MainCategoryKey,
      number: '01',
      title: t.catStationeryTitle,
      description: t.catStationeryDesc,
      icon: BookOpen,
      countText: `${stationeryCount} items`,
      bgAccent: 'bg-[#1F3B2E] text-[#E8DCC6]',
      cardBorder: 'border-[#1F3B2E]/20 hover:border-[#1F3B2E]',
    },
    {
      key: 'fancy' as MainCategoryKey,
      number: '02',
      title: t.catFancyTitle,
      description: t.catFancyDesc,
      icon: Sparkles,
      countText: `${fancyCount} items`,
      bgAccent: 'bg-[#CBB3E8] text-[#1F3B2E]',
      cardBorder: 'border-[#CBB3E8] hover:border-[#A987D4]',
    },
    {
      key: 'xerox' as MainCategoryKey,
      number: '03',
      title: t.catXeroxTitle,
      description: t.catXeroxDesc,
      icon: Printer,
      countText: 'Instant service',
      bgAccent: 'bg-[#1F3B2E] text-[#E8DCC6]',
      cardBorder: 'border-[#1F3B2E]/20 hover:border-[#1F3B2E]',
    },
    {
      key: 'sports' as MainCategoryKey,
      number: '04',
      title: t.catSportsTitle,
      description: t.catSportsDesc,
      icon: Trophy,
      countText: `${sportsCount} items`,
      bgAccent: 'bg-[#E8DCC6] text-[#1F3B2E]',
      cardBorder: 'border-[#D8C7AA] hover:border-[#1F3B2E]',
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 2x2 Clean Grid on Desktop, Responsive on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {cards.map((card) => {
          const Icon = card.icon;
          // Find matching uploaded image document from Firestore categories
          const categoryDoc = categories.find(
            (c) => c.id === `main_${card.key}` || (c.type === card.key && c.isMainCategory)
          );
          const uploadedImage = categoryDoc?.imageUrl && categoryDoc.imageUrl.trim() !== '' ? categoryDoc.imageUrl : null;

          return (
            <div
              key={card.key}
              onClick={() => onSelectCategory(card.key)}
              className={`bg-white rounded-3xl p-6 sm:p-8 border-2 ${card.cardBorder} shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
            >
              {/* Corner watermark number */}
              <div className="absolute top-4 right-5 text-4xl sm:text-5xl font-black text-[#E8DCC6]/60 select-none font-brand-title pointer-events-none z-10">
                {card.number}
              </div>

              <div>
                {/* Uploaded Image or Fallback Icon Badge */}
                {uploadedImage ? (
                  <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-5 bg-[#E8DCC6]/30 border border-[#D8C7AA]/60 group-hover:shadow-md transition-all">
                    <img
                      src={uploadedImage}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    {/* Floating accent icon badge over image */}
                    <div
                      className={`absolute top-3 left-3 w-10 h-10 rounded-xl ${card.bgAccent} shadow-md flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                ) : (
                  /* Fallback: Standard Category Icon Badge */
                  <div
                    className={`w-12 h-12 rounded-2xl ${card.bgAccent} flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                )}

                {/* Title */}
                <h2 className="font-brand-title font-bold text-xl sm:text-2xl text-[#1F3B2E] tracking-tight group-hover:text-[#2C5241] transition-colors">
                  {card.title}
                </h2>

                {/* Description */}
                <p className="mt-2.5 text-xs sm:text-sm text-[#1F3B2E]/75 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Bottom footer of card */}
              <div className="mt-6 pt-4 border-t border-[#F7F3EB] flex items-center justify-between text-xs font-bold text-[#1F3B2E]">
                <span className="text-[11px] font-semibold text-[#1F3B2E]/60 uppercase tracking-wider">
                  {card.countText}
                </span>

                <div className="flex items-center gap-1.5 text-[#1F3B2E] group-hover:translate-x-1 transition-transform">
                  <span>Browse Products</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
