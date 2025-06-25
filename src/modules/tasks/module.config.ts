import type { ModuleConfig } from '@/types'

const config: ModuleConfig = {
  name: 'Task Management',
  routePrefix: 'tasks',
  rolesAllowed: ['coach', 'coachee'],
  hasWidget: true,
  version: '1.0.0',
  compatibleWithCore: '^1.0.0',
  description: 'Manage and track tasks and assignments',
  author: 'System',
  
  routes: async () => {
    return [
      {
        path: '',
        name: 'Tasks',
        component: () => import('./views/TasksView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  
  widget: async () => {
    return import('./components/TasksWidget.vue')
  }
}

export default config