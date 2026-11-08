import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  const isValidType =
    ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) ||
    ALLOWED_IMAGE_EXTS.includes(ext);

  if (!isValidType) {
    return {
      valid: false,
      error: `Invalid file format for "${file.name}". Only JPG, JPEG, PNG, and WEBP images are supported.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 5MB limit. Please select a smaller image.`,
    };
  }

  return { valid: true };
}

export async function uploadImageFile(
  file: File,
  folder: string = 'product_images'
): Promise<{ downloadUrl: string; storagePath: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const storagePath = `${folder}/${cleanName}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  return { downloadUrl, storagePath: snapshot.ref.fullPath };
}

export async function deleteStorageFile(storagePath?: string): Promise<void> {
  if (!storagePath || storagePath.trim() === '') return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Storage file deletion notice:', err);
  }
}
