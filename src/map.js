import mapboxgl from 'mapbox-gl';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase config (REEMPLAZAR con tu config)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export function initializeMap() {
  const map = new mapboxgl.Map({
    container: 'app',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-58.8344, -27.4748],
    zoom: 13,
  });

  // Acá iría tu lógica para manejar el polígono, guardar en Firebase, etc.
}
