import type { ModuleConfig } from '@/types'

const config: ModuleConfig = {
  name: 'Goal Management',
  routePrefix: 'goals',
  rolesAllowed: ['coach', 'coachee'],
  hasWidget: true,
  version: '1.0.0',
  compatibleWithCore: '^1.0.0',
  description: 'Manage and track goals for coaching sessions',
  author: 'System',
  
  routes: async () => {
    return [
      {
        path: '',
        name: 'Goals',
        component: () => import('./views/GoalsView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  
  widget: async () => {
    return import('./components/GoalsWidget.vue')
  }
}

export default config