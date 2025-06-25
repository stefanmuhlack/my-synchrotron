import type { ModuleConfig } from '@/types'

const config: ModuleConfig = {
  name: 'Checklisten',
  routePrefix: 'checklists',
  rolesAllowed: ['user', 'coach', 'admin'],
  hasWidget: true,
  version: '1.0.0',
  compatibleWithCore: '^1.0.0',
  description: 'Manage checklists and templates for coaching processes',
  author: 'System',
  
  routes: async () => {
    return [
      {
        path: '',
        name: 'Checklists',
        component: () => import('./views/MainView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/templates',
        name: 'ChecklistTemplates',
        component: () => import('./views/TemplatesView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  
  widget: async () => {
    return import('./components/Widget.vue')
  }
}

export default config