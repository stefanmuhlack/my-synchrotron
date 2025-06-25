import type { ModuleConfig, UserRole } from '@/types'
import { VALID_ROLES } from '@/types'
import { useModulesStore } from '@/stores/modules'
import { CORE_VERSION } from '@/constants/version'
import semver from 'semver'

export interface ModuleValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface LoadedModule {
  key: string
  config: ModuleConfig
  validation: ModuleValidationResult
}

export interface VersionCompatibilityResult {
  compatible: boolean
  reason?: string
  warning?: string
}

export interface ModuleLoadingSummary {
  totalFound: number
  totalLoaded: number
  totalSkipped: number
  skippedModules: Array<{
    key: string
    name: string
    reason: string
    requiredVersion?: string
  }>
  loadedModules: Array<{
    key: string
    name: string
    version?: string
  }>
}

export class ModuleRegistry {
  private static instance: ModuleRegistry
  private modules: Map<string, ModuleConfig> = new Map()
  private validationResults: Map<string, ModuleValidationResult> = new Map()
  private loadingSummary: ModuleLoadingSummary = {
    totalFound: 0,
    totalLoaded: 0,
    totalSkipped: 0,
    skippedModules: [],
    loadedModules: []
  }

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry()
    }
    return ModuleRegistry.instance
  }

  /**
   * Dynamically load and validate all modules from their configuration files
   */
  async loadModules(): Promise<LoadedModule[]> {
    const modulesStore = useModulesStore()
    const loadedModules: LoadedModule[] = []
    
    // Reset loading summary
    this.loadingSummary = {
      totalFound: 0,
      totalLoaded: 0,
      totalSkipped: 0,
      skippedModules: [],
      loadedModules: []
    }
    
    console.info('🔄 Starting module discovery and validation...')
    console.info(`📋 Core version: ${CORE_VERSION}`)
    
    // Use import.meta.glob to dynamically discover modules
    const moduleFiles = import.meta.glob('../modules/*/module.config.ts', { eager: false })
    
    if (Object.keys(moduleFiles).length === 0) {
      console.warn('⚠️  No modules found in src/modules/')
      this.handleNoModulesFound()
      return loadedModules
    }

    this.loadingSummary.totalFound = Object.keys(moduleFiles).length
    console.info(`📦 Found ${this.loadingSummary.totalFound} potential modules`)

    // Load and validate each module
    const loadPromises = Object.entries(moduleFiles).map(async ([path, importFn]) => {
      const moduleKey = this.extractModuleKey(path)
      
      try {
        const loadedModule = await this.loadAndValidateModule(moduleKey, importFn)
        
        // Check version compatibility first
        const compatibilityResult = this.checkVersionCompatibility(loadedModule.config)
        
        if (!compatibilityResult.compatible) {
          console.warn(`⚠️  Module '${moduleKey}' skipped: ${compatibilityResult.reason}`)
          this.loadingSummary.skippedModules.push({
            key: moduleKey,
            name: loadedModule.config.name || moduleKey,
            reason: compatibilityResult.reason || 'Version incompatible',
            requiredVersion: loadedModule.config.compatibleWithCore
          })
          this.loadingSummary.totalSkipped++
          
          // Set error in modules store but don't register the module
          modulesStore.setModuleError(moduleKey, compatibilityResult.reason || 'Version incompatible')
          return null
        }
        
        if (loadedModule.validation.isValid) {
          // Register valid and compatible modules
          this.modules.set(moduleKey, loadedModule.config)
          modulesStore.registerModule(moduleKey, loadedModule.config)
          
          this.loadingSummary.loadedModules.push({
            key: moduleKey,
            name: loadedModule.config.name || moduleKey,
            version: loadedModule.config.version
          })
          this.loadingSummary.totalLoaded++
          
          console.info(`✅ Module '${moduleKey}' loaded successfully`)
          
          if (compatibilityResult.warning) {
            console.warn(`⚠️  ${compatibilityResult.warning}`)
          }
        } else {
          // Log validation errors
          console.error(`❌ Module '${moduleKey}' validation failed:`, loadedModule.validation.errors)
          modulesStore.setModuleError(moduleKey, loadedModule.validation.errors.join('; '))
          
          this.loadingSummary.skippedModules.push({
            key: moduleKey,
            name: loadedModule.config.name || moduleKey,
            reason: 'Validation failed: ' + loadedModule.validation.errors.join(', ')
          })
          this.loadingSummary.totalSkipped++
        }
        
        // Log warnings if any
        if (loadedModule.validation.warnings.length > 0) {
          console.warn(`⚠️  Module '${moduleKey}' has warnings:`, loadedModule.validation.warnings)
        }
        
        this.validationResults.set(moduleKey, loadedModule.validation)
        return loadedModule
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Failed to load module '${moduleKey}':`, errorMessage)
        
        const failedModule: LoadedModule = {
          key: moduleKey,
          config: this.createFallbackConfig(moduleKey),
          validation: {
            isValid: false,
            errors: [`Failed to load module: ${errorMessage}`],
            warnings: []
          }
        }
        
        modulesStore.setModuleError(moduleKey, errorMessage)
        this.validationResults.set(moduleKey, failedModule.validation)
        
        this.loadingSummary.skippedModules.push({
          key: moduleKey,
          name: moduleKey,
          reason: `Load error: ${errorMessage}`
        })
        this.loadingSummary.totalSkipped++
        
        return failedModule
      }
    })
    
    const results = await Promise.allSettled(loadPromises)
    
    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        loadedModules.push(result.value)
      } else if (result.status === 'rejected') {
        const path = Object.keys(moduleFiles)[index]
        const moduleKey = this.extractModuleKey(path)
        console.error(`❌ Promise rejected for module '${moduleKey}':`, result.reason)
      }
    })
    
    // Display comprehensive summary
    this.displayLoadingSummary()
    
    // Handle critical scenarios
    this.handleLoadingResults()
    
    return loadedModules
  }

  /**
   * Check version compatibility using semver
   */
  private checkVersionCompatibility(config: ModuleConfig): VersionCompatibilityResult {
    // If no compatibility specified, assume compatible
    if (!config.compatibleWithCore) {
      return { 
        compatible: true,
        warning: `Module '${config.name}' does not specify core compatibility - assuming compatible`
      }
    }

    try {
      // Use semver to check compatibility
      const isCompatible = semver.satisfies(CORE_VERSION, config.compatibleWithCore)
      
      if (isCompatible) {
        return {
          compatible: true,
          warning: `Module '${config.name}' requires core ${config.compatibleWithCore}, current is ${CORE_VERSION} - compatible`
        }
      } else {
        return {
          compatible: false,
          reason: `Module '${config.name}' requires core version ${config.compatibleWithCore}, but current version is ${CORE_VERSION}`
        }
      }
    } catch (error) {
      // If semver parsing fails, log warning but allow loading
      console.warn(`⚠️  Invalid semver range '${config.compatibleWithCore}' in module '${config.name}' - allowing load`)
      return {
        compatible: true,
        warning: `Module '${config.name}' has invalid semver range '${config.compatibleWithCore}' - please fix`
      }
    }
  }

  /**
   * Display comprehensive loading summary
   */
  private displayLoadingSummary(): void {
    console.info('\n📊 Module Loading Summary:')
    console.info(`   📦 Found: ${this.loadingSummary.totalFound} modules`)
    console.info(`   ✅ Loaded: ${this.loadingSummary.totalLoaded} modules`)
    console.info(`   ⚠️  Skipped: ${this.loadingSummary.totalSkipped} modules`)
    
    if (this.loadingSummary.loadedModules.length > 0) {
      console.info('\n✅ Successfully Loaded Modules:')
      this.loadingSummary.loadedModules.forEach(module => {
        const versionInfo = module.version ? ` (v${module.version})` : ''
        console.info(`   • ${module.name}${versionInfo}`)
      })
    }
    
    if (this.loadingSummary.skippedModules.length > 0) {
      console.warn('\n⚠️  Skipped Modules:')
      this.loadingSummary.skippedModules.forEach(module => {
        const versionInfo = module.requiredVersion ? ` (requires ${module.requiredVersion})` : ''
        console.warn(`   • ${module.name}${versionInfo}: ${module.reason}`)
      })
    }
  }

  /**
   * Handle critical loading scenarios
   */
  private handleLoadingResults(): void {
    const loadedCount = this.loadingSummary.totalLoaded
    const totalFound = this.loadingSummary.totalFound
    
    if (loadedCount === 0 && totalFound > 0) {
      // No modules loaded but modules were found
      const versionIssues = this.loadingSummary.skippedModules.filter(m => 
        m.reason.includes('version') || m.reason.includes('compatible')
      )
      
      if (versionIssues.length > 0) {
        console.error('\n🚨 CRITICAL: No compatible modules loaded!')
        console.error('   All modules were skipped due to version incompatibility.')
        console.error('   Please upgrade modules or core system.')
        console.error('\n💡 Solutions:')
        console.error('   1. Update module versions to be compatible with core v' + CORE_VERSION)
        console.error('   2. Update core system to support existing modules')
        console.error('   3. Check module.config.ts files for correct compatibleWithCore values')
      } else {
        console.error('\n🚨 CRITICAL: No modules loaded!')
        console.error('   All modules failed validation or loading.')
        console.error('   Please check module configurations and fix errors.')
      }
    } else if (loadedCount < totalFound / 2) {
      // More than half of modules failed to load
      console.warn('\n⚠️  WARNING: Many modules failed to load')
      console.warn(`   Only ${loadedCount} out of ${totalFound} modules loaded successfully.`)
      console.warn('   Consider reviewing module configurations and compatibility.')
    } else if (loadedCount > 0) {
      // Some modules loaded successfully
      console.info(`\n🎉 Module system initialized with ${loadedCount} modules`)
    }
  }

  /**
   * Handle case when no modules are found
   */
  private handleNoModulesFound(): void {
    console.warn('\n⚠️  No modules found in src/modules/ directory')
    console.warn('   The application will run with core functionality only.')
    console.warn('\n💡 To add modules:')
    console.warn('   1. Create module directories in src/modules/')
    console.warn('   2. Add module.config.ts files with proper configuration')
    console.warn('   3. Restart the development server')
  }

  /**
   * Load and validate a single module
   */
  private async loadAndValidateModule(moduleKey: string, importFn: () => Promise<any>): Promise<LoadedModule> {
    // Import the module
    const moduleExport = await importFn()
    const config = moduleExport.default || moduleExport.config
    
    if (!config) {
      throw new Error('Module does not export a default configuration object')
    }
    
    // Validate the configuration
    const validation = this.validateModuleConfig(config)
    
    return {
      key: moduleKey,
      config,
      validation
    }
  }

  /**
   * Validate module configuration against required schema with robust role checking
   */
  private validateModuleConfig(config: any): ModuleValidationResult {
    const result: ModuleValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Check required fields
    const requiredFields = ['name', 'routePrefix', 'rolesAllowed', 'hasWidget']
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        result.errors.push(`Missing required field: ${field}`)
        result.isValid = false
      }
    }

    // Validate field types and values
    if (config.name !== undefined) {
      if (typeof config.name !== 'string' || config.name.trim() === '') {
        result.errors.push('Field "name" must be a non-empty string')
        result.isValid = false
      }
    }

    if (config.routePrefix !== undefined) {
      if (typeof config.routePrefix !== 'string' || config.routePrefix.trim() === '') {
        result.errors.push('Field "routePrefix" must be a non-empty string')
        result.isValid = false
      }
    }

    // Robust role validation
    if (config.rolesAllowed !== undefined) {
      if (!Array.isArray(config.rolesAllowed)) {
        result.errors.push('Field "rolesAllowed" must be an array')
        result.isValid = false
      } else if (config.rolesAllowed.length === 0) {
        result.errors.push('Field "rolesAllowed" must contain at least one role')
        result.isValid = false
      } else {
        // Validate roles against VALID_ROLES
        const invalidRoles = config.rolesAllowed.filter((role: any) => 
          typeof role !== 'string' || !VALID_ROLES.includes(role as UserRole)
        )
        if (invalidRoles.length > 0) {
          result.errors.push(`Invalid roles in "rolesAllowed": ${invalidRoles.join(', ')}. Valid roles: ${VALID_ROLES.join(', ')}`)
          result.isValid = false
        }
      }
    }

    if (config.hasWidget !== undefined && typeof config.hasWidget !== 'boolean') {
      result.errors.push('Field "hasWidget" must be a boolean')
      result.isValid = false
    }

    // Validate hasDashboardWidget (alternative naming)
    if (config.hasDashboardWidget !== undefined && typeof config.hasDashboardWidget !== 'boolean') {
      result.errors.push('Field "hasDashboardWidget" must be a boolean')
      result.isValid = false
    }

    // Validate routes function
    if (config.routes !== undefined) {
      if (typeof config.routes !== 'function') {
        result.errors.push('Field "routes" must be a function')
        result.isValid = false
      }
    } else {
      result.warnings.push('No routes function provided - module will not register any routes')
    }

    // Validate widget consistency
    const hasWidgetFlag = config.hasWidget || config.hasDashboardWidget
    const hasWidgetFunction = !!(config.widget || config.dashboardWidget)

    if (hasWidgetFlag && !hasWidgetFunction) {
      result.errors.push('Module declares hasWidget/hasDashboardWidget as true but no widget/dashboardWidget function provided')
      result.isValid = false
    }

    if (!hasWidgetFlag && hasWidgetFunction) {
      result.warnings.push('Module provides widget function but hasWidget/hasDashboardWidget is not true')
    }

    // Validate widget function
    if (config.widget !== undefined && typeof config.widget !== 'function') {
      result.errors.push('Field "widget" must be a function')
      result.isValid = false
    }

    if (config.dashboardWidget !== undefined && typeof config.dashboardWidget !== 'function') {
      result.errors.push('Field "dashboardWidget" must be a function')
      result.isValid = false
    }

    // Validate optional fields
    const optionalStringFields = ['description', 'version', 'author', 'compatibleWithCore']
    for (const field of optionalStringFields) {
      if (config[field] !== undefined && typeof config[field] !== 'string') {
        result.errors.push(`Field "${field}" must be a string`)
        result.isValid = false
      }
    }

    // Validate version format if provided
    if (config.version) {
      if (!semver.valid(config.version)) {
        result.warnings.push(`Module version "${config.version}" is not a valid semver format`)
      }
    }

    // Validate compatibleWithCore format if provided
    if (config.compatibleWithCore) {
      try {
        semver.validRange(config.compatibleWithCore)
      } catch (error) {
        result.warnings.push(`compatibleWithCore "${config.compatibleWithCore}" is not a valid semver range`)
      }
    }

    return result
  }

  /**
   * Extract module key from file path
   */
  private extractModuleKey(path: string): string {
    const match = path.match(/\/modules\/([^/]+)\//)
    return match ? match[1] : 'unknown'
  }

  /**
   * Create a fallback configuration for failed modules
   */
  private createFallbackConfig(moduleKey: string): ModuleConfig {
    return {
      name: `Failed Module: ${moduleKey}`,
      routePrefix: moduleKey,
      rolesAllowed: ['admin'], // Safe fallback
      hasWidget: false,
      description: 'This module failed to load properly'
    }
  }

  /**
   * Get loading summary
   */
  getLoadingSummary(): ModuleLoadingSummary {
    return { ...this.loadingSummary }
  }

  /**
   * Get a specific module configuration
   */
  getModule(key: string): ModuleConfig | undefined {
    return this.modules.get(key)
  }

  /**
   * Get all loaded modules
   */
  getAllModules(): Map<string, ModuleConfig> {
    return new Map(this.modules)
  }

  /**
   * Get validation results for all modules
   */
  getValidationResults(): Map<string, ModuleValidationResult> {
    return new Map(this.validationResults)
  }

  /**
   * Get validation result for a specific module
   */
  getModuleValidation(key: string): ModuleValidationResult | undefined {
    return this.validationResults.get(key)
  }

  /**
   * Check if a module is valid
   */
  isModuleValid(key: string): boolean {
    const validation = this.validationResults.get(key)
    return validation ? validation.isValid : false
  }

  /**
   * Get count of valid modules
   */
  getValidModuleCount(): number {
    return Array.from(this.validationResults.values()).filter(v => v.isValid).length
  }

  /**
   * Get count of invalid modules
   */
  getInvalidModuleCount(): number {
    return Array.from(this.validationResults.values()).filter(v => !v.isValid).length
  }

  /**
   * Clear all modules (useful for testing or reloading)
   */
  clear(): void {
    this.modules.clear()
    this.validationResults.clear()
    this.loadingSummary = {
      totalFound: 0,
      totalLoaded: 0,
      totalSkipped: 0,
      skippedModules: [],
      loadedModules: []
    }
  }
}

// Export singleton instance
export const moduleRegistry = ModuleRegistry.getInstance()