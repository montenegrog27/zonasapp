import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const zonesCollection = collection(db, "zones");

export const saveZone = async (zona) => {
  const zonaGuardada = {
    ...zona,
    geometry: JSON.stringify(zona.geometry), // Aseguramos que sea string
  };

  await addDoc(collection(db, "zones"), zonaGuardada);
};

export const getZones = async () => {
  const snapshot = await getDocs(zonesCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateZone = async (id, data) => {
  const zoneRef = doc(db, "zones", id);
  const zonaActualizada = {
    ...data,
    geometry: JSON.stringify(data.geometry),
  };
  return await updateDoc(zoneRef, zonaActualizada);
};

export const deleteZone = async (id) => {
  const zoneRef = doc(db, "zones", id);
  return await deleteDoc(zoneRef);
};

export const getDeliveryConfig = async () => {
  const docRef = doc(db, "settings", "delivery");
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export { db }; // ✅ exportalo
