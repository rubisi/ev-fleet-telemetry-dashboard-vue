<script setup>
import { computed } from 'vue'
import { LMap, LTileLayer, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'

const props = defineProps({ vehicles: { type: Array, default: () => [] } })

const center = computed(() => {
  if (!props.vehicles.length) return [48.137, 11.575]
  const lat = props.vehicles.reduce((a, v) => a + v.lat, 0) / props.vehicles.length
  const lon = props.vehicles.reduce((a, v) => a + v.lon, 0) / props.vehicles.length
  return [lat, lon]
})
function iconFor(v) {
  const emoji = v.charging ? '🪫' : '🚛'
  return L.divIcon({
    className: 'ev-marker' + (v.charging ? ' is-charging' : ''),
    html: `<div class="ev-marker__dot"><span class="ev-marker__emoji">${emoji}</span></div>`,
    iconSize: [32, 38], // keep in sync with CSS box
    iconAnchor: [16, 32], // bottom-center
    popupAnchor: [0, -30],
  })
}
</script>

<template>
  <l-map :zoom="12" :center="center" style="height: 420px; border-radius: 12px; overflow: hidden">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; OpenStreetMap contributors"
    />
    <!-- <l-marker v-for="v in vehicles" :key="v.id" :lat-lng="[v.lat, v.lon]">
      <l-tooltip>{{ v.name }} — {{ v.soc.toFixed(0) }}% — {{ v.speed.toFixed(0) }} km/h</l-tooltip>
    </l-marker> -->
    <LMarker v-for="v in vehicles" :key="v.id" :lat-lng="[v.lat, v.lon]" :icon="iconFor(v)">
      <LTooltip sticky> {{ v.name }} • {{ v.speed.toFixed(0) }} km/h </LTooltip>
    </LMarker>
  </l-map>
</template>

<style scoped>
.ev-marker__dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--panel);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  font-size: 16px;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.ev-marker.is-charging .ev-marker__dot {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.4);
}
</style>
