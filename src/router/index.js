import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../pages/DashboardPage.vue';
import NotificationsPage from '../pages/NotificationsPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage },
    { path: '/notifications', name: 'notifications', component: NotificationsPage },
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
