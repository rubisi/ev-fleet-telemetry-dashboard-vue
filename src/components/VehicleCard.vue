<script setup>
const props = defineProps({
  v: { type: Object, required: true }
});

// derive a simple status + color
function statusOf(v) {
  if (v.charging) return { label: 'Charging', bg: 'rgba(16,185,129,0.15)', fg: '#10b981' };   // green-ish
  if (v.speed > 0) return { label: 'Moving', bg: 'rgba(59,130,246,0.15)', fg: '#3b82f6' };     // blue-ish
  return { label: 'Idle', bg: 'rgba(148,163,184,0.18)', fg: '#94a3b8' };                       // slate-ish
}
</script>

<template>
  <article class="card">
    <header class="card__head">
      <h3 class="card__title">{{ v.name }}</h3>
      <span class="chip" :style="{ background: statusOf(v).bg, color: statusOf(v).fg }">
        {{ statusOf(v).label }}
      </span>
    </header>

    <!-- SOC progress -->
    <div class="soc">
      <div class="soc__row">
        <span>SOC</span>
        <strong>{{ v.soc.toFixed(0) }}%</strong>
      </div>
      <div class="soc__bar">
        <div class="soc__fill" :style="{ width: Math.max(0, Math.min(100, v.soc)) + '%' }" />
      </div>
    </div>

    <!-- quick stats -->
    <dl class="stats">
      <div><dt>Speed</dt><dd>{{ v.speed.toFixed(0) }} km/h</dd></div>
      <div><dt>Temp</dt><dd>{{ v.temp.toFixed(0) }}°C</dd></div>
      <div><dt>Distance</dt><dd>{{ v.distance.toFixed(2) }} km</dd></div>
      <div><dt>Coords</dt><dd>{{ v.lat.toFixed(3) }}, {{ v.lon.toFixed(3) }}</dd></div>
    </dl>
  </article>
</template>

<style scoped>
.card{
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card__head{
  display:flex; align-items:center; justify-content:space-between; gap:8px;
}
.card__title{ margin:0; font-size:1rem; }
.chip{
  display:inline-flex; align-items:center; gap:6px;
  padding:2px 8px; border-radius:999px; font-weight:600; font-size:0.85rem;
}

.soc{ display:flex; flex-direction:column; gap:6px; }
.soc__row{ display:flex; justify-content:space-between; font-size:0.9rem; color:var(--muted); }
.soc__bar{
  width:100%; height:8px; background: rgba(148,163,184,0.25);
  border-radius:999px; overflow:hidden;
}
.soc__fill{
  height:100%;
  background: linear-gradient(90deg, #22c55e, #84cc16);
}

.stats{
  display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px 12px;
  font-size:0.92rem;
}
.stats dt{ color: var(--muted); }
.stats dd{ margin:0; font-weight:600; }
@media (max-width: 640px){
  .stats{ grid-template-columns: 1fr 1fr; }
}
</style>
