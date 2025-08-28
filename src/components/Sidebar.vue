<script setup>
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
const items = [
  { to: '/', label: 'Dashboard', name: 'dashboard' },
  { to: '/notifications', label: 'Notifications', name: 'notifications' },
  // { to: '/vehicles', label: 'Vehicles', name: 'vehicles' },
  // { to: '/settings', label: 'Settings', name: 'settings' },
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">EV Fleet</div>

    <nav class="sidebar__nav">
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
            <path d="M3 10.5 12 3l9 7.5"></path>
            <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path>
            <path d="M9 21v-6h6v6"></path>
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
            <path d="M18 8a6 6 0 1 0-12 0v5l-2 2h16l-2-2V8"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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
  padding: 16px;
  width: 240px;
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
  text-align: center;
}
.sidebar__label {
  font-weight: 600;
}
@media (max-width: 960px) {
  .sidebar {
    position: static;
    height: auto;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sidebar__nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
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
</style>
