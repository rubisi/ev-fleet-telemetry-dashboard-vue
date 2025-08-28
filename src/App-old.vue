<script setup>
import { computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'
import MapView from './components/MapView.vue'
import AlertsPanel from './components/AlertsPanel.vue'
import OfflineBanner from './components/OfflineBanner.vue'
import VehicleCard from './components/VehicleCard.vue'

const store = useStore()
onMounted(() => {
  store.dispatch('init')
  store.dispatch('startStream')
  // restore saved layout if any
  const saved = localStorage.getItem('widgets')
  if (saved) store.commit('SET_WIDGETS', JSON.parse(saved))
})

const vehicles = computed(() => store.getters.visibleVehicles)
const overview = computed(() => store.getters.overview)
const alerts = computed(() => store.getters.alerts)
const offline = computed(() => store.getters.offline) // NEW
const isDark = computed(() => store.getters.isDark)
// two-way bind to Vuex + persist
const widgets = computed({
  get: () => store.state.ui.widgets,
  set: (val) => store.commit('SET_WIDGETS', val),
})
watch(widgets, (val) => localStorage.setItem('widgets', JSON.stringify(val)), { deep: true })

function setFilter(v) {
  store.commit('SET_FILTER', v)
}
function setSortKey(key) {
  store.commit('SET_SORT', { key, dir: store.state.ui.sortDir })
}
function toggleSortDir() {
  const dir = store.state.ui.sortDir === 'asc' ? 'desc' : 'asc'
  store.commit('SET_SORT', { key: store.state.ui.sortKey, dir })
}
function ackAlert(id) {
  store.commit('ACK_ALERT', id)
}
function toggleDark() {
  store.commit('TOGGLE_DARK')
}
</script>

<template>
  <main style="padding: 16px; font-family: system-ui">
    <!-- NEW: Offline banner -->
    <OfflineBanner :visible="offline" />
    <header style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px">
      <h1 style="margin: 0">EV Fleet Dashboard</h1>
      <span style="opacity: 0.7">•</span>
      <button @click="toggleDark">{{ isDark ? 'Light mode' : 'Dark mode' }}</button>
    </header>
    <!-- Draggable stack -->
    <draggable
      v-model="widgets"
      :item-key="(e) => e"
      handle=".drag-handle"
      ghost-class="ghost"
      :animation="150"
    >
      <template #item="{ element }">
        <section class="panel" style="padding: 12px; margin-bottom: 12px">
          <div
            class="drag-handle"
            style="cursor: grab; opacity: 0.6; font-size: 12px; margin-bottom: 8px"
          >
            ⋮⋮ drag
          </div>

          <!-- OVERVIEW -->
          <template v-if="element === 'overview'">
            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap">
              <strong>Overview:</strong>
              <span>Avg SOC: {{ overview.avgSoc.toFixed(0) }}%</span>
              <span>Moving: {{ overview.moving }}</span>
              <span>Charging: {{ overview.charging }}</span>
              <span>Idle: {{ overview.idle }}</span>
            </div>
          </template>

          <!-- MAP -->
          <template v-else-if="element === 'map'">
            <MapView :vehicles="vehicles" />
          </template>

          <!-- ALERTS -->
          <template v-else-if="element === 'alerts'">
            <AlertsPanel :items="alerts" @ack="ackAlert" />
          </template>

          <!-- CARDS -->
          <template v-else-if="element === 'cards'">
            <section style="display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap">
              <div style="display: flex; gap: 6px; align-items: center">
                <span>Status:</span>
                <button @click="setFilter('all')">All</button>
                <button @click="setFilter('moving')">Moving</button>
                <button @click="setFilter('charging')">Charging</button>
                <button @click="setFilter('idle')">Idle</button>
              </div>
              <div style="display: flex; gap: 6px; align-items: center">
                <span>Sort by:</span>
                <select @change="setSortKey($event.target.value)">
                  <option value="soc">SOC</option>
                  <option value="speed">Speed</option>
                  <option value="distance">Distance</option>
                </select>
                <button @click="toggleSortDir">Toggle ↑/↓</button>
              </div>
              <div style="margin-left: auto; display: flex; gap: 8px">
                <button @click="$store.dispatch('stopStream')">Pause</button>
                <button @click="$store.dispatch('startStream')">Resume</button>
              </div>
            </section>

            <section
              style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                gap: 12px;
              "
            >
              <VehicleCard v-for="v in vehicles" :key="v.id" :v="v" />
            </section>
          </template>
        </section>
      </template>
    </draggable>
    <!-- <section style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap">
      <strong>Overview:</strong>
      <span>Avg SOC: {{ overview.avgSoc.toFixed(0) }}%</span>
      <span>Moving: {{ overview.moving }}</span>
      <span>Charging: {{ overview.charging }}</span>
      <span>Idle: {{ overview.idle }}</span>
    </section>

    <section
      style="display: flex; gap: 16px; margin: 12px 0; align-items: flex-start; flex-wrap: wrap"
    >
      <div style="flex: 1 1 520px">
        <MapView :vehicles="vehicles" />
      </div>

      <div style="flex: 1 1 320px; min-width: 300px">
        <AlertsPanel :items="alerts" @ack="ackAlert" />
      </div>
    </section>

    <section style="display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap">
      <div style="display: flex; gap: 6px; align-items: center">
        <span>Status:</span>
        <button @click="setFilter('all')">All</button>
        <button @click="setFilter('moving')">Moving</button>
        <button @click="setFilter('charging')">Charging</button>
        <button @click="setFilter('idle')">Idle</button>
      </div>

      <div style="display: flex; gap: 6px; align-items: center">
        <span>Sort by:</span>
        <select @change="setSortKey($event.target.value)">
          <option value="soc">SOC</option>
          <option value="speed">Speed</option>
          <option value="distance">Distance</option>
        </select>
        <button @click="toggleSortDir">Toggle ↑/↓</button>
      </div>

      <div style="margin-left: auto; display: flex; gap: 8px">
        <button @click="$store.dispatch('stopStream')">Pause</button>
        <button @click="$store.dispatch('startStream')">Resume</button>
      </div>
    </section>
    <section
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px"
    >
      <VehicleCard v-for="v in vehicles" :key="v.id" :v="v" />
    </section> -->
  </main>
</template>
