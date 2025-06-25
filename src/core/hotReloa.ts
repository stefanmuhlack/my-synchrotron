import { watch } from 'vue'
import { useModuleLifecycleStore } from './moduleLifecycle'

/**
 * Hot Module Reloading System
 * 
 * This module sets up hot module reloading for development mode.
 * It watches for changes to module files and automatically reloads
 * the affected modules without requiring a full page refresh.
 */

export class HotReloadSystem {
  private static instance: HotReloadSystem
  private lifecycleStore: ReturnType<typeof useModuleLifecycleStore> | null = null
  private fileWatchers: Map<string, Function> = new Map()
  private isEnabled = true
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): HotReloadSystem {
    if (!HotReloadSystem.instance) {
      HotReloadSystem.instance = new HotReloadSystem()
    }
    return HotReloadSystem.instance
  }

  /**
   * Initialize the hot reload system
   */
  initialize(): void {
    // Initialize the lifecycle store now that Pinia is available
    this.lifecycleStore = useModuleLifecycleStore()
    
    if (import.meta.env.DEV) {
      console.info('🔥 Initializing hot module reload system')
      this.setupModuleWatchers()
      this.watchLifecycleStore()
    } else {
      console.info('Hot module reload is disabled in production mode')
      this.isEnabled = false
    }
  }

  /**
   * Set up watchers for module files
   */
  private setupModuleWatchers(): void {
    // In a real implementation, this would use the Vite HMR API
    // For demonstration, we'll simulate file watching
    
    // Watch for changes to module.config.ts files
    const moduleConfigFiles = import.meta.glob('../modules/*/module.config.ts', { eager: false })
    
    for (const [path] of Object.entries(moduleConfigFiles)) {
      const moduleKey = this.extractModuleKey(path)
      
      // Set up watcher for this module
      this.watchModule(moduleKey, path)
    }
  }

  /**
   * Watch a specific module for changes
   */
  private watchModule(moduleKey: string, path: string): void {
    // In a real implementation, this would use Vite's HMR API
    // For demonstration, we'll use a simulated approach
    
    console.info(`🔍 Watching module: ${moduleKey}`)
    
    // Store the watcher function for later cleanup
    const watcher = () => {
      console.info(`📝 Detected change in module: ${moduleKey}`)
      this.reloadModule(moduleKey)
    }
    
    this.fileWatchers.set(moduleKey, watcher)
    
    // In a real implementation, we would register with Vite HMR here
    // For demonstration, we'll simulate with a mock implementation
    if (import.meta.hot) {
      import.meta.hot.accept(path, () => {
        watcher()
      })
    }
  }

  /**
   * Watch the lifecycle store for changes to enabled status
   */
  private watchLifecycleStore(): void {
    if (!this.lifecycleStore) {
      console.warn('Lifecycle store not initialized, cannot watch for changes')
      return
    }
    
    watch(() => this.lifecycleStore!.hotReloadEnabled, (enabled) => {
      this.isEnabled = enabled
      console.info(`Hot reload ${enabled ? 'enabled' : 'disabled'}`)
    })
  }

  /**
   * Reload a module
   */
  private reloadModule(moduleKey: string): void {
    if (!this.isEnabled) {
      console.warn(`Hot reload is disabled, skipping reload of module: ${moduleKey}`)
      return
    }
    
    if (!this.lifecycleStore) {
      console.error('Lifecycle store not initialized, cannot reload module')
      return
    }
    
    // Debounce reloads to prevent multiple rapid reloads
    if (this.debounceTimers.has(moduleKey)) {
      clearTimeout(this.debounceTimers.get(moduleKey))
    }
    
    this.debounceTimers.set(moduleKey, setTimeout(async () => {
      try {
        console.info(`🔄 Hot reloading module: ${moduleKey}`)
        
        // Reload the module through the lifecycle store
        const success = await this.lifecycleStore!.reloadModule(moduleKey)
        
        if (success) {
          console.info(`✅ Module ${moduleKey} reloaded successfully`)
        } else {
          console.error(`❌ Failed to reload module ${moduleKey}`)
        }
      } catch (error) {
        console.error(`❌ Error reloading module ${moduleKey}:`, error)
      } finally {
        this.debounceTimers.delete(moduleKey)
      }
    }, 300))
  }

  /**
   * Extract module key from file path
   */
  private extractModuleKey(path: string): string {
    const match = path.match(/\/modules\/([^/]+)\//)
    return match ? match[1] : 'unknown'
  }

  /**
   * Enable hot reloading
   */
  enable(): void {
    this.isEnabled = true
    if (this.lifecycleStore) {
      this.lifecycleStore.enableHotReload()
    }
    console.info('🔥 Hot reload enabled')
  }

  /**
   * Disable hot reloading
   */
  disable(): void {
    this.isEnabled = false
    if (this.lifecycleStore) {
      this.lifecycleStore.disableHotReload()
    }
    console.info('❄️ Hot reload disabled')
  }

  /**
   * Clean up watchers
   */
  cleanup(): void {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
    
    // Clear all file watchers
    this.fileWatchers.clear()
    
    console.info('🧹 Hot reload system cleaned up')
  }
}