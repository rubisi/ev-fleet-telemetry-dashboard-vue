<script setup>
const props = defineProps({ items: { type: Array, default: () => [] } })
const emit = defineEmits(['ack'])
</script>

<template>
  <aside class="panel" style="padding: 12px">
    <header
      style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px"
    >
      <strong>Notifications</strong>
      <span>{{ items.length }}</span>
    </header>

    <ul v-if="items.length">
      <li
        v-for="a in items"
        :key="a.id"
        style="
          display: flex;
          justify-content: space-between;
          gap: 8px;
          padding: 6px 0;
          border-top: 1px dashed var(--border);
        "
      >
        <div>
          <div style="font-weight: 600">
            {{ a.type === 'low_battery' ? 'Low battery' : 'High temperature' }}
            <small style="opacity: 0.7">• {{ new Date(a.ts).toLocaleTimeString() }}</small>
          </div>
          <div style="opacity: 0.85">{{ a.msg }}</div>
        </div>
        <button :disabled="a.ack" @click="$emit('ack', a.id)">
          {{ a.ack ? 'Resolved' : 'Resolve' }}
        </button>
      </li>
    </ul>
    <p v-else style="opacity: 0.6">No alerts.</p>
  </aside>
</template>
