import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'

import './styles.css' // NEW
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const app = createApp(App)
app.use(store)

// apply once on load
function applyTheme(isDark) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

const saved = localStorage.getItem('dark') === '1'
if (saved !== store.state.ui.dark) store.state.ui.dark = saved
applyTheme(store.state.ui.dark)

// keep in sync with store changes
store.watch(
  (s) => s.ui.dark,
  (isDark) => {
    applyTheme(isDark)
    localStorage.setItem('dark', isDark ? '1' : '0')
  },
)

app.use(store).use(router).mount('#app')
