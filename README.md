# EV Fleet Telemetry Dashboard

A Vue 3 + Vite + Vuex single-page app that simulates real-time telemetry for a fleet of EVs.  
It includes live updates, overview stats, per-vehicle panels, a map with moving markers, filters/sorting, alerts, an offline banner, dark mode, a draggable layout, and unit tests.

---

## Features

- **Real-time simulation**: 10 vehicles, **12+ telemetry fields**  
  _(speed, SOC, temperature, distance, charging, lat/lon, tire pressures FL/FR/RL/RR, efficiency, regen)_
- **Overview**: average SOC, counts of moving and charging EVs
- **Vehicle panels**: cards with SOC bar, speed, temp, distance, efficiency, tire pressures, regen badge
- **Map**: Leaflet markers that update as vehicles move
- **Filter / Sort**: status (moving / charging / idle), sort by SOC / speed / distance
- **Alerts**: low battery (<15%) and high temperature (>75 °C) with acknowledge & de-dup/hysteresis
- **Offline banner**: pause/resume stream; keeps last values visible
- **Dark mode**: CSS variables + persisted preference
- **Custom layout**: drag-to-reorder main panels (overview / map / controls / cards)
- **Tests**: 3 unit tests (Vitest)

---

## Tech stack

- **Vue 3**, **Vite**
- **Vuex 4** (state management)
- **Leaflet** + `@vue-leaflet/vue-leaflet` (map)
- `vuedraggable` (drag-and-drop layout)
- **Vitest** + `@vue/test-utils` + **jsdom** (unit tests)

---

## Getting started

**Requirements:** Node **20 LTS** (recommended), npm

```bash
# install dependencies
npm install

# start dev server
npm run dev
# open the printed URL (usually http://localhost:5173)
```

---

## Tests

```bash
# run once (CI-style)
npm run test

# watch mode (reruns on save)
npm run test:watch
```

Covers:

1. overview getter (avg SOC + moving/charging/idle)
2. offline banner state (SET_STREAM / offline getter)
3. VehicleCard renders SOC & status

---

## Production

```bash
# create production bundle in /dist
npm run build

# serve the built assets locally and verify prod build
npm run preview
# open the printed URL (usually http://localhost:4173)

```

---

## Project Structure (key files)

```bash
    src/
    components/
        AlertsPanel.vue
        HeaderBar.vue
        MapView.vue
        OfflineBanner.vue
        Sidebar.vue
        VehicleCard.vue
    pages/
        DashboardPage.vue
        NotificationsPage.vue
    store/
        index.js              # Vuex: vehicles, UI, alerts, simulation
    App.vue
    main.js                 # theme sync, Leaflet CSS/icons
    styles.css              # light/dark CSS variables

    tests/
    VehicleCard.test.js
    store.offline.test.js
    store.overview.test.js

```

---

## How the simulation works (high-level)

- A Vuex startStream action starts an interval (~1.5s) that dispatches tick.
- tick computes batch updates for each vehicle and commits them via a single APPLY_TICK mutation (perf-friendly).
- Values evolve realistically:
- Speed varies; distance integrates speed over time.
- SOC drains when moving; rises when idle/charging (up to 95%).
- Temperature rises when moving, cools when idle.
- Position drifts with speed.
- Tire pressures nudge up when hot/moving, otherwise cool slightly (clamped 1.8–3.2 bar).
- Efficiency (km/kWh) best around 60–80 km/h; worse at very low/high speeds.
- Regen flag toggles on occasional deceleration events.
- Alerts (low battery/high temp) fire once per condition and reset when recovered (hysteresis).

---

## Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## Future Work

- Collapsable sections & compact cards
- Add more alerts

---
