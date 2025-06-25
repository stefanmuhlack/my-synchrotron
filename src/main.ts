import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router, { loadModuleRoutes } from './router'
import { moduleRegistry } from './core/registry'
import { useAuthStore } from './core/authStore'
import { useModulesStore } from './stores/modules'
import { HotReloadSystem } from './core/hotReloa'

async function initApp() {
  try {
    const app = createApp(App)
    
    // Setup Pinia
    const pinia = createPinia()
    app.use(pinia)
    
    // Initialize auth store and check authentication
    const authStore = useAuthStore()
    await authStore.initAuth()
    
    // Initialize modules store
    const modulesStore = useModulesStore()
    
    // Load modules from both API and local registry
    console.info('🔄 Loading modules...')
    
    try {
      // First try to load from API (backend modules)
      await modulesStore.loadModulesFromAPI()
    } catch (apiError) {
      console.warn('⚠️ Failed to load modules from API, falling back to local registry:', apiError)
      
      // Fallback to local module registry
      await moduleRegistry.loadModules()
    }
    
    console.info('✅ Modules loaded')
    
    // Initialize hot reload system in development mode
    if (import.meta.env.DEV) {
      const hotReloadSystemInstance = HotReloadSystem.getInstance()
      hotReloadSystemInstance.initialize()
    }
    
    // Load module routes
    console.info('🔄 Loading module routes...')
    await loadModuleRoutes()
    console.info('✅ Module routes loaded')
    
    // Setup router
    app.use(router)
    
    app.mount('#app')
    console.info('✅ Application started successfully')
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    
    // Show error to user
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1f2937; color: white; font-family: system-ui;">
        <div style="text-align: center; max-width: 500px; padding: 2rem;">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Failed to Start</h1>
          <p style="margin-bottom: 1rem;">There was an error initializing the application.</p>
          <details style="text-align: left; background: #374151; padding: 1rem; border-radius: 0.5rem;">
            <summary style="cursor: pointer; margin-bottom: 0.5rem;">Error Details</summary>
            <pre style="white-space: pre-wrap; font-size: 0.875rem;">${error instanceof Error ? error.stack : String(error)}</pre>
          </details>
          <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
            Retry
          </button>
        </div>
      </div>
    `
  }
}

initApp()