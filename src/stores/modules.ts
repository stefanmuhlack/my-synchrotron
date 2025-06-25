import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ModuleState, ModuleConfig } from '@/types';
import { validateRoles } from '@/types';
import { useAuthStore } from '@/core/authStore';

export const useModulesStore = defineStore('modules', () => {
  const modules = ref<Record<string, ModuleState>>({});
  const loading = ref(false);

  const authStore = useAuthStore();

  const enabledModules = computed(() => {
    return Object.entries(modules.value)
      .filter(([_, module]) => module.enabled && !module.error)
      .map(([key, module]) => ({ key, ...module }));
  });

  const userAccessibleModules = computed(() => {
    if (!authStore.user) return [];
    
    const userRole = authStore.user.role;
    
    return enabledModules.value.filter(module => {
      try {
        // Robust role checking with fallback
        const moduleRoles = module.config.rolesAllowed || [];
        const validModuleRoles = validateRoles(moduleRoles);
        
        // Check if user's role is allowed for this module
        const roleAllowed = validModuleRoles.includes(userRole);
        
        // For non-admin users, also check module permissions
        if (userRole !== 'admin' && authStore.user!.modulePermissions) {
          const modulePermissionGranted = authStore.user!.modulePermissions.includes(module.key);
          return roleAllowed && modulePermissionGranted;
        }
        
        // Admin users have access to all modules their role allows
        return roleAllowed;
      } catch (error) {
        console.error(`Error checking module access for ${module.key}:`, error);
        return false;
      }
    });
  });

  const dashboardWidgetModules = computed(() => {
    return userAccessibleModules.value.filter(module => {
      try {
        return module.config.hasWidget;
      } catch (error) {
        console.error(`Error checking widget for ${module.key}:`, error);
        return false;
      }
    });
  });

  const registerModule = (key: string, config: ModuleConfig): void => {
    try {
      if (!key || !config) {
        throw new Error('Invalid module key or config');
      }

      // Validate and sanitize roles
      const validatedConfig: ModuleConfig = {
        ...config,
        rolesAllowed: validateRoles(config.rolesAllowed)
      };

      if (validatedConfig.rolesAllowed.length === 0) {
        console.warn(`Module ${key} has no valid roles, defaulting to admin only`);
        validatedConfig.rolesAllowed = ['admin'];
      }

      modules.value[key] = {
        config: validatedConfig,
        enabled: true,
        installed: true,
        error: null
      };
    } catch (error) {
      console.error(`Failed to register module ${key}:`, error);
      setModuleError(key, error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const toggleModule = (key: string): void => {
    try {
      if (modules.value[key] && !modules.value[key].error) {
        modules.value[key].enabled = !modules.value[key].enabled;
      }
    } catch (error) {
      console.error(`Failed to toggle module ${key}:`, error);
    }
  };

  const deleteModule = (key: string): boolean => {
    try {
      if (!modules.value[key]) {
        console.warn(`Module ${key} not found for deletion`);
        return false;
      }

      // Remove module from registry
      delete modules.value[key];
      
      console.info(`✅ Module '${key}' deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to delete module ${key}:`, error);
      return false;
    }
  };

  const setModuleError = (key: string, error: string): void => {
    if (!modules.value[key]) {
      modules.value[key] = {
        config: {
          name: key,
          routePrefix: key,
          rolesAllowed: ['admin'], // Safe fallback
          hasWidget: false
        },
        enabled: false,
        installed: false,
        error
      };
    } else {
      modules.value[key].error = error;
      modules.value[key].enabled = false;
    }
  };

  const clearModuleError = (key: string): void => {
    if (modules.value[key]) {
      modules.value[key].error = null;
    }
  };

  const getModuleRoutes = async () => {
    const routes = [];
    
    for (const module of userAccessibleModules.value) {
      if (module.config.routes) {
        try {
          const moduleRoutes = await module.config.routes();
          routes.push(...moduleRoutes.map(route => ({
            ...route,
            meta: {
              ...route.meta,
              moduleKey: module.key
            }
          })));
        } catch (error) {
          console.error(`Failed to load routes for module ${module.key}:`, error);
          setModuleError(module.key, `Route loading failed: ${error}`);
        }
      }
    }
    
    return routes;
  };

  const getDashboardWidgets = async () => {
    const widgets = [];
    
    for (const module of dashboardWidgetModules.value) {
      if (module.config.widget) {
        try {
          const widget = await module.config.widget();
          widgets.push({
            key: module.key,
            name: module.config.name,
            component: widget.default || widget
          });
        } catch (error) {
          console.error(`Failed to load widget for module ${module.key}:`, error);
          setModuleError(module.key, `Widget loading failed: ${error}`);
        }
      }
    }
    
    return widgets;
  };

  const getAllAvailableModules = computed(() => {
    return Object.entries(modules.value).map(([key, module]) => ({
      key,
      name: module.config.name,
      description: module.config.description,
      rolesAllowed: module.config.rolesAllowed,
      enabled: module.enabled && !module.error
    }));
  });

  return {
    modules,
    loading,
    enabledModules,
    userAccessibleModules,
    dashboardWidgetModules,
    getAllAvailableModules,
    registerModule,
    toggleModule,
    deleteModule,
    setModuleError,
    clearModuleError,
    getModuleRoutes,
    getDashboardWidgets
  };
});