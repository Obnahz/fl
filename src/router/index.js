import { createRouter, createWebHashHistory } from 'vue-router'
import { usePlayerStore } from '../stores/player'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/tasks', name: 'Tasks', component: () => import('../views/Tasks.vue') },
  { path: '/cultivation', name: 'Cultivation', component: () => import('../views/Cultivation.vue') },
  { path: '/techniques', name: 'Techniques', component: () => import('../views/Techniques.vue') },
  { path: '/sect', name: 'Sect', component: () => import('../views/Sect.vue') },
  { path: '/cave', name: 'Cave', component: () => import('../views/Cave.vue') },
  { path: '/inventory', name: 'Inventory', component: () => import('../views/Inventory.vue') },
  { path: '/exploration', name: 'Exploration', component: () => import('../views/Exploration.vue') },
  { path: '/achievements', name: 'Achievements', component: () => import('../views/Achievements.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue') },
  { path: '/alchemy', name: 'Alchemy', component: () => import('../views/Alchemy.vue') },
  { path: '/dungeon', name: 'Dungeon', component: () => import('../views/Dungeon.vue') },
  { path: '/market', name: 'Market', component: () => import('../views/Market.vue') },
  { path: '/gacha', redirect: '/market' },
  {
    path: '/gm',
    name: 'GM',
    component: () => import('../views/GM.vue'),
    beforeEnter: () => (usePlayerStore().isGMMode ? true : '/cultivation')
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
