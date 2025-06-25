import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ModuleConfig } from '@/types'
import { CORE_VERSION } from '@/constants/version'
import semver from 'semver'

export interface ModuleDependency {
  moduleKey: string
  version?: string
  optional?: boolean
}

export interface ModuleHooks {
  beforeLoad?: () => Promise<void> | void
  afterLoad?: () => Promise<void> | void
  beforeUnload?: () => Promise<void> | void
  afterUnload?: () => Promise<void> | void
  onError?: (error: Error) => Promise<void> | void
  onHealthCheck?: () => Promise<boolean> | boolean
}

export interface ModuleHealthMetrics {
  moduleKey: string
  status: 'healthy' | 'warning' | 'error' | 'unknown'
  lastCheck: string
  responseTime: number
  errorCount: number
  warningCount: number
  uptime: number
  memoryUsage?: number
  details: {
    loadTime: number
    routeCount: number
    widgetStatus: 'ok' | 'error' | 'none'
    lastError?: string
    lastWarning?: string
  }
}

export interface ModuleLifecycleEvent {
  id: string
  moduleKey: string
  event: 'load' | 'unload' | 'reload' | 'error' | 'health-check'
  timestamp: string
  data?: any
  success: boolean
  duration?: number
}

export interface EnhancedModuleConfig extends ModuleConfig {
  dependencies?: ModuleDependency[]
  hooks?: ModuleHooks
  hotReload?: boolean
  healthCheck?: {
    enabled: boolean
    interval: number
    timeout: number
  }
}

export const useModuleLifecycleStore = defineStore('moduleLifecycle', () => {
  // State
  const modules = ref<Map<string, EnhancedModuleConfig>>(new Map())
  const healthMetrics = ref<Map<string, ModuleHealthMetrics>>(new Map())
  const lifecycleEvents = ref<ModuleLifecycleEvent[]>([])
  const dependencyGraph = ref<Map<string, string[]>>(new Map())
  const loadOrder = ref<string[]>([])
  const hotReloadEnabled = ref(true)
  const healthMonitoringEnabled = ref(true)
  const healthCheckInterval = ref(30000) // 30 seconds

  // Health monitoring intervals
  const healthCheckIntervals = new Map<string, NodeJS.Timeout>()

  // Computed
  const moduleCount = computed(() => modules.value.size)
  const healthyModules = computed(() => 
    Array.from(healthMetrics.value.values()).filter(m => m.status === 'healthy').length
  )
  const unhealthyModules = computed(() => 
    Array.from(healthMetrics.value.values()).filter(m => m.status === 'error').length
  )
  const warningModules = computed(() => 
    Array.from(healthMetrics.value.values()).filter(m => m.status === 'warning').length
  )

  const systemHealth = computed(() => {
    const total = healthMetrics.value.size
    if (total === 0) return 'unknown'
    
    const healthy = healthyModules.value
    const unhealthy = unhealthyModules.value
    
    if (unhealthy > 0) return 'error'
    if (warningModules.value > 0) return 'warning'
    if (healthy === total) return 'healthy'
    return 'unknown'
  })

  // Actions
  const registerModule = async (moduleKey: string, config: EnhancedModuleConfig): Promise<boolean> => {
    const startTime = Date.now()
    
    try {
      // Validate dependencies first
      if (config.dependencies) {
        const dependencyCheck = await validateDependencies(moduleKey, config.dependencies)
        if (!dependencyCheck.valid) {
          throw new Error(`Dependency validation failed: ${dependencyCheck.errors.join(', ')}`)
        }
      }

      // Execute pre-load hooks
      if (config.hooks?.beforeLoad) {
        await config.hooks.beforeLoad()
      }

      // Register module
      modules.value.set(moduleKey, config)
      
      // Update dependency graph
      updateDependencyGraph(moduleKey, config.dependencies || [])
      
      // Initialize health metrics
      initializeHealthMetrics(moduleKey, config)
      
      // Start health monitoring if enabled
      if (config.healthCheck?.enabled !== false && healthMonitoringEnabled.value) {
        startHealthMonitoring(moduleKey, config)
      }

      // Execute post-load hooks
      if (config.hooks?.afterLoad) {
        await config.hooks.afterLoad()
      }

      // Log lifecycle event
      logLifecycleEvent({
        moduleKey,
        event: 'load',
        success: true,
        duration: Date.now() - startTime
      })

      console.info(`✅ Module '${moduleKey}' registered successfully`)
      return true

    } catch (error) {
      // Execute error hooks
      if (config.hooks?.onError) {
        await config.hooks.onError(error as Error)
      }

      // Log error event
      logLifecycleEvent({
        moduleKey,
        event: 'error',
        success: false,
        duration: Date.now() - startTime,
        data: { error: (error as Error).message }
      })

      console.error(`❌ Failed to register module '${moduleKey}':`, error)
      return false
    }
  }

  const unregisterModule = async (moduleKey: string): Promise<boolean> => {
    const startTime = Date.now()
    const config = modules.value.get(moduleKey)
    
    if (!config) {
      console.warn(`Module '${moduleKey}' not found for unregistration`)
      return false
    }

    try {
      // Execute pre-unload hooks
      if (config.hooks?.beforeUnload) {
        await config.hooks.beforeUnload()
      }

      // Stop health monitoring
      stopHealthMonitoring(moduleKey)

      // Remove from dependency graph
      dependencyGraph.value.delete(moduleKey)
      
      // Remove health metrics
      healthMetrics.value.delete(moduleKey)
      
      // Remove module
      modules.value.delete(moduleKey)

      // Execute post-unload hooks
      if (config.hooks?.afterUnload) {
        await config.hooks.afterUnload()
      }

      // Log lifecycle event
      logLifecycleEvent({
        moduleKey,
        event: 'unload',
        success: true,
        duration: Date.now() - startTime
      })

      console.info(`✅ Module '${moduleKey}' unregistered successfully`)
      return true

    } catch (error) {
      // Execute error hooks
      if (config.hooks?.onError) {
        await config.hooks.onError(error as Error)
      }

      // Log error event
      logLifecycleEvent({
        moduleKey,
        event: 'error',
        success: false,
        duration: Date.now() - startTime,
        data: { error: (error as Error).message }
      })

      console.error(`❌ Failed to unregister module '${moduleKey}':`, error)
      return false
    }
  }

  const reloadModule = async (moduleKey: string): Promise<boolean> => {
    const startTime = Date.now()
    
    if (!hotReloadEnabled.value) {
      console.warn(`Hot reload is disabled for module '${moduleKey}'`)
      return false
    }

    const config = modules.value.get(moduleKey)
    if (!config || config.hotReload === false) {
      console.warn(`Module '${moduleKey}' does not support hot reload`)
      return false
    }

    try {
      console.info(`🔄 Hot reloading module '${moduleKey}'...`)

      // Unregister first
      await unregisterModule(moduleKey)
      
      // Clear module cache (in a real implementation, you'd clear import cache)
      // This is a simplified version for demonstration
      
      // Re-import and register module
      const moduleFiles = import.meta.glob('../modules/*/module.config.ts', { eager: false })
      const modulePath = Object.keys(moduleFiles).find(path => path.includes(`/modules/${moduleKey}/`))
      
      if (modulePath) {
        const importFn = moduleFiles[modulePath]
        const moduleExport = await importFn()
        const newConfig = moduleExport.default || moduleExport.config
        
        if (newConfig) {
          await registerModule(moduleKey, newConfig)
          
          // Log reload event
          logLifecycleEvent({
            moduleKey,
            event: 'reload',
            success: true,
            duration: Date.now() - startTime
          })

          console.info(`✅ Module '${moduleKey}' hot reloaded successfully`)
          return true
        }
      }

      throw new Error('Failed to re-import module configuration')

    } catch (error) {
      // Log error event
      logLifecycleEvent({
        moduleKey,
        event: 'error',
        success: false,
        duration: Date.now() - startTime,
        data: { error: (error as Error).message }
      })

      console.error(`❌ Failed to hot reload module '${moduleKey}':`, error)
      return false
    }
  }

  const validateDependencies = async (
    moduleKey: string, 
    dependencies: ModuleDependency[]
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> => {
    const result = { valid: true, errors: [] as string[], warnings: [] as string[] }

    for (const dep of dependencies) {
      const depModule = modules.value.get(dep.moduleKey)
      
      if (!depModule) {
        if (dep.optional) {
          result.warnings.push(`Optional dependency '${dep.moduleKey}' not found`)
        } else {
          result.errors.push(`Required dependency '${dep.moduleKey}' not found`)
          result.valid = false
        }
        continue
      }

      // Check version compatibility if specified
      if (dep.version && depModule.version) {
        try {
          const isCompatible = semver.satisfies(depModule.version, dep.version)
          if (!isCompatible) {
            result.errors.push(
              `Dependency '${dep.moduleKey}' version ${depModule.version} does not satisfy ${dep.version}`
            )
            result.valid = false
          }
        } catch (error) {
          result.warnings.push(`Invalid version range for dependency '${dep.moduleKey}': ${dep.version}`)
        }
      }
    }

    return result
  }

  const updateDependencyGraph = (moduleKey: string, dependencies: ModuleDependency[]) => {
    const deps = dependencies.map(d => d.moduleKey)
    dependencyGraph.value.set(moduleKey, deps)
    
    // Recalculate load order
    calculateLoadOrder()
  }

  const calculateLoadOrder = () => {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (moduleKey: string) => {
      if (visiting.has(moduleKey)) {
        throw new Error(`Circular dependency detected involving module '${moduleKey}'`)
      }
      
      if (visited.has(moduleKey)) {
        return
      }

      visiting.add(moduleKey)
      
      const deps = dependencyGraph.value.get(moduleKey) || []
      for (const dep of deps) {
        if (modules.value.has(dep)) {
          visit(dep)
        }
      }
      
      visiting.delete(moduleKey)
      visited.add(moduleKey)
      order.push(moduleKey)
    }

    try {
      for (const moduleKey of modules.value.keys()) {
        visit(moduleKey)
      }
      loadOrder.value = order
    } catch (error) {
      console.error('Failed to calculate module load order:', error)
    }
  }

  const initializeHealthMetrics = (moduleKey: string, config: EnhancedModuleConfig) => {
    const metrics: ModuleHealthMetrics = {
      moduleKey,
      status: 'unknown',
      lastCheck: new Date().toISOString(),
      responseTime: 0,
      errorCount: 0,
      warningCount: 0,
      uptime: Date.now(),
      details: {
        loadTime: 0,
        routeCount: 0,
        widgetStatus: config.hasWidget ? 'unknown' : 'none'
      }
    }
    
    healthMetrics.value.set(moduleKey, metrics)
  }

  const startHealthMonitoring = (moduleKey: string, config: EnhancedModuleConfig) => {
    const interval = config.healthCheck?.interval || healthCheckInterval.value
    
    const intervalId = setInterval(async () => {
      await performHealthCheck(moduleKey)
    }, interval)
    
    healthCheckIntervals.set(moduleKey, intervalId)
    
    // Perform initial health check
    performHealthCheck(moduleKey)
  }

  const stopHealthMonitoring = (moduleKey: string) => {
    const intervalId = healthCheckIntervals.get(moduleKey)
    if (intervalId) {
      clearInterval(intervalId)
      healthCheckIntervals.delete(moduleKey)
    }
  }

  const performHealthCheck = async (moduleKey: string): Promise<void> => {
    const startTime = Date.now()
    const config = modules.value.get(moduleKey)
    const metrics = healthMetrics.value.get(moduleKey)
    
    if (!config || !metrics) return

    try {
      let isHealthy = true
      
      // Execute custom health check if provided
      if (config.hooks?.onHealthCheck) {
        isHealthy = await config.hooks.onHealthCheck()
      }
      
      // Update metrics
      const responseTime = Date.now() - startTime
      const updatedMetrics: ModuleHealthMetrics = {
        ...metrics,
        status: isHealthy ? 'healthy' : 'warning',
        lastCheck: new Date().toISOString(),
        responseTime,
        details: {
          ...metrics.details,
          loadTime: responseTime
        }
      }
      
      healthMetrics.value.set(moduleKey, updatedMetrics)
      
      // Log health check event
      logLifecycleEvent({
        moduleKey,
        event: 'health-check',
        success: isHealthy,
        duration: responseTime,
        data: { status: updatedMetrics.status }
      })

    } catch (error) {
      // Update metrics with error status
      const updatedMetrics: ModuleHealthMetrics = {
        ...metrics,
        status: 'error',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        errorCount: metrics.errorCount + 1,
        details: {
          ...metrics.details,
          lastError: (error as Error).message
        }
      }
      
      healthMetrics.value.set(moduleKey, updatedMetrics)
      
      // Execute error hooks
      if (config.hooks?.onError) {
        await config.hooks.onError(error as Error)
      }
      
      console.error(`❌ Health check failed for module '${moduleKey}':`, error)
    }
  }

  const logLifecycleEvent = (event: Omit<ModuleLifecycleEvent, 'id' | 'timestamp'>) => {
    const lifecycleEvent: ModuleLifecycleEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    }
    
    lifecycleEvents.value.unshift(lifecycleEvent)
    
    // Keep only last 1000 events
    if (lifecycleEvents.value.length > 1000) {
      lifecycleEvents.value = lifecycleEvents.value.slice(0, 1000)
    }
  }

  const getModuleHealth = (moduleKey: string): ModuleHealthMetrics | undefined => {
    return healthMetrics.value.get(moduleKey)
  }

  const getAllHealthMetrics = (): ModuleHealthMetrics[] => {
    return Array.from(healthMetrics.value.values())
  }

  const getLifecycleEvents = (moduleKey?: string, limit = 100): ModuleLifecycleEvent[] => {
    let events = lifecycleEvents.value
    
    if (moduleKey) {
      events = events.filter(e => e.moduleKey === moduleKey)
    }
    
    return events.slice(0, limit)
  }

  const enableHotReload = () => {
    hotReloadEnabled.value = true
    console.info('🔥 Hot reload enabled')
  }

  const disableHotReload = () => {
    hotReloadEnabled.value = false
    console.info('❄️ Hot reload disabled')
  }

  const enableHealthMonitoring = () => {
    healthMonitoringEnabled.value = true
    
    // Start monitoring for all modules
    for (const [moduleKey, config] of modules.value.entries()) {
      if (config.healthCheck?.enabled !== false) {
        startHealthMonitoring(moduleKey, config)
      }
    }
    
    console.info('💚 Health monitoring enabled')
  }

  const disableHealthMonitoring = () => {
    healthMonitoringEnabled.value = false
    
    // Stop all health monitoring
    for (const moduleKey of modules.value.keys()) {
      stopHealthMonitoring(moduleKey)
    }
    
    console.info('💔 Health monitoring disabled')
  }

  const getSystemStatus = () => {
    return {
      totalModules: moduleCount.value,
      healthyModules: healthyModules.value,
      unhealthyModules: unhealthyModules.value,
      warningModules: warningModules.value,
      systemHealth: systemHealth.value,
      hotReloadEnabled: hotReloadEnabled.value,
      healthMonitoringEnabled: healthMonitoringEnabled.value,
      lastEvents: getLifecycleEvents(undefined, 10)
    }
  }

  const cleanup = () => {
    // Stop all health monitoring
    for (const moduleKey of modules.value.keys()) {
      stopHealthMonitoring(moduleKey)
    }
    
    // Clear all data
    modules.value.clear()
    healthMetrics.value.clear()
    lifecycleEvents.value = []
    dependencyGraph.value.clear()
    loadOrder.value = []
  }

  return {
    // State
    modules,
    healthMetrics,
    lifecycleEvents,
    dependencyGraph,
    loadOrder,
    hotReloadEnabled,
    healthMonitoringEnabled,
    
    // Computed
    moduleCount,
    healthyModules,
    unhealthyModules,
    warningModules,
    systemHealth,
    
    // Actions
    registerModule,
    unregisterModule,
    reloadModule,
    validateDependencies,
    performHealthCheck,
    getModuleHealth,
    getAllHealthMetrics,
    getLifecycleEvents,
    enableHotReload,
    disableHotReload,
    enableHealthMonitoring,
    disableHealthMonitoring,
    getSystemStatus,
    cleanup
  }
})