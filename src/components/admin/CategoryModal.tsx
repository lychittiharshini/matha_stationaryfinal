import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Tag
} from 'lucide-react';
import { Category } from '../../types';
import { validateImageFile, uploadImageFile, deleteStorageFile } from '../../lib/storageHelper';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialData?: Category | null;
  defaultType?: 'stationery' | 'fancy' | 'sports';
  totalCategoriesCount: number;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultType = 'stationery',
  totalCategoriesCount,
}) => {
  const isEdit = Boolean(initialData?.id);

  const [name, setName] = useState('');
  const [nameTelugu, setNameTelugu] = useState('');
  const [type, setType] = useState<'stationery' | 'fancy' | 'sports'>(defaultType);
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number>(totalCategoriesCount + 1);

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
        setType((initialData.type as any) || defaultType);
        setDescription(initialData.description || '');
        setOrder(initialData.order || totalCategoriesCount + 1);
        setCurrentImageUrl(initialData.imageUrl || '');
        setCurrentStoragePath(initialData.storagePath || '');
      } else {
        setName('');
        setNameTelugu('');
        setType(defaultType);
        setDescription('');
        setOrder(totalCategoriesCount + 1);
        setCurrentImageUrl('');
        setCurrentStoragePath('');
      }
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [isOpen, initialData, defaultType, totalCategoriesCount]);

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
      setErrorMsg('Category name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = currentImageUrl;
      let finalStoragePath = currentStoragePath;

      if (selectedFile) {
        const uploadResult = await uploadImageFile(selectedFile, 'category_images');
        finalImageUrl = uploadResult.downloadUrl;
        if (currentStoragePath && currentStoragePath !== uploadResult.storagePath) {
          await deleteStorageFile(currentStoragePath);
        }
        finalStoragePath = uploadResult.storagePath;
      } else if (!currentImageUrl && currentStoragePath) {
        await deleteStorageFile(currentStoragePath);
        finalStoragePath = '';
      }

      const catId = initialData?.id || `cat_${Date.now()}`;
      const payload: Category = {
        id: catId,
        name: name.trim(),
        nameTelugu: nameTelugu.trim() || undefined,
        type: type,
        order: Number(order) || 1,
        description: description.trim() || undefined,
        imageUrl: finalImageUrl || undefined,
        storagePath: finalStoragePath || undefined,
        isMainCategory: false,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'categories', catId), payload, { merge: true });

      onSuccess(
        isEdit
          ? `✓ Category "${name}" updated successfully!`
          : `✓ New Category "${name}" created under ${type.toUpperCase()}!`
      );
      onClose();
    } catch (err: any) {
      console.error('Save category error:', err);
      setErrorMsg(`Failed to save category: ${err.message || 'Unknown database error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#F7F3EB] rounded-3xl shadow-2xl border-2 border-[#1F3B2E] overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#1F3B2E] text-[#E8DCC6] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CBB3E8] text-[#1F3B2E] flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-brand-title font-bold text-base sm:text-lg text-white">
                {isEdit ? 'Edit Category' : 'Create New Category'}
              </h3>
              <span className="text-[10px] text-[#CBB3E8] uppercase tracking-wider block font-semibold">
                Unlimited Categories & Subcategories
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
                Category Name (English) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Notebooks, Pens, Art Craft"
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
                placeholder="e.g. నోట్‌బుక్‌లు"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              />
            </div>
          </div>

          {/* Section Type and Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
                Belongs to Main Section <span className="text-rose-600">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
              >
                <option value="stationery">01. Stationery Items</option>
                <option value="fancy">02. Kids' Fancy Stationery</option>
                <option value="sports">04. Sports Items</option>
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

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#1F3B2E] mb-1">
              Category Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of items included under this category."
              className="w-full p-3 rounded-xl bg-white border border-[#D8C7AA] text-xs text-[#1F3B2E] placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E]"
            />
          </div>

          {/* Optional Category Image */}
          <div className="bg-white p-4 rounded-2xl border border-[#D8C7AA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F3B2E]">Category Icon / Banner (Optional)</label>
              <span className="text-[11px] text-[#1F3B2E]/60">JPG, PNG, WEBP (Max 5MB)</span>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#D8C7AA] overflow-hidden bg-[#F7F3EB] flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : currentImageUrl ? (
                  <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-[#1F3B2E]/30" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#CBB3E8]" />
                    <span>Upload Image from Computer</span>
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
                    ? 'Active category image saved in Firebase.'
                    : 'Optional banner for this category.'}
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
                  <span>Saving Category...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#CBB3E8]" />
                  <span>{isEdit ? 'Save Changes' : 'Create Category'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
