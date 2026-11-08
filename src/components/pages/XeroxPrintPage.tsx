import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Copy,
  Layers,
  Plus,
  CheckCircle,
  FileText
} from 'lucide-react';
import { ServiceItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

interface XeroxPrintPageProps {
  services: ServiceItem[];
  onBack: () => void;
}

export const XeroxPrintPage: React.FC<XeroxPrintPageProps> = ({
  services,
  onBack,
}) => {
  const { language, t } = useLanguage();
  const { addServiceToCart } = useCart();

  const [printType, setPrintType] = useState<'bw' | 'colour'>('bw');
  const [printSides, setPrintSides] = useState<'single' | 'double'>('single');
  const [pageCount, setPageCount] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [laminationAdded, setLaminationAdded] = useState(false);

  const unitRate =
    printType === 'bw'
      ? printSides === 'single'
        ? 2
        : 3
      : printSides === 'single'
      ? 10
      : 18;

  const estimatedTotal = pageCount * unitRate;

  const handleAddXerox = () => {
    const typeLabel = printType === 'bw' ? 'Black & White Xerox' : 'Colour Printing';
    const sideLabel = printSides === 'single' ? 'Single-Side' : 'Double-Side';
    const srvId =
      printType === 'bw'
        ? printSides === 'single'
          ? 'srv-xerox-bw-single'
          : 'srv-xerox-bw-double'
        : printSides === 'single'
        ? 'srv-print-color-single'
        : 'srv-print-color-double';

    const matched = services.find((s) => s.id === srvId) || {
      id: srvId,
      name: `${typeLabel} (${sideLabel})`,
      category: printType === 'bw' ? 'xerox' : 'printing',
      description: `${typeLabel} on bright 75 GSM paper`,
      priceStartingFrom: unitRate,
      rateUnit: 'per page',
      rateOnRequest: false,
      available: true,
      order: 1,
    };

    const notesSummary = `${pageCount} pages • ${sideLabel}${notes ? ` • Note: ${notes}` : ''}`;
    addServiceToCart(matched, pageCount, notesSummary, unitRate);

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const laminationService = services.find((s) => s.category === 'lamination');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-brand-title font-bold text-2xl sm:text-3xl text-[#1F3B2E]">
              {t.catXeroxTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#1F3B2E]/75 mt-0.5">
              {t.catXeroxDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Xerox and Print Options Configurator */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D8C7AA] shadow-sm space-y-6">
        <h2 className="font-brand-title font-bold text-lg text-[#1F3B2E] border-b border-[#F7F3EB] pb-3">
          Photocopy & Printing Selector
        </h2>

        {/* Step 1: Type */}
        <div>
          <label className="block text-xs font-bold uppercase text-[#1F3B2E] mb-2">
            1. Select Print Mode:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPrintType('bw')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                printType === 'bw'
                  ? 'bg-[#1F3B2E] text-[#E8DCC6] border-[#1F3B2E] shadow-sm'
                  : 'bg-[#F7F3EB] text-[#1F3B2E] border-[#D8C7AA] hover:bg-[#E8DCC6]'
              }`}
            >
              <div className="font-bold text-sm">Black & White Xerox</div>
              <div className="text-xs opacity-75 mt-0.5">₹2 Single / ₹3 Double</div>
            </button>

            <button
              type="button"
              onClick={() => setPrintType('colour')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                printType === 'colour'
                  ? 'bg-[#1F3B2E] text-[#E8DCC6] border-[#1F3B2E] shadow-sm'
                  : 'bg-[#F7F3EB] text-[#1F3B2E] border-[#D8C7AA] hover:bg-[#E8DCC6]'
              }`}
            >
              <div className="font-bold text-sm">Colour Printing</div>
              <div className="text-xs opacity-75 mt-0.5">₹10 Single / ₹18 Double</div>
            </button>
          </div>
        </div>

        {/* Step 2: Sides */}
        <div>
          <label className="block text-xs font-bold uppercase text-[#1F3B2E] mb-2">
            2. Select Sides:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPrintSides('single')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                printSides === 'single'
                  ? 'bg-[#CBB3E8] text-[#1F3B2E] font-bold border-[#A987D4]'
                  : 'bg-[#F7F3EB] text-[#1F3B2E] border-[#D8C7AA] hover:bg-[#E8DCC6]'
              }`}
            >
              <span className="block text-sm">Single-Side (ఒక వైపు)</span>
              <span className="text-[11px] opacity-75">
                Rate: ₹{printType === 'bw' ? '2' : '10'} / page
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPrintSides('double')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                printSides === 'double'
                  ? 'bg-[#CBB3E8] text-[#1F3B2E] font-bold border-[#A987D4]'
                  : 'bg-[#F7F3EB] text-[#1F3B2E] border-[#D8C7AA] hover:bg-[#E8DCC6]'
              }`}
            >
              <span className="block text-sm">Double-Side (రెండు వైపులా)</span>
              <span className="text-[11px] opacity-75">
                Rate: ₹{printType === 'bw' ? '3' : '18'} / sheet
              </span>
            </button>
          </div>
        </div>

        {/* Step 3: Page count & notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#1F3B2E] mb-1.5">
              3. Number of Pages / Copies:
            </label>
            <input
              type="number"
              min="1"
              max="2000"
              value={pageCount}
              onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-sm text-[#1F3B2E] font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#1F3B2E] mb-1.5">
              Document Note (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Hall ticket, Project notes, College material"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-[#E8DCC6] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#1F3B2E]/70 block">Estimated Price:</span>
            <div className="text-2xl font-black text-[#1F3B2E]">
              ₹{estimatedTotal}
              <span className="text-xs font-normal text-[#1F3B2E]/70 ml-1.5">
                ({pageCount} pages × ₹{unitRate})
              </span>
            </div>
          </div>

          <button
            onClick={handleAddXerox}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              addedSuccess
                ? 'bg-[#1F3B2E] text-white'
                : 'bg-[#1F3B2E] text-[#E8DCC6] hover:bg-[#2C5241]'
            }`}
          >
            {addedSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#CBB3E8]" />
                <span>Added to Request!</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-[#CBB3E8]" />
                <span>Add Xerox to Order Request</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lamination Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D8C7AA] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-[#1F3B2E]" />
            <h3 className="font-bold text-base text-[#1F3B2E]">Hot Thermal Lamination</h3>
          </div>
          <p className="text-xs text-[#1F3B2E]/75 max-w-lg leading-relaxed">
            Crystal clear glossy water-proof protection for school mark sheets, graduation certificates, Aadhar & Voter ID cards.
          </p>
          <span className="text-xs font-bold text-[#1F3B2E] block mt-1">Rate: ₹20 / sheet (A4)</span>
        </div>

        <button
          onClick={() => {
            const srv = laminationService || {
              id: 'srv-lamination',
              name: 'Thermal Lamination (A4)',
              category: 'lamination',
              description: 'Lamination sheet',
              priceStartingFrom: 20,
              rateUnit: 'per document',
              rateOnRequest: false,
              available: true,
              order: 5,
            };
            addServiceToCart(srv, 1, 'Standard A4 Lamination', 20);
            setLaminationAdded(true);
            setTimeout(() => setLaminationAdded(false), 1500);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#E8DCC6] hover:bg-[#D8C7AA] text-[#1F3B2E] font-bold text-xs cursor-pointer shrink-0 transition-colors flex items-center gap-1.5"
        >
          {laminationAdded ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{laminationAdded ? 'Added!' : 'Add Lamination (₹20)'}</span>
        </button>
      </div>
    </div>
  );
};
