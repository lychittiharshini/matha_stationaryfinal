import React from 'react';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome }) => {
  const { language, setLanguage, t } = useLanguage();
  const { totalItemCount, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-[#E8DCC6] border-b border-[#D8C7AA] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left side: Brand Name, Subtitle, Location */}
        <div
          onClick={onGoHome}
          className="cursor-pointer group flex items-baseline gap-2.5 flex-wrap"
        >
          <div className="flex flex-col">
            <span className="font-brand-title font-extrabold text-base sm:text-lg tracking-tight text-[#1F3B2E] leading-tight">
              {language === 'te' ? 'శ్రీ దుర్గా మాత' : 'SREE DURGA MATA'}
            </span>
            <span className="text-[11px] font-semibold text-[#1F3B2E]/75 tracking-normal">
              {language === 'te' ? 'బుక్ స్టాల్ & ఫ్యాన్సీ ఐటమ్స్' : 'Book Stall & Fancy Items'}
            </span>
          </div>

          <span className="text-xs font-semibold text-[#1F3B2E]/70 bg-[#F7F3EB]/80 px-2 py-0.5 rounded-full border border-[#D8C7AA]">
            {t.location}
          </span>
        </div>

        {/* Right side: Language Switch & WhatsApp */}
        <div className="flex items-center gap-2.5">
          {/* Subtle cart indicator if customer added items */}
          {totalItemCount > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#CBB3E8] text-[#1F3B2E] rounded-lg text-xs font-bold shadow-sm hover:bg-[#bfa2e2] cursor-pointer"
              title="View Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{totalItemCount}</span>
            </button>
          )}

          {/* Language Switch: English / తెలుగు */}
          <div className="flex items-center bg-[#F7F3EB] p-0.5 rounded-lg border border-[#D8C7AA]">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-[#1F3B2E] text-[#E8DCC6]'
                  : 'text-[#1F3B2E] hover:bg-[#E8DCC6]'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('te')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                language === 'te'
                  ? 'bg-[#1F3B2E] text-[#E8DCC6]'
                  : 'text-[#1F3B2E] hover:bg-[#E8DCC6]'
              }`}
            >
              తెలుగు
            </button>
          </div>

          {/* WhatsApp Button */}
          <a
            href="https://wa.me/919849012345?text=Hello%20SREE%20DURGA%20MATA,%20I%20have%20an%20enquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3B2E] text-[#E8DCC6] hover:bg-[#2C5241] text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#CBB3E8]" />
            <span>{t.whatsappUs}</span>
          </a>
        </div>
      </div>
    </header>
  );
};
