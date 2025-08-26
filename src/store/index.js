import { createStore } from 'vuex'

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}
function rand(min, max) {
  return Math.random() * (max - min) + min
}

const BASE_LAT = 48.137
const BASE_LON = 11.575
let alertCounter = 0 // simple id counter for alerts

export default createStore({
  state: () => ({
    vehicles: [],
    _tick: null,
    _lastTick: null,
    // NEW: alerts state
    alerts: [], // [{id,type,vehicleId,msg,ts,ack}]
    alertSeen: {}, // key -> true to avoid duplicates
    ui: {
      statusFilter: 'all',
      sortKey: 'soc',
      sortDir: 'desc',
      streamOn: true, // NEW: show/hide offline banner
      dark: false, // NEW: dark mode
    },
  }),
  mutations: {
    SET_VEHICLES(state, vehicles) {
      state.vehicles = vehicles
    },
    APPLY_TICK(state, updatesById) {
      const map = Object.fromEntries(state.vehicles.map((v) => [v.id, v]))
      for (const [id, patch] of Object.entries(updatesById)) {
        Object.assign(map[id], patch)
      }
      state.vehicles = Object.values(map)
    },
    SET_FILTER(state, value) {
      state.ui.statusFilter = value
    },
    SET_SORT(state, { key, dir }) {
      state.ui.sortKey = key
      state.ui.sortDir = dir
    },

    // NEW: alert mutations
    PUSH_ALERT(state, alert) {
      state.alerts.unshift(alert)
      state.alertSeen[alert.key] = true
    },
    ACK_ALERT(state, id) {
      const a = state.alerts.find((x) => x.id === id)
      if (a) a.ack = true
    },
    RESET_ALERT_KEY(state, key) {
      delete state.alertSeen[key]
    },
    SET_STREAM(state, on) {
      state.ui.streamOn = !!on
    }, // NEW
    TOGGLE_DARK(state) {
      state.ui.dark = !state.ui.dark
    }, // NEW
  },
  actions: {
    init({ commit }) {
      const vehicles = Array.from({ length: 10 }, (_, i) => ({
        id: `V${i + 1}`,
        name: `EV-${i + 1}`,
        soc: Math.floor(40 + Math.random() * 50), // %
        speed: 0, // km/h
        distance: 0, // km
        charging: false,
        temp: Math.round(rand(22, 38)), // °C
        lat: BASE_LAT + rand(-0.02, 0.02),
        lon: BASE_LON + rand(-0.03, 0.03),
      }))
      commit('SET_VEHICLES', vehicles)
    },
    startStream({ state, dispatch, commit }) {
      if (state._tick) return
      state._lastTick = Date.now()
      state._tick = setInterval(() => dispatch('tick'), 1500)
      commit('SET_STREAM', true) // NEW
    },
    stopStream({ state, commit }) {
      if (state._tick) {
        clearInterval(state._tick)
        state._tick = null
      }
      commit('SET_STREAM', false) // NEW
    },
    tick({ state, commit }) {
      const now = Date.now()
      const dtSec = state._lastTick ? (now - state._lastTick) / 1000 : 1.5
      state._lastTick = now

      const updates = {}
      for (const v of state.vehicles) {
        const stillCharging = v.charging && v.soc < 95
        const moving = !stillCharging && Math.random() > 0.45

        // speed / soc
        const nextSpeed = moving ? clamp(v.speed + rand(-3, 8), 0, 120) : 0
        let nextSoc = v.soc
        if (moving) nextSoc = clamp(nextSoc - rand(0.02, 0.08), 0, 100)
        else if (v.charging || (!moving && v.soc < 95 && Math.random() > 0.7)) {
          nextSoc = clamp(nextSoc + rand(0.4, 1.2), 0, 100) // charging
        }
        const charging = (!moving && nextSoc > v.soc) || (v.charging && nextSoc < 95)

        // distance
        const nextDistance = v.distance + (nextSpeed * dtSec) / 3600

        // position drift
        let nextLat = v.lat,
          nextLon = v.lon
        if (moving) {
          const factor = nextSpeed / 120
          nextLat += rand(-0.0005, 0.0005) * factor
          nextLon += rand(-0.0008, 0.0008) * factor
        }

        // NEW: temperature dynamics
        let nextTemp = v.temp
        if (moving) nextTemp = clamp(nextTemp + rand(0.2, 1.0), 15, 95)
        else nextTemp = clamp(nextTemp - rand(0.5, 1.2), 15, 95)

        updates[v.id] = {
          speed: nextSpeed,
          soc: nextSoc,
          charging,
          distance: nextDistance,
          lat: nextLat,
          lon: nextLon,
          temp: nextTemp,
        }

        // NEW: Alert rules
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
    overview: (state) => {
      const vals = state.vehicles
      const avgSoc = vals.length ? vals.reduce((a, v) => a + v.soc, 0) / vals.length : 0
      const moving = vals.filter((v) => v.speed > 0).length
      const charging = vals.filter((v) => v.charging).length
      const idle = vals.filter((v) => v.speed === 0 && !v.charging).length
      return { avgSoc, moving, charging, idle }
    },
    visibleVehicles: (state) => {
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
    offline: (state) => !state.ui.streamOn, // NEW
    isDark: (state) => state.ui.dark,
  },
})
