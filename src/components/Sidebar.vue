<script setup>
// Navigation sidebar for the dashboard
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
// Navigation items
const items = [
  { to: '/', label: 'Dashboard', name: 'dashboard' },
  { to: '/notifications', label: 'Notifications', name: 'notifications' },
]

const open = ref(false) //controls whether the mobile dropdown menu is visible.
const root = ref(null) // reference to the sidebar element (for click-outside detection)

// If the user navigates to a new page, the mobile menu closes automatically.
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

// Detects clicks outside the sidebar -> closes the mobile dropdown menu
function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <aside class="sidebar" ref="root">
    <div class="sidebar__brand">EV Fleet</div>

    <!-- Mobile hamburger -->
    <button
      class="sidebar__toggle"
      @click.stop="open = !open"
      :aria-expanded="open"
      aria-controls="mobile-nav"
      aria-label="Toggle navigation"
      title="Toggle navigation"
    >
      <!-- hamburger / close -->
      <svg
        v-if="!open"
        class="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
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
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>

    <!-- Desktop nav + Mobile popover -->
    <nav id="mobile-nav" class="sidebar__nav" :class="{ 'is-open': open }">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="sidebar__link"
        :class="{ active: route.path === item.to }"
      >
        <span class="sidebar__icon" aria-hidden="true">
          <!-- Home / Dashboard -->
          <svg
            v-if="item.name === 'dashboard'"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
            <path d="M9 21v-6h6v6" />
          </svg>
          <!-- Bell / Notifications -->
          <svg
            v-else-if="item.name === 'notifications'"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 8a6 6 0 1 0-12 0v5l-2 2h16l-2-2V8" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
        <span class="sidebar__label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 240px;
  padding: 16px;
  box-sizing: border-box;
  background: var(--panel);
  border-right: 1px solid var(--border);
}
.sidebar__brand {
  font-weight: 800;
  letter-spacing: 0.3px;
  margin-bottom: 12px;
}
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sidebar__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  color: var(--text);
  text-decoration: none;
  border: 1px solid transparent;
}
.sidebar__link:hover {
  background: rgba(148, 163, 184, 0.12);
}
.sidebar__link.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.25);
}
.sidebar__icon {
  width: 20px;
  display: grid;
  place-items: center;
}
.icon {
  width: 18px;
  height: 18px;
  display: block;
}

/* hamburger hidden on desktop */
.sidebar__toggle {
  display: none;
}

/* ===== Mobile / tablet ===== */
@media (max-width: 960px) {
  .sidebar {
    position: sticky;
    top: 0;
    z-index: 2100; /* above header & map */
    height: auto;
    width: 100%;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .sidebar__brand {
    margin: 0;
  }
  .sidebar__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--btn-bg);
    color: var(--btn-fg);
    border: 1px solid var(--btn-border);
  }
  /* popover menu (hidden by default) */
  .sidebar__nav {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
    padding: 8px;
    display: none;
    flex-direction: column;
    gap: 6px;
  }
  .sidebar__nav.is-open {
    display: flex;
  }
  .sidebar__link {
    padding: 10px 12px;
  }
}
</style>
