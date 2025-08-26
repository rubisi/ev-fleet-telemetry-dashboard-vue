<script setup>
import { computed } from 'vue';
import { LMap, LTileLayer, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet';

const props = defineProps({ vehicles: { type: Array, default: () => [] } });

const center = computed(() => {
  if (!props.vehicles.length) return [48.137, 11.575];
  const lat = props.vehicles.reduce((a, v) => a + v.lat, 0) / props.vehicles.length;
  const lon = props.vehicles.reduce((a, v) => a + v.lon, 0) / props.vehicles.length;
  return [lat, lon];
});
</script>

<template>
  <l-map :zoom="12" :center="center" style="height:420px; border-radius:12px; overflow:hidden;">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; OpenStreetMap contributors" />
    <l-marker v-for="v in vehicles" :key="v.id" :lat-lng="[v.lat, v.lon]">
      <l-tooltip>{{ v.name }} — {{ v.soc.toFixed(0) }}% — {{ v.speed.toFixed(0) }} km/h</l-tooltip>
    </l-marker>
  </l-map>
</template>
