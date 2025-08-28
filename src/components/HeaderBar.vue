<script setup>
// top bar with offline chip, pause/resume button/ theme toggle/ notification icon
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const isDark = computed(() => store.getters.isDark) // theme mode
const offline = computed(() => store.getters.offline) // whether the app is offline
const alerts = computed(() => store.getters.alerts) // all notifications
const unacked = computed(() => alerts.value.filter((a) => !a.ack))
const unackedCount = computed(() => unacked.value.length) // num of unacknowledged notifications
const themeLabel = computed(() => (isDark.value ? 'Switch to light mode' : 'Switch to dark mode')) // updates with state
const bellLabel = computed(
  () =>
    unackedCount.value ? `Open notifications — ${unackedCount.value} new` : 'Open notifications', // updates with state
)

function toggleDark() {
  store.commit('TOGGLE_DARK')
}
function toggleStream() {
  offline.value ? store.dispatch('startStream') : store.dispatch('stopStream')
}

const open = ref(false)
const root = ref(null)
// notification dropdown
function toggleDropdown() {
  open.value = !open.value
}
function goAll() {
  // closes dropdown and routes to the notifications page.
  open.value = false
  router.push({ name: 'notifications' })
}
function ack(id) {
  store.commit('ACK_ALERT', id) // marks a single alert as acknowledged
}

function onDocClick(e) {
  if (!root.value) return
  if (!root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <header class="header" ref="root">
    <div class="header__left">
      <!-- <h2 class="header__title">{{ title }}</h2> -->

      <!-- Show when offline is true -->
      <span v-if="offline" class="chip chip--warn">Offline</span>
    </div>

    <div class="header__right">
      <button class="btn" @click="toggleStream">{{ offline ? 'Resume' : 'Pause' }}</button>
      <button
        class="btn btn--icon theme-toggle"
        @click="toggleDark"
        :aria-label="themeLabel"
        :aria-pressed="isDark"
        :title="themeLabel"
      >
        <!-- Action pattern: show the NEXT theme icon -->
        <!-- If currently dark, show sun (tap to go light) -->
        <svg
          v-if="isDark"
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4"></circle>
          <path
            d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          ></path>
        </svg>

        <!-- If currently light, show moon (tap to go dark) -->
        <svg
          v-else
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
      <div class="bell">
        <button
          class="btn btn--icon"
          @click.stop="toggleDropdown"
          :aria-label="bellLabel"
          :title="bellLabel"
        >
          <!-- Bell (stroke, inherits currentColor) -->
          <svg
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <!-- hero-style bell outline -->
            <path
              d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.44V11a6 6 0 1 0-12 0v3.16c0 .54-.21 1.06-.6 1.44L4 17h5"
            />
            <path d="M9 17v1a3 3 0 1 0 6 0v-1" />
          </svg>

          <span v-if="unackedCount" class="badge">{{ unackedCount }}</span>
        </button>

        <div v-if="open" class="dropdown panel">
          <div class="dropdown__header">
            <strong>Notifications</strong>
            <span style="opacity: 0.7">{{ alerts.length }}</span>
          </div>

          <div v-if="alerts.length" class="dropdown__list">
            <div v-for="a in alerts.slice(0, 5)" :key="a.id" class="dropdown__item">
              <div class="drop__text">
                <span
                  class="pill"
                  :class="a.type === 'low_battery' ? 'pill--warn' : 'pill--danger'"
                >
                  {{ a.type === 'low_battery' ? 'Low battery' : 'High temp' }}
                </span>
                <span>{{ a.msg }}</span>
                <small class="muted">• {{ new Date(a.ts).toLocaleTimeString() }}</small>
              </div>
              <button class="btn btn--sm" :disabled="a.ack" @click="ack(a.id)">
                {{ a.ack ? 'Resolved' : 'Resolve' }}
              </button>
            </div>
          </div>
          <p v-else class="muted" style="margin: 0 0 8px 0">No alerts</p>

          <button class="btn btn--full" @click="goAll">Show all</button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}
.header__title {
  margin: 0;
  font-size: 1.1rem;
}
.header__left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  background: var(--btn-bg);
  color: var(--btn-fg);
  border: 1px solid var(--btn-border);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
.btn--icon {
  position: relative;
  padding: 6px 10px;
}
.btn--sm {
  padding: 4px 8px;
}
.btn--full {
  width: 100%;
  margin-top: 6px;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  background: #ef4444;
  color: white;
  border-radius: 999px;
  font-size: 11px;
  display: grid;
  place-items: center;
  padding: 0 4px;
}

.bell {
  position: relative;
}
.dropdown {
  position: absolute;
  right: 0;
  margin-top: 6px;
  width: 320px;
  padding: 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
.dropdown__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.dropdown__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 50vh;
  overflow: auto;
}
.dropdown__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.drop__text {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.muted {
  opacity: 0.7;
}
.pill {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
}
.pill--warn {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(245, 158, 11, 0.3);
}
.pill--danger {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.3);
}

.chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}
.chip--warn {
  background: var(--banner-bg);
  color: var(--banner-fg);
  border: 1px solid var(--banner-border);
}
.theme-toggle .icon {
  width: 18px;
  height: 18px;
  display: block;
}
@media (prefers-reduced-motion: no-preference) {
  .theme-toggle .icon {
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
  }
  .theme-toggle:active .icon {
    transform: scale(0.92);
  }
}
.btn--icon .icon {
  width: 18px;
  height: 18px;
  display: block;
}
@media (prefers-reduced-motion: no-preference) {
  .btn--icon .icon {
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
  }
  .btn--icon:active .icon {
    transform: scale(0.92);
  }
}
.header {
  position: sticky;
  top: 0;
  z-index: 2000; /* was 20 — keep this above Leaflet panes */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg); /* ensure an opaque background */
  border-bottom: 1px solid var(--border);
}
</style>
