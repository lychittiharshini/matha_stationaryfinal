import React from 'react';
import { Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-[#1F3B2E] text-[#E8DCC6] pt-6 pb-4 px-4 sm:px-6 border-t-2 border-[#CBB3E8]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Left: Shop Name & Subtitle */}
        <div className="text-center sm:text-left">
          <div className="font-brand-title font-bold text-sm text-white tracking-tight">
            {language === 'te' ? 'శ్రీ దుర్గా మాత స్టేషనరీ' : 'SREE DURGA MATA STATIONERY'}
          </div>
          <div className="text-[11px] text-[#E8DCC6]/75">
            {language === 'te' ? 'బుక్ స్టాల్ & ఫ్యాన్సీ ఐటమ్స్' : 'Book Stall & Fancy Items'}
          </div>
        </div>

        {/* Center: Copyright */}
        <div className="text-center text-[11px] text-[#E8DCC6]/60">
          © {new Date().getFullYear()} SREE DURGA MATA. {t.footerRights}
        </div>
      </div>

      {/* Very bottom: Tiny, discreet Admin Login link */}
      <div className="max-w-6xl mx-auto mt-4 pt-3 border-t border-[#2C5241] flex justify-center sm:justify-end">
        <a
          href="#/admin-login"
          onClick={(e) => {
            e.preventDefault();
            onOpenAdmin();
          }}
          className="text-[#E8DCC6]/30 hover:text-[#CBB3E8] text-[10px] tracking-widest uppercase transition-colors inline-flex items-center gap-1 cursor-pointer select-none"
          title="Store Administration"
        >
          <Lock className="w-2.5 h-2.5 opacity-40" />
          <span>Admin Login</span>
        </a>
      </div>
    </footer>
  );
};

