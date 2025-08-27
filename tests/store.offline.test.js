// Test UI state (offline banner)
import store from '../src/store'
import { describe, it, expect } from 'vitest'


describe('store: offline banner', () => {
  it('getter offline reflects stream state', () => {
    // stream on by default in our store; offline should be false
    expect(store.getters.offline).toBe(false)

    store.commit('SET_STREAM', false)
    expect(store.getters.offline).toBe(true)

    store.commit('SET_STREAM', true)
    expect(store.getters.offline).toBe(false)
  })
})
