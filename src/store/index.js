// single source of truth for the app’s data
import { createStore } from 'vuex'

function clamp(n, min, max) {
  // helper function to keep a number within bounds.
  return Math.min(max, Math.max(min, n))
}
function rand(min, max) {
  // random float between min and max
  return Math.random() * (max - min) + min
}

// center around Munich (approx) for map drift
const BASE_LAT = 48.137
const BASE_LON = 11.575
let alertCounter = 0 // simple id counter for alerts

export default createStore({
  state: () => ({
    vehicles: [],
    _tick: null, // _tick stores an interval id (non-serializable); ok for a demo, but in production we'd usually keep this outside Vuex
    _lastTick: null, // last tick timestamp
    alerts: [], // [{id,type,vehicleId,msg,ts,ack}]
    alertSeen: {}, // key -> true to avoid duplicates
    ui: {
      // global UI states
      statusFilter: 'all',
      sortKey: 'soc',
      sortDir: 'desc',
      streamOn: true,
      dark: false, // dark mode
      widgets: ['kpis', 'map', 'controls', 'cards'],
    },
  }),

  // sync state changes
  mutations: {
    SET_VEHICLES(state, vehicles) {
      state.vehicles = vehicles
    },
    APPLY_TICK(state, updatesById) {
      const map = Object.fromEntries(state.vehicles.map((v) => [v.id, v])) // Build a quick id→vehicle map,
      // patches, then reassigns state.vehicles to a new array
      for (const [id, patch] of Object.entries(updatesById)) {
        Object.assign(map[id], patch)
      }
      state.vehicles = Object.values(map)
    },

    // UI Controls
    SET_FILTER(state, value) {
      state.ui.statusFilter = value
    },
    SET_SORT(state, { key, dir }) {
      state.ui.sortKey = key
      state.ui.sortDir = dir
    },
    SET_STREAM(state, on) {
      // offline
      state.ui.streamOn = !!on // boolean version of on
    },
    TOGGLE_DARK(state) {
      // theme
      state.ui.dark = !state.ui.dark
    },
    SET_WIDGETS(state, list) {
      // draggable widgets
      state.ui.widgets = list
    },

    // Alerts
    PUSH_ALERT(state, alert) {
      // prepends alert and marks its key as seen in alertSeen to avoid duplicates
      state.alerts.unshift(alert)
      state.alertSeen[alert.key] = true
    },
    ACK_ALERT(state, id) {
      // marks one alert as resolved
      const a = state.alerts.find((x) => x.id === id)
      if (a) a.ack = true
    },
    RESET_ALERT_KEY(state, key) {
      // clears dedupe so a future event can alert again
      delete state.alertSeen[key]
    },
  },
  actions: {
    init({ commit }) {
      // creates 10 vehicles with initial values (soc, temp, tires, efficiency, etc.) and random lat/lon near the base.
      const vehicles = Array.from({ length: 10 }, (_, i) => ({
        id: `V${i + 1}`,
        name: `EV-${i + 1}`,
        soc: Math.floor(40 + Math.random() * 50), // energy level as percentage %
        speed: 0, // km/h
        distance: 0, // km
        charging: false,
        temp: Math.round(rand(22, 38)), // °C
        lat: BASE_LAT + rand(-0.02, 0.02),
        lon: BASE_LON + rand(-0.03, 0.03),
        tireFL: 2.4,
        tireFR: 2.4,
        tireRL: 2.4,
        tireRR: 2.4, // bar
        efficiency: 6.5, // km/kWh (will vary with speed)
        regen: false, // true on deceleration while moving (probabilistic).
      }))
      commit('SET_VEHICLES', vehicles)
    },
    startStream({ state, dispatch, commit }) {
      // sets _lastTick, creates a setInterval every 1500 ms to dispatch tick, flips streamOn true
      if (state._tick) return
      state._lastTick = Date.now()
      state._tick = setInterval(() => dispatch('tick'), 1500)
      commit('SET_STREAM', true) // NEW
    },
    stopStream({ state, commit }) {
      // clears the interval, sets streamOn false.
      if (state._tick) {
        clearInterval(state._tick)
        state._tick = null
      }
      commit('SET_STREAM', false) // NEW
    },
    tick({ state, commit }) {
      const now = Date.now()
      // calculate delta time in seconds
      const dtSec = state._lastTick ? (now - state._lastTick) / 1000 : 1.5
      state._lastTick = now

      const updates = {}
      for (const v of state.vehicles) {
        const wasSpeed = v.speed

        // Motion + speed
        const stillCharging = v.charging && v.soc < 95
        const moving = !stillCharging && Math.random() > 0.45
        const nextSpeed = moving ? clamp(v.speed + rand(-3, 8), 0, 120) : 0

        // SOC
        let nextSoc = v.soc
        if (moving) nextSoc = clamp(nextSoc - rand(0.02, 0.08), 0, 100)
        else if (v.charging || (!moving && v.soc < 95 && Math.random() > 0.7)) {
          nextSoc = clamp(nextSoc + rand(0.4, 1.2), 0, 100)
        }
        const charging = (!moving && nextSoc > v.soc) || (v.charging && nextSoc < 95)

        // Distance
        const nextDistance = v.distance + (nextSpeed * dtSec) / 3600

        // Position drift
        let nextLat = v.lat,
          nextLon = v.lon
        if (moving) {
          const factor = nextSpeed / 120
          nextLat += rand(-0.0005, 0.0005) * factor
          nextLon += rand(-0.0008, 0.0008) * factor
        }

        // Temperature (motor)
        let nextTemp = v.temp
        if (moving) nextTemp = clamp(nextTemp + rand(0.2, 1.0), 15, 95)
        else nextTemp = clamp(nextTemp - rand(0.5, 1.2), 15, 95)

        // Tire pressures drift slightly; rise a hair when moving/hot
        const heatBump = moving ? 0.01 : -0.005
        const drift = () => rand(-0.01, 0.02) + (nextTemp > 60 ? 0.005 : 0) + heatBump
        const tireFL = clamp(v.tireFL + drift(), 1.8, 3.2)
        const tireFR = clamp(v.tireFR + drift(), 1.8, 3.2)
        const tireRL = clamp(v.tireRL + drift(), 1.8, 3.2)
        const tireRR = clamp(v.tireRR + drift(), 1.8, 3.2)

        // Efficiency (km/kWh) – best around 60–80 km/h, worse at very low/high speeds
        const s = nextSpeed
        const baseEff = 6.5 // average baseline
        const speedFactor = s < 20 ? 0.85 : s < 60 ? 1.05 : s < 90 ? 1.1 : s < 120 ? 0.95 : 0.85
        const nextEfficiency = clamp(baseEff * speedFactor + rand(-0.15, 0.15), 4.0, 8.5)

        // Regen when decelerating while moving
        const regen = wasSpeed > nextSpeed && nextSpeed > 0 && Math.random() > 0.6

        updates[v.id] = {
          speed: nextSpeed,
          soc: nextSoc,
          charging,
          distance: nextDistance,
          lat: nextLat,
          lon: nextLon,
          temp: nextTemp,
          tireFL,
          tireFR,
          tireRL,
          tireRR,
          efficiency: nextEfficiency,
          regen,
        }
        // Alert rules
        // Low battery
        const lowKey = `low_battery:${v.id}`
        if (nextSoc < 30 && !state.alertSeen[lowKey]) {
          // (to update before was 15)
          commit('PUSH_ALERT', {
            id: ++alertCounter,
            key: lowKey,
            type: 'low_battery',
            vehicleId: v.id,
            msg: `${v.name} battery low (${nextSoc.toFixed(0)}%)`,
            ts: Date.now(),
            ack: false,
          })
        } else if (nextSoc > 20 && state.alertSeen[lowKey]) {
          // reset once recovered, so future lows alert again
          commit('RESET_ALERT_KEY', lowKey)
        }

        // High temperature (to update before was 75 and 70)
        const hotKey = `high_temp:${v.id}`
        if (nextTemp > 35 && !state.alertSeen[hotKey]) {
          commit('PUSH_ALERT', {
            id: ++alertCounter,
            key: hotKey,
            type: 'high_temp',
            vehicleId: v.id,
            msg: `${v.name} high temperature (${nextTemp.toFixed(0)}°C)`,
            ts: Date.now(),
            ack: false,
          })
        } else if (nextTemp < 30 && state.alertSeen[hotKey]) {
          commit('RESET_ALERT_KEY', hotKey)
        }
      }
      commit('APPLY_TICK', updates)
    },
  },
  getters: {
    // derived states
    overview: (state) => {
      // aggregate KPIs: average SOC, count moving/charging/idle.
      const vals = state.vehicles
      const avgSoc = vals.length ? vals.reduce((a, v) => a + v.soc, 0) / vals.length : 0
      const moving = vals.filter((v) => v.speed > 0).length
      const charging = vals.filter((v) => v.charging).length
      const idle = vals.filter((v) => v.speed === 0 && !v.charging).length
      return { avgSoc, moving, charging, idle }
    },
    visibleVehicles: (state) => {
      // applies current filter (moving/charging/idle) and sort (by sortKey asc/desc).
      const { statusFilter, sortKey, sortDir } = state.ui
      const arr = state.vehicles.filter((v) => {
        if (statusFilter === 'moving') return v.speed > 0
        if (statusFilter === 'charging') return v.charging
        if (statusFilter === 'idle') return v.speed === 0 && !v.charging
        return true
      })
      const dir = sortDir === 'asc' ? 1 : -1
      return [...arr].sort((a, b) => (a[sortKey] - b[sortKey]) * dir)
    },
    alerts: (state) => state.alerts,
    offline: (state) => !state.ui.streamOn, // inverse of streamOn
    isDark: (state) => state.ui.dark, // theme state
    widgets: (state) => state.ui.widgets, // current dashboard layout modules
  },
})
