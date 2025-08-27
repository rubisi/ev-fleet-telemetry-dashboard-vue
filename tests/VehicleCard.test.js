// Test Component rendering (VehicleCard)
import { mount } from '@vue/test-utils'
import VehicleCard from '../src/components/VehicleCard.vue'
import { describe, it, expect } from 'vitest'


const base = {
  id: 'V1', name: 'EV-1', soc: 42, speed: 0, temp: 35,
  distance: 12.34, lat: 48.1, lon: 11.5, charging: false
}

describe('VehicleCard', () => {
  it('renders title, SOC bar width, and Idle status', () => {
    const w = mount(VehicleCard, { props: { v: { ...base } } })
    expect(w.text()).toContain('EV-1')
    // Idle when speed=0 and not charging
    expect(w.text()).toContain('Idle')
    // SOC bar width reflects SOC%
    const style = w.get('.soc__fill').attributes('style') || ''
    expect(style).toContain('width: 42%')
  })

  it('shows Moving when speed > 0, and Charging when charging', async () => {
    const w = mount(VehicleCard, { props: { v: { ...base, speed: 50 } } })
    expect(w.text()).toContain('Moving')

    await w.setProps({ v: { ...base, charging: true } })
    expect(w.text()).toContain('Charging')
  })
})
