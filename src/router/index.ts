import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/core/authStore';
import type { UserRole } from '@/types';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/components/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('@/components/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/components/Admin.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' as UserRole }
    },
    {
      path: '/unauthorized',
      name: 'Unauthorized',
      component: () => import('@/components/Unauthorized.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/components/NotFound.vue')
    }
  ]
});

// Global navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  
  // Initialize auth if not done
  if (!authStore.user && to.meta.requiresAuth) {
    await authStore.initAuth();
  }
  
  // Check authentication
  if (to.meta.requiresAuth && !authStore.user) {
    next('/login');
    return;
  }
  
  // Check role-based access
  if (to.meta.requiresRole && !authStore.hasRole(to.meta.requiresRole as UserRole)) {
    next('/unauthorized');
    return;
  }
  
  if (to.meta.requiresAnyRole && !authStore.hasAnyRole(to.meta.requiresAnyRole as UserRole[])) {
    next('/unauthorized');
    return;
  }
  
  // Redirect to dashboard if accessing login while authenticated
  if (to.name === 'Login' && authStore.user) {
    next('/');
    return;
  }
  
  next();
});

// Dynamic route loading
export const loadModuleRoutes = async () => {
  try {
    const { useModulesStore } = await import('@/stores/modules');
    const modulesStore = useModulesStore();
    
    const moduleRoutes = await modulesStore.getModuleRoutes();
    
    moduleRoutes.forEach(route => {
      router.addRoute(route);
    });
    
    console.info(`✅ Loaded ${moduleRoutes.length} module routes`);
  } catch (error) {
    console.error('Failed to load module routes:', error);
  }
};

export default router;