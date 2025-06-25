import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router, { loadModuleRoutes } from './router'
import { moduleRegistry } from './core/registry'
import { useAuthStore } from './core/authStore'
import { HotReloadSystem } from './core/hotReloa'

async function initApp() {
  try {
    const app = createApp(App)
    
    // Setup Pinia
    const pinia = createPinia()
    app.use(pinia)
    
    // Initialize auth store
    const authStore = useAuthStore()
    await authStore.initAuth()
    
    // Load modules
    console.info('🔄 Loading modules...')
    await moduleRegistry.loadModules()
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
  }
}

initApp()