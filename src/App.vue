<script setup>
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'
</script>

<template>
  <div class="layout">
    <Sidebar />
    <div class="content">
      <HeaderBar />
      <router-view />
    </div>
  </div>
</template>

<style>
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}
.content {
  min-width: 0; /* fixes overflow in grids */
}
@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
