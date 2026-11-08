import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Printer,
  Plus
} from 'lucide-react';
import { ServiceItem } from '../../types';
import { validateImageFile, uploadImageFile, deleteStorageFile } from '../../lib/storageHelper';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialData?: ServiceItem | null;
  totalServicesCount: number;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  totalServicesCount,
}) => {
  const isEdit = Boolean(initialData?.id);

  const [name, setName] = useState('');
  const [nameTelugu, setNameTelugu] = useState('');
  const [category, setCategory] = useState<'xerox' | 'printing' | 'lamination' | 'other'>('xerox');
  const [description, setDescription] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'request'>('fixed');
  const [priceStartingFrom, setPriceStartingFrom] = useState<string>('2');
  const [rateUnit, setRateUnit] = useState('/ page');
  const [available, setAvailable] = useState(true);
  const [order, setOrder] = useState<number>(totalServicesCount + 1);

  // Dynamic Options list
  const [options, setOptions] = useState<{ label: string; price?: number }[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');

  // Image states
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentStoragePath, setCurrentStoragePath] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialData) {
        setName(initialData.name || '');
        setNameTelugu(initialData.nameTelugu || '');
        setCategory(initialData.category || 'xerox');
        setDescription(initialData.description || '');
        setPriceType(initialData.rateOnRequest || !initialData.priceStartingFrom ? 'request' : 'fixed');
        setPriceStartingFrom(
          initialData.priceStartingFrom !== undefined ? initialData.priceStartingFrom.toString() : '2'
        );
        setRateUnit(initialData.rateUnit || '/ page');
        setAvailable(initialData.available !== false);
        setOrder(initialData.order || totalServicesCount + 1);
        setOptions(initialData.options ? [...initialData.options] : []);
        setCurrentImageUrl(initialData.imageUrl || '');
        setCurrentStoragePath(initialData.storagePath || '');
      } else {
        setName('');
        setNameTelugu('');
        setCategory('xerox');
        setDescription('');
        setPriceType('fixed');
        setPriceStartingFrom('2');
        setRateUnit('/ page');
        setAvailable(true);
        setOrder(totalServicesCount + 1);
        setOptions([
          { label: 'Single Side', price: 2 },
          { label: 'Double Side', price: 3 },
        ]);
        setCurrentImageUrl('');
        setCurrentStoragePath('');
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewOptionLabel('');
      setNewOptionPrice('');
    }
  }, [isOpen, initialData, totalServicesCount]);

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

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    const optPrice = newOptionPrice ? parseFloat(newOptionPrice) : undefined;
    setOptions((prev) => [...prev, { label: newOptionLabel.trim(), price: optPrice }]);
    setNewOptionLabel('');
    setNewOptionPrice('');
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Service name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = currentImageUrl;
      let finalStoragePath = currentStoragePath;

      if (selectedFile) {
        const uploadResult = await uploadImageFile(selectedFile, 'service_images');
        finalImageUrl = uploadResult.downloadUrl;
        if (currentStoragePath && currentStoragePath !== uploadResult.storagePath) {
          await deleteStorageFile(currentStoragePath);
        }
        finalStoragePath = uploadResult.storagePath;
      } else if (!currentImageUrl && currentStoragePath) {
        await deleteStorageFile(currentStoragePath);
        finalStoragePath = '';
      }

      const numPrice = priceType === 'fixed' && priceStartingFrom ? parseFloat(priceStartingFrom) : undefined;
      const isRateOnReq = priceType === 'request' || numPrice === undefined || isNaN(numPrice);

      const srvId = initialData?.id || `srv_${Date.now()}`;
      const payload: ServiceItem = {
        id: srvId,
        name: name.trim(),
        nameTelugu: nameTelugu.trim() || undefined,
        category: category,
        description: description.trim() || `${name.trim()} available at shop counter.`,
        priceStartingFrom: !isRateOnReq && numPrice !== undefined ? numPrice : 0,
        rateUnit: rateUnit.trim() || '/ page',
        rateOnRequest: isRateOnReq,
        available: available,
        options: options.length > 0 ? options : undefined,
        imageUrl: finalImageUrl || undefined,
        storagePath: finalStoragePath || undefined,
        order: Number(order) || 1,
      };

      await setDoc(doc(db, 'services', srvId), payload, { merge: true });

      onSuccess(
        isEdit
          ? `✓ Service "${name}" updated successfully!`
          : `✓ Service "${name}" created successfully!`
      );
      onClose();
    } catch (err: any) {
      console.error('Save service error:', err);
      setErrorMsg(`Failed to save service: ${err.message || 'Unknown database error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#F7F3EB] rounded-3xl shadow-2xl border-2 border-[#1F3B2E] overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#1F3B2E] text-[#E8DCC6] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CBB3E8] text-[#1F3B2E] flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-brand-title font-bold text-base sm:text-lg text-white">
                {isEdit ? 'Edit Xerox & Printing Service' : 'Add New Service Rate'}
              </h3>
              <span className="text-[10px] text-[#CBB3E8] uppercase tracking-wider block font-semibold">
                Instant Xerox, Printing, and Lamination Management
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                Service Name (English) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Black & White Xerox (A4)"
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
                placeholder="e.g. జిరాక్స్ (బ్లాక్ అండ్ వైట్)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              />
            </div>
          </div>

          {/* Category & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                Service Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              >
                <option value="xerox">Xerox (Black & White)</option>
                <option value="printing">Colour Printing</option>
                <option value="lamination">Lamination</option>
                <option value="other">Other Shop Service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                Display Order Priority
              </label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] font-bold focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              />
            </div>
          </div>

          {/* Pricing & Rate Unit */}
          <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F3B2E]">Base Rate Structure</label>
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
                  Starting Price (₹)
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

            {priceType === 'fixed' && (
              <div className="pt-2 border-t border-[#F7F3EB] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F3B2E] mb-1">Starting From (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required={priceType === 'fixed'}
                    value={priceStartingFrom}
                    onChange={(e) => setPriceStartingFrom(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-bold text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1F3B2E] mb-1">Rate Unit</label>
                  <input
                    type="text"
                    value={rateUnit}
                    onChange={(e) => setRateUnit(e.target.value)}
                    placeholder="e.g. / page, / copy, / sheet"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-bold text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
                  />
                </div>
              </div>
            )}

            {/* Service Availability */}
            <div className="pt-3 border-t border-[#F7F3EB] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1F3B2E] block">Counter Availability</span>
                <span className="text-[11px] text-[#1F3B2E]/60">
                  Is machine operational for customer service requests?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAvailable(!available)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  available
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {available ? '✓ Ready / Available' : '✗ Temporarily Unavailable'}
              </button>
            </div>
          </div>

          {/* Dynamic Service Options Editor */}
          <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-[#1F3B2E] block">
                  Service Sub-Options & Specifications ({options.length})
                </label>
                <span className="text-[11px] text-[#1F3B2E]/60">
                  Add unlimited options (e.g. Single Side, Double Side, Glossy Paper)
                </span>
              </div>
            </div>

            {/* Options List */}
            {options.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#F7F3EB] text-xs"
                  >
                    <span className="font-semibold text-[#1F3B2E]">• {opt.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#1F3B2E]">
                        {opt.price !== undefined ? `₹${opt.price}` : 'Rate on Req.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                        title="Delete option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Option Input Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#F7F3EB]">
              <input
                type="text"
                placeholder="Option name (e.g. Double Side)"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              />
              <input
                type="number"
                step="0.5"
                placeholder="₹ Price"
                value={newOptionPrice}
                onChange={(e) => setNewOptionPrice(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-xs font-bold text-[#1F3B2E] focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              />
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3 py-1.5 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
              Description & Customer Information
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. High-speed laser photocopy, crisp black & white text reproduction on 75 GSM paper."
              className="w-full p-3 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
            />
          </div>

          {/* Image Upload */}
          <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F3B2E]">Service Image / Photo (Optional)</label>
              <span className="text-[11px] text-[#1F3B2E]/60">JPG, PNG, WEBP (Max 5MB)</span>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#D8C7AA] overflow-hidden bg-[#F7F3EB] flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : currentImageUrl ? (
                  <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <Printer className="w-7 h-7 text-[#1F3B2E]/30" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#CBB3E8]" />
                    <span>Upload Machine / Sample Photo</span>
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

                <p className="text-[11px] text-[#1F3B2E]/70">
                  {selectedFile
                    ? `Selected: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`
                    : currentImageUrl
                    ? 'Active photo saved in Firebase.'
                    : 'Optional photo for Xerox or Lamination.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
                  <span>Saving Service...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#CBB3E8]" />
                  <span>{isEdit ? 'Save Changes' : 'Create Service Rate'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
