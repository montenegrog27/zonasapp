import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { saveZone, getZones, updateZone, deleteZone } from "./firebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore"; // ya tenés `db` definido
import { db } from "./firebase.js";
import { getDeliveryConfig } from "./firebase.js";

const costoBaseInput = document.getElementById("base-cost");
const precioKmInput = document.getElementById("price-km");

// Mostrar config actual
async function cargarConfiguracion() {
  const config = await getDeliveryConfig();
  console.log("🔧 Configuración desde Firebase:", config);
  if (config) {
    costoBaseInput.value = config.baseDeliveryCost || 0;
    precioKmInput.value = config.pricePerKm || 0;

    const statusEl = document.getElementById("config-status");
  }
}

cargarConfiguracion();

document
  .getElementById("guardar-config")
  .addEventListener("click", async () => {
    const base = parseInt(document.getElementById("base-cost").value);
    const porKm = parseInt(document.getElementById("price-km").value);

    try {
      await setDoc(doc(db, "settings", "delivery"), {
        baseDeliveryCost: base,
        pricePerKm: porKm,
        enabled: true,
      });
      alert("✅ Configuración guardada");
    } catch (err) {
      console.error(err);
      alert("❌ Error al guardar");
    }
  });

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-58.8344, -27.4748],
  zoom: 13,
});

const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    polygon: true,
    trash: true,
  },
});
map.addControl(draw);

const nameInput = document.getElementById("zona-name");
const cocinaSelect = document.getElementById("zona-cocina");
const gratisCheck = document.getElementById("zona-gratis");
const guardarBtn = document.getElementById("guardar-zona");
const listaZonas = document.getElementById("zonas-lista");

let editandoId = null;

const cargarZonas = async () => {
  const zonas = await getZones();
  listaZonas.innerHTML = "";

  zonas.forEach((zona) => {
    const li = document.createElement("li");
    li.className =
      "border-b py-2 flex justify-between items-center hover:bg-gray-100 px-2 transition";
    li.setAttribute("data-id", zona.id);

    li.innerHTML = `
      <div>
        <strong>${zona.name}</strong>
        <p class="text-sm text-gray-600">${
          zona.freeShipping ? "🆓 Envío gratis" : "💸 Con costo"
        }</p>
      </div>
      <div class="flex gap-2">
        <button data-id="${
          zona.id
        }" class="editar text-blue-600 text-sm">Editar</button>
        <button data-id="${
          zona.id
        }" class="borrar text-red-600 text-sm">Eliminar</button>
      </div>
    `;

    li.querySelector(".editar").addEventListener("click", () => {
      editandoId = zona.id;
      nameInput.value = zona.name;
      cocinaSelect.value = zona.cocinaId;
      gratisCheck.checked = zona.freeShipping;

      draw.deleteAll(); // eliminamos todo lo anterior
      const feature = {
        id: zona.id,
        type: "Feature",
        geometry: JSON.parse(zona.geometry),
      };
      draw.add(feature);
      draw.changeMode("direct_select", { featureId: zona.id });
    });

    li.querySelector(".borrar").addEventListener("click", async () => {
      const confirmar = confirm(`¿Eliminar zona "${zona.name}"?`);
      if (confirmar) {
        await deleteZone(zona.id);
        draw.delete(zona.id);
        cargarZonas();
      }
    });

    li.addEventListener("mouseenter", () => {
      const geometry = JSON.parse(zona.geometry);
      const coordinates = geometry.coordinates[0];
      const center = coordinates
        .reduce((acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], [0, 0])
        .map((val) => val / coordinates.length);
      map.flyTo({ center, zoom: 14 });
      draw.changeMode("simple_select", { featureIds: [zona.id] });
    });

    listaZonas.appendChild(li);
  });
};

guardarBtn.addEventListener("click", async () => {
  const drawn = draw.getAll();
  if (!drawn.features.length) {
    alert("Dibujá una zona antes de guardar.");
    return;
  }

  const zona = {
    name: nameInput.value,
    cocinaId: cocinaSelect.value,
    freeShipping: gratisCheck.checked,
    geometry: drawn.features[0].geometry,
  };

  if (!zona.name) {
    alert("Completá el nombre de la zona.");
    return;
  }

  try {
    if (editandoId) {
      await updateZone(editandoId, zona);
    } else {
      await saveZone(zona);
    }

    draw.deleteAll();
    draw.changeMode("simple_select");
    nameInput.value = "";
    gratisCheck.checked = false;
    editandoId = null;
    await cargarZonas();
    alert("✅ Zona guardada con éxito");
  } catch (err) {
    console.error(err);
    alert("❌ Error al guardar zona");
  }
});

map.on("load", async () => {
  const zonas = await getZones();
  zonas.forEach((zona) => {
    try {
      const geometry = JSON.parse(zona.geometry);
      const feature = {
        id: zona.id,
        type: "Feature",
        properties: { name: zona.name },
        geometry,
      };
      draw.add(feature);
    } catch (err) {
      console.error("❌ Error al mostrar zona:", err);
    }
  });
});

map.on("click", (e) => {
  const features = draw.getSelected(); // esto evita errores de capas inexistentes
  if (features.features.length) return;

  const all = draw.getAll();
  for (const feature of all.features) {
    const polygon = feature.geometry;
    const pt = [e.lngLat.lng, e.lngLat.lat];

    if (
      polygon &&
      polygon.type === "Polygon" &&
      turf.booleanPointInPolygon(pt, polygon)
    ) {
      const li = document.querySelector(`[data-id="${feature.id}"]`);
      if (li) {
        li.scrollIntoView({ behavior: "smooth", block: "center" });
        li.classList.add("bg-yellow-100");
        setTimeout(() => li.classList.remove("bg-yellow-100"), 1500);
      }
      break;
    }
  }
});

cargarZonas();
