<script setup>
import { onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'

import MapView from '../components/MapView.vue'
import OfflineBanner from '../components/OfflineBanner.vue'
import VehicleCard from '../components/VehicleCard.vue'

const store = useStore()

onMounted(() => {
  if (!store.state.vehicles.length) {
    store.dispatch('init')
    store.dispatch('startStream')
  }

  // Loads saved panel order from localStorage
  const defaultOrder = ['kpis', 'map', 'controls', 'cards']
  const raw = localStorage.getItem('widgets')
  if (!raw) {
    store.commit('SET_WIDGETS', defaultOrder)
    return
  }

  try {
    const saved = JSON.parse(raw)
    // migrate old ids → new ids
    const migrated = saved
      .map((x) => {
        if (x === 'overview') return 'kpis'
        if (x === 'alerts') return 'controls' // or drop if you prefer
        return x
      })
      .filter((x) => defaultOrder.includes(x))

    // ensure all panels exist at least once, in a stable order
    const final = [...new Set([...migrated, ...defaultOrder])]
    store.commit('SET_WIDGETS', final)
  } catch {
    store.commit('SET_WIDGETS', defaultOrder)
  }
})

// Computed from Vuex
const vehicles = computed(() => store.getters.visibleVehicles)
const overview = computed(() => store.getters.overview)
const offline = computed(() => store.getters.offline)
const alerts = computed(() => store.getters.alerts || [])
const unackedCount = computed(() => alerts.value.filter((a) => !a.ack).length)
const statusFilter = computed(() => store.state.ui.statusFilter)

// two-way binding to Vuex
const widgets = computed({
  // widgets is a computed with get/set to Vuex state.ui.widgets.
  get: () => store.state.ui.widgets,
  set: (val) => store.commit('SET_WIDGETS', val),
})
// persist layout
// This deep watcher saves any reorder to localStorage (so our layout sticks on refresh).
watch(widgets, (val) => localStorage.setItem('widgets', JSON.stringify(val)), { deep: true })

// UI actions that commit to Vuex
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
</script>

<template>
  <main class="page">
    <OfflineBanner :visible="offline" />

    <header class="page__head">
      <h1>Dashboard</h1>
      <small class="muted">Live EV fleet telemetry (simulated)</small>
    </header>

    <!-- Draggable panels -->
    <draggable
      v-model="widgets"
      :item-key="(e) => e"
      handle=".drag-handle"
      ghost-class="ghost"
      :animation="150"
    >
      <template #item="{ element }">
        <section class="panel">
          <div class="panel__head">
            <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
            <h2 class="panel__title">
              {{
                element === 'kpis'
                  ? 'Overview'
                  : element === 'map'
                    ? 'Live Map'
                    : element === 'controls'
                      ? 'Controls'
                      : 'Vehicles'
              }}
            </h2>
          </div>

          <!-- KPIs (tiles) -->
          <div v-if="element === 'kpis'" class="kpi-grid">
            <article class="kpi kpi--info">
              <div class="kpi__label">Avg SOC</div>
              <div class="kpi__value">{{ overview.avgSoc.toFixed(0) }}%</div>
            </article>
            <article class="kpi kpi--primary">
              <div class="kpi__label">Moving</div>
              <div class="kpi__value">{{ overview.moving }}</div>
            </article>
            <article class="kpi kpi--success">
              <div class="kpi__label">Charging</div>
              <div class="kpi__value">{{ overview.charging }}</div>
            </article>
            <article class="kpi kpi--warn">
              <div class="kpi__label">Active alerts</div>
              <div class="kpi__value">{{ unackedCount }}</div>
            </article>
          </div>

          <!-- Map -->
          <div v-else-if="element === 'map'" class="section-inner">
            <MapView :vehicles="vehicles" />
          </div>

          <!-- Controls -->
          <div v-else-if="element === 'controls'" class="controls">
            <div class="controls__group" role="group" aria-label="Status filter">
              <span class="controls__label">Status:</span>

              <button
                type="button"
                @click="setFilter('all')"
                :class="{ 'is-active': statusFilter === 'all' }"
                :aria-pressed="statusFilter === 'all'"
              >
                All
              </button>

              <button
                type="button"
                @click="setFilter('moving')"
                :class="{ 'is-active': statusFilter === 'moving' }"
                :aria-pressed="statusFilter === 'moving'"
              >
                Moving
              </button>

              <button
                type="button"
                @click="setFilter('charging')"
                :class="{ 'is-active': statusFilter === 'charging' }"
                :aria-pressed="statusFilter === 'charging'"
              >
                Charging
              </button>

              <button
                type="button"
                @click="setFilter('idle')"
                :class="{ 'is-active': statusFilter === 'idle' }"
                :aria-pressed="statusFilter === 'idle'"
              >
                Idle
              </button>
            </div>

            <div class="controls__group">
              <span class="controls__label">Sort by:</span>
              <select @change="setSortKey($event.target.value)">
                <option value="soc">SOC</option>
                <option value="speed">Speed</option>
                <option value="distance">Distance</option>
              </select>
              <button @click="toggleSortDir">Order ↑/↓</button>
            </div>

            <div class="controls__spacer"></div>

            <!--<div class="controls__group">
              <button @click="$store.dispatch('stopStream')">Pause</button>
              <button @click="$store.dispatch('startStream')">Resume</button>
            </div>-->
          </div>

          <!-- Cards -->
          <div v-else class="cards">
            <div class="cards__grid">
              <VehicleCard v-for="v in vehicles" :key="v.id" :v="v" />
            </div>
          </div>
        </section>
      </template>
    </draggable>
  </main>
</template>

<style scoped>
.page {
  padding: 16px;
}
.page__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}
.muted {
  opacity: 0.7;
}

/* panel chrome */
.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.panel__title {
  margin: 0;
  font-size: 1rem;
}
.drag-handle {
  cursor: grab;
  user-select: none;
  opacity: 0.6;
}

/* ghost while dragging */
.ghost {
  opacity: 0.6;
}

/* map / generic inner section spacing */
.section-inner {
  /* Map container already has height in its child */
}

/* KPI tiles */
.kpi-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}
.kpi {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
}
.kpi__label {
  font-size: 0.85rem;
  color: var(--muted);
}
.kpi__value {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.1;
}
.kpi--primary {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.25);
}
.kpi--success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.25);
}
.kpi--warn {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.28);
}
.kpi--info {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.25);
}

/* controls layout */
.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.controls__group {
  display: flex;
  gap: 6px;
  align-items: center;
}
.controls__label {
  color: var(--muted);
}
.controls__spacer {
  margin-left: auto;
}

/* cards grid */
.cards__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

/* small motion polish */
.kpi__value {
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

/* base buttons inside controls (optional polish) */
.controls button {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
}

/* selected state */
.controls button.is-active {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.25);
  color: #1d4ed8; /* optional: accent text */
}
</style>
