// Test Business logic (overview stats)
import store from '../src/store'
import { describe, it, expect, beforeEach } from 'vitest'

describe('store getters: overview', () => {
  beforeEach(() => {
    // reset vehicles without touching timers
    store.commit('SET_VEHICLES', [])
  })

  it('computes avg SOC and moving/charging/idle counts', () => {
    const vehicles = [
      { id: 'V1', name: 'EV-1', soc: 10, speed: 0, charging: false },
      { id: 'V2', name: 'EV-2', soc: 50, speed: 20, charging: false },
      { id: 'V3', name: 'EV-3', soc: 90, speed: 0, charging: true },
    ]
    store.commit('SET_VEHICLES', vehicles)

    const o = store.getters.overview
    expect(Math.round(o.avgSoc)).toBe(50) // (10+50+90)/3
    expect(o.moving).toBe(1) // V2
    expect(o.charging).toBe(1) // V3
    expect(o.idle).toBe(1) // V1
  })
})
