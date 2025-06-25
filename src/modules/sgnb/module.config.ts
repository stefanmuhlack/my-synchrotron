import type { ModuleConfig } from '@/types'

const config: ModuleConfig = {
  name: 'SGNB Management',
  routePrefix: 'sgnb',
  rolesAllowed: ['coach', 'admin'],
  hasWidget: true,
  version: '1.0.0',
  compatibleWithCore: '^1.0.0',
  description: 'Systematic Goal-oriented Needs-based Coaching (SGNB) management system',
  author: 'System',
  
  routes: async () => {
    return [
      {
        path: '',
        name: 'SGNB',
        component: () => import('./views/SGNBView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/goals',
        name: 'SGNBGoals',
        component: () => import('./views/GoalsView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/actions',
        name: 'SGNBActions',
        component: () => import('./views/ActionsView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  
  widget: async () => {
    return import('./components/SGNBWidget.vue')
  }
}

export default config