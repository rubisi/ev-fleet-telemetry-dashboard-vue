<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import AlertsPanel from '../components/AlertsPanel.vue'

const store = useStore()
const alerts = computed(() => store.getters.alerts)

function ackAlert(id) {
  store.commit('ACK_ALERT', id)
}
</script>

<template>
  <main style="padding: 16px">
    <h1>Notifications</h1>

    <!-- Must be adjacent: v-if / v-else -->
    <p v-if="alerts.length === 0" style="opacity: 0.7">No alerts.</p>

    <section v-else class="panel" style="padding: 12px; max-width: 960px">
      <AlertsPanel :items="alerts" @ack="ackAlert" />
    </section>
  </main>
</template>
