<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  message: { type: String, default: 'Data stream paused. Displaying last known values.' },
})
</script>

<template>
  <div
    v-if="visible"
    role="status"
    aria-live="polite"
    style="
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 10px 14px;
      text-align: center;
      background: var(--banner-bg);
      color: var(--banner-fg);
      border: 1px solid var(--banner-border);
      border-left: 0;
      border-right: 0;
      font-weight: 600;
    "
  >
    ⚠️ {{ message }}
  </div>
</template>
