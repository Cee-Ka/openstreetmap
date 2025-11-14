# OpenStreetMap POI Demo

This repository contains a small React + Vite demo app (`my-map`) that lets you search places in Vietnam,
fetch nearby Points-of-Interest (POIs) via Overpass, and view them on a Leaflet map.

**Quick features:**
- Search by place name (Nominatim geocoding)
- Nearby POIs from Overpass (amenity, shop, tourism)
- Interactive map with markers and a highlighted search zone
- Lightweight, no backend required (Firebase previously used but has been removed)

**Contents**
- `my-map/` — the React app (Vite)
	- `src/` — source code (main entry: `src/main.jsx`, app: `src/App.jsx`)
	- `index.html` — HTML template (includes Tailwind CDN for quick styling)
	- `package.json` — project manifest
	- `install-deps.sh` — helper script to install deps listed in `npm-dependencies.txt` and `npm-dev-dependencies.txt`

**Prerequisites**
- Node.js and npm (Node 18+ recommended)
- Internet access for tile servers, Nominatim and Overpass API requests

**Setup & Run (quick)**
1. Open a terminal and change into the app folder:

	 ```bash
	 cd my-map
	 ```

2. Install dependencies (pick one):

	 - Standard npm install (reads `package.json`):

		 ```bash
		 npm install
		 ```

	 - Or use the provided helper (reads the two `*.txt` lists):

		 ```bash
		 chmod +x install-deps.sh
		 ./install-deps.sh
		 ```

3. Start the dev server:

	 ```bash
	 npm run dev
	 ```

4. Open the local URL printed by Vite in your browser (usually `http://localhost:5173`).

**How to use the app**
- Type a place name (e.g., `Ho Chi Minh City`, `Hội An`) and press `Tìm` (Search).
- The app will geocode the query via Nominatim, query Overpass for POIs within 2 km, and show:
	- A red POI-style pin for the search center
	- Nearby POIs as markers (up to 5 closest)
	- A shaded circle showing the search radius (2 km)

**Config & Customization**
- Change search radius: edit `SEARCH_RADIUS` in `my-map/src/App.jsx` (meters).
- To show more features, modify the Overpass query in `src/App.jsx` to include ways/relations or extra tags (e.g., `leisure`, `historic`).
- Map marker icons: the red pin uses a remote image. To bundle icons locally, add images to `src/assets/` and import them.
