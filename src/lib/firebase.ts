import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  initialCategories,
  initialStationeryProducts,
  initialFancyProducts,
  initialSportsProducts,
  initialServices,
  initialOffers,
  initialSocialMedia,
  initialGallery,
  initialShopSettings
} from './seedData';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication & Storage
export const auth = getAuth(app);
export const storage = getStorage(app);

// Skill Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test Connection on Boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'shop_settings', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running in offline / fallback mode.');
    }
    return false;
  }
}

// Seed Database if empty
let isSeeding = false;
export async function initializeDatabaseIfEmpty() {
  if (isSeeding) return;
  isSeeding = true;
  try {
    // Check shop settings
    const settingsRef = doc(db, 'shop_settings', 'main');
    const existingSettings = await getDocs(collection(db, 'shop_settings')).catch(() => null);
    
    if (!existingSettings || existingSettings.empty) {
      console.log('Seeding initial data to Firestore...');
      // 1. Settings
      await setDoc(settingsRef, initialShopSettings);

      // 2. Categories
      for (const cat of initialCategories) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }

      // 3. Stationery Products
      for (const prod of initialStationeryProducts) {
        await setDoc(doc(db, 'stationery_products', prod.id), prod);
      }

      // 4. Fancy Products
      for (const fancy of initialFancyProducts) {
        await setDoc(doc(db, 'fancy_products', fancy.id), fancy);
      }

      // 4b. Sports Products
      for (const sport of initialSportsProducts) {
        await setDoc(doc(db, 'sports_products', sport.id), sport);
      }

      // 5. Services
      for (const srv of initialServices) {
        await setDoc(doc(db, 'services', srv.id), srv);
      }

      // 6. Offers
      for (const off of initialOffers) {
        await setDoc(doc(db, 'offers', off.id), off);
      }

      // 7. Social Media
      for (const soc of initialSocialMedia) {
        await setDoc(doc(db, 'social_media', soc.id), soc);
      }

      // 8. Gallery
      for (const gal of initialGallery) {
        await setDoc(doc(db, 'gallery', gal.id), gal);
      }

      // 9. Bootstrap default admin email record
      await setDoc(doc(db, 'admins', 'owner_admin'), {
        id: 'owner_admin',
        email: 'lychittiharshini2008@gmail.com',
        role: 'SuperAdmin',
        addedAt: new Date().toISOString()
      });

      console.log('Firestore seed completed successfully!');
    }

    // Ensure the 4 homepage category cards exist in Firestore without overwriting existing images
    const mainCategoryKeys = ['main_stationery', 'main_fancy', 'main_xerox', 'main_sports'];
    for (const key of mainCategoryKeys) {
      const matchCat = initialCategories.find((c) => c.id === key);
      if (matchCat) {
        setDoc(doc(db, 'categories', key), matchCat, { merge: true }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Note on Firestore init/seed: will use client memory fallback if security restricts unauthenticated seed writes.', err);
  } finally {
    isSeeding = false;
  }
}

// Trigger initial connection test
testFirestoreConnection().catch(() => {});
