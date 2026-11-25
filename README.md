# MushroomMap — PNW Foraging & Wildfire GIS

**English** | [简体中文](./README.zh-CN.md)

A **100% static client-side, zero-token, installable PWA** mushroom foraging and wildfire GIS map built for the Pacific Northwest (Washington & Oregon).

🌐 **Live Web App**: [https://dongfang-a.github.io/mushroom-map/](https://dongfang-a.github.io/mushroom-map/)

---

## Key Features

- **13 PNW Edible Mushroom Species — Live Habitat Suitability Engine**
  - Covers: **Winter Chanterelle / Yellowfoot** (*Craterellus tubaeformis*), **Hedgehog** (*Hydnum oregonense / umbilicatum*), **Black Trumpet** (*Craterellus calicornucopioides*), **Oyster** (*Pleurotus pulmonarius / ostreatus*), **Bear's Head Tooth** (*Hericium abietis*), **Pacific Golden & White Chanterelle** (*Cantharellus formosus / subalbidus*), **Western Matsutake** (*Tricholoma murrillianum*), **King Bolete / Porcini** (*Boletus edulis / rex-veris*), **Fib King** (*Boletus fibrillosus*), **Admirable Bolete** (*Aureoboletus mirabilis*), **Hawk's Wing / Shingled Hedgehog** (*Sarcodon imbricatus*), **Leccinum / Scaber Stalk** (*Leccinum spp.*), and **Burn Morel** (*Morchella spp.*).
  - Synthesizes elevation, slope, aspect, micro-topographic concavity (TPI), NLCD 30m tree canopy, NLCD 2021 land-cover water/urban masking, DEM hydro-flattened lake protection, and legal public land polygons directly in the browser via MapLibre custom tile protocols.
- **Bilingual UI (English / Chinese), Configurable Units & App Shortcut (⚙️ Settings)**
  - Automatically follows your OS/browser language (`Follow System`) or switches manually between **English** and **简体中文**.
  - Supports **Follow System / Imperial (US) / Metric (SI)** presets plus independent overrides for **Elevation (`ft` / `m`)**, **Temperature (`°F` / `°C`)**, **Precipitation (`in` / `mm`)**, **Distance & Map Scale (`mi` / `km`)**, and **Burn Area (`ac` / `ha`)**.
  - Built-in **Create Desktop / Home Screen Icon** control triggers the native PWA install prompt on Chrome/Edge or shows tailored iOS Safari / in-app browser steps.
- **Active Map & Overlays HUD Strip**
  - Always displays the active basemap and every enabled overlay with color dots and one-tap `×` dismissal so you immediately know what every colored layer on the map represents.
- **High-Contrast Controls & Legal Land AND Mask**
  - Opacity & global selectivity (`0%–100%`) sliders, `1Hz` opacity blink toggle, high-contrast radar palette with `1px` dark outline, and one-tap **Legal Land** (`USGS PAD-US`) AND filtering.
- **Seasonal Grouping & Offline 3-Angle Field Guides**
  - Automatically groups species by the current month (**Peak Season / Shoulder / Off-Season**) with a 12-month fruiting calendar, lookalike warnings, and **39 bundled offline 3-angle reference photos** (top, side, underside/cross-section).
- **6-Factor Tap-to-Inspect Diagnostics & Waypoints**
  - Tap anywhere on the map to inspect real-time elevation, slope, aspect, canopy, micro-topography, USDA NRCS SSURGO soil texture/drainage, Open-Meteo 24h/7d rainfall & soil temperature, wildfire history, and public land legality — and save personal waypoints locally.

---

## 100% Open Public Data Sources

MushroomMap uses **only free public government and community GIS APIs** — no proprietary datasets, scraped private layers, or paid tokens:

| Category | Public Data Source |
| :--- | :--- |
| Basemaps | USGS The National Map (`USGSTopo`), Esri World Imagery / World Topo, OpenTopoMap, OpenStreetMap |
| Elevation / DEM | AWS Mapzen Terrarium Public Open Data, USGS 3DEP Elevation (`elevation.nationalmap.gov`) |
| Canopy & Land Cover | MRLC NLCD 2021 Tree Canopy Cover & Land Cover WMS (`www.mrlc.gov`) |
| Soils & Hydrography | USDA NRCS Soil Data Access (WMS & Tabular REST), USGS NHD (`hydro.nationalmap.gov`) |
| Public Land & Wildfires | USGS PAD-US Public Access, NIFC WFIGS / InterAgency Fire Perimeters, USFS EDW |
| Rain, Snow & Weather | NOAA RFC QPE & NOHRSC Snow Analysis, Open-Meteo Forecast API |
| Sightings & Field Photos | iNaturalist Public API (`api.inaturalist.org`); bundled reference photos carry iNaturalist CC0 / CC-BY / CC-BY-SA / CC-BY-NC attributions or user-supplied credits |

---

## Local Development & Build

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Type-check & build static bundle (outputs to dist/)
npm run build

# Preview production build
npm run preview
```

---

## Tech Stack

- **UI**: React 18 + TypeScript + Vite 5 + Lucide React
- **GIS Engine**: MapLibre GL JS 4 (`addProtocol` client-side habitat raster engine)
- **Offline / PWA**: Web App Manifest + Service Worker (`public/sw.js`)

---

## Foraging Safety Disclaimer

Wild mushrooms include deadly toxic lookalikes. Habitat suitability heatmaps and reference photos in this app are for scouting and educational planning only and **do not constitute an edibility guarantee**. Always verify local foraging permits/regulations and confirm every specimen's identification before consumption.
