import type { ModuleConfig } from '@/types'
import { VALID_ROLES, validateRoles } from '@/types'
import { CORE_VERSION } from '@/constants/version'
import { useModuleStatusStore } from '@/stores/moduleStatus'
import semver from 'semver'

export interface ModuleValidationResult {
  name: string
  moduleKey: string
  version?: string
  compatibleWithCore?: string
  isCompatible: boolean
  valid: boolean
  errors: string[]
  warnings: string[]
  config?: ModuleConfig
  executionTime?: number
  lastRun?: string
}

export interface TestReport {
  totalModules: number
  validModules: number
  invalidModules: number
  compatibleModules: number
  incompatibleModules: number
  warningCount: number
  executionTime: number
  timestamp: string
  coreVersion: string
  results: ModuleValidationResult[]
}

export class ModuleTestRunner {
  private results: ModuleValidationResult[] = []
  private startTime: number = 0
  private moduleStatusStore = useModuleStatusStore()

  async runAllTests(): Promise<TestReport> {
    this.startTime = Date.now()
    this.moduleStatusStore.setTestingStatus(true)
    
    console.log('🔍 Starting enhanced module validation...')
    console.log(`📋 Core version: ${CORE_VERSION}`)
    
    // Use import.meta.glob to discover all module configs
    const moduleFiles = import.meta.glob('../modules/*/module.config.ts', { eager: false })
    
    if (Object.keys(moduleFiles).length === 0) {
      console.log('⚠️  No modules found in src/modules/')
      this.moduleStatusStore.setTestingStatus(false)
      return this.generateReport([])
    }

    console.log(`📦 Found ${Object.keys(moduleFiles).length} modules to validate`)

    const validationPromises = Object.entries(moduleFiles).map(async ([path, importFn]) => {
      const moduleKey = this.extractModuleKey(path)
      return this.validateModule(moduleKey, importFn)
    })

    this.results = await Promise.all(validationPromises)
    
    // Update module status store
    const statusResults = this.results.map(r => ({
      name: r.name,
      moduleKey: r.moduleKey,
      version: r.version,
      compatibleWithCore: r.compatibleWithCore,
      isCompatible: r.isCompatible,
      errors: r.errors,
      warnings: r.warnings,
      timestamp: r.lastRun || new Date().toISOString(),
      executionTime: r.executionTime
    }))
    
    this.moduleStatusStore.updateTestResults(statusResults)
    this.moduleStatusStore.setTestingStatus(false)
    
    return this.generateReport(this.results)
  }

  async runSingleModuleTest(moduleKey: string): Promise<ModuleValidationResult> {
    const moduleFiles = import.meta.glob('../modules/*/module.config.ts', { eager: false })
    const modulePath = Object.keys(moduleFiles).find(path => path.includes(`/modules/${moduleKey}/`))
    
    if (!modulePath) {
      const result: ModuleValidationResult = {
        name: moduleKey,
        moduleKey,
        isCompatible: false,
        valid: false,
        errors: [`Module '${moduleKey}' not found`],
        warnings: []
      }
      
      this.moduleStatusStore.addTestResult({
        name: moduleKey,
        moduleKey,
        isCompatible: false,
        errors: result.errors,
        warnings: result.warnings,
        timestamp: new Date().toISOString()
      })
      
      return result
    }

    const importFn = moduleFiles[modulePath]
    const result = await this.validateModule(moduleKey, importFn)
    
    // Update single result in store
    this.moduleStatusStore.addTestResult({
      name: result.name,
      moduleKey: result.moduleKey,
      version: result.version,
      compatibleWithCore: result.compatibleWithCore,
      isCompatible: result.isCompatible,
      errors: result.errors,
      warnings: result.warnings,
      timestamp: result.lastRun || new Date().toISOString(),
      executionTime: result.executionTime
    })
    
    return result
  }

  private extractModuleKey(path: string): string {
    const match = path.match(/\/modules\/([^/]+)\//)
    return match ? match[1] : 'unknown'
  }

  private async validateModule(
    moduleKey: string, 
    importFn: () => Promise<any>
  ): Promise<ModuleValidationResult> {
    const moduleStartTime = Date.now()
    const result: ModuleValidationResult = {
      name: moduleKey,
      moduleKey,
      isCompatible: true,
      valid: true,
      errors: [],
      warnings: [],
      lastRun: new Date().toISOString()
    }

    try {
      // Import the module config
      const moduleExport = await importFn()
      const config = moduleExport.default || moduleExport.config

      if (!config) {
        result.errors.push('Module does not export a default configuration object')
        result.valid = false
        result.isCompatible = false
        return result
      }

      result.config = config
      result.name = config.name || moduleKey
      result.version = config.version
      result.compatibleWithCore = config.compatibleWithCore

      // Validate required fields
      this.validateRequiredFields(config, result)
      
      // Validate field types and values with robust role checking
      this.validateFieldTypes(config, result)
      
      // Validate version compatibility (ENHANCED)
      this.validateVersionCompatibility(config, result)
      
      // Validate widget consistency
      this.validateWidgetConsistency(config, result)
      
      // Validate routes function
      await this.validateRoutesFunction(config, result)
      
      // Validate widget function if required
      await this.validateWidgetFunction(config, result)

    } catch (error) {
      result.errors.push(`Failed to load module: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.valid = false
      result.isCompatible = false
    } finally {
      result.executionTime = Date.now() - moduleStartTime
    }

    return result
  }

  private validateRequiredFields(config: any, result: ModuleValidationResult): void {
    const requiredFields = ['name', 'routePrefix', 'rolesAllowed']
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        result.errors.push(`Missing required field: ${field}`)
        result.valid = false
      }
    }
  }

  private validateFieldTypes(config: ModuleConfig, result: ModuleValidationResult): void {
    // Validate name
    if (typeof config.name !== 'string' || config.name.trim() === '') {
      result.errors.push('Field "name" must be a non-empty string')
      result.valid = false
    }

    // Validate routePrefix
    if (typeof config.routePrefix !== 'string' || config.routePrefix.trim() === '') {
      result.errors.push('Field "routePrefix" must be a non-empty string')
      result.valid = false
    }

    // Robust role validation
    if (!Array.isArray(config.rolesAllowed)) {
      result.errors.push('Field "rolesAllowed" must be an array')
      result.valid = false
    } else if (config.rolesAllowed.length === 0) {
      result.errors.push('Field "rolesAllowed" must contain at least one role')
      result.valid = false
    } else {
      // Use robust role validation
      const validRoles = validateRoles(config.rolesAllowed)
      const invalidRoles = config.rolesAllowed.filter(role => !VALID_ROLES.includes(role))
      
      if (invalidRoles.length > 0) {
        result.errors.push(`Invalid roles in "rolesAllowed": ${invalidRoles.join(', ')}. Valid roles: ${VALID_ROLES.join(', ')}`)
        result.valid = false
      }
      
      if (validRoles.length === 0) {
        result.errors.push('No valid roles found in "rolesAllowed"')
        result.valid = false
      }
    }

    // Validate hasWidget
    if (config.hasWidget !== undefined && typeof config.hasWidget !== 'boolean') {
      result.errors.push('Field "hasWidget" must be a boolean')
      result.valid = false
    }

    // Validate hasDashboardWidget (alternative naming)
    if (config.hasDashboardWidget !== undefined && typeof config.hasDashboardWidget !== 'boolean') {
      result.errors.push('Field "hasDashboardWidget" must be a boolean')
      result.valid = false
    }

    // Validate routes function
    if (config.routes !== undefined && typeof config.routes !== 'function') {
      result.errors.push('Field "routes" must be a function')
      result.valid = false
    }

    // Validate widget function
    if (config.widget !== undefined && typeof config.widget !== 'function') {
      result.errors.push('Field "widget" must be a function')
      result.valid = false
    }

    // Validate optional string fields
    const optionalStringFields = ['description', 'version', 'author', 'compatibleWithCore']
    for (const field of optionalStringFields) {
      if (field in config && typeof config[field as keyof ModuleConfig] !== 'string') {
        result.errors.push(`Field "${field}" must be a string`)
        result.valid = false
      }
    }
  }

  private validateVersionCompatibility(config: ModuleConfig, result: ModuleValidationResult): void {
    // Check if version is provided
    if (!config.version) {
      result.warnings.push('No version specified - consider adding version field for better tracking')
    } else {
      // Validate semver format
      if (!semver.valid(config.version)) {
        result.warnings.push(`Version "${config.version}" is not valid semver format (e.g., "1.0.0")`)
      }
    }

    // Check core compatibility (ENHANCED)
    if (!config.compatibleWithCore) {
      result.warnings.push('No compatibleWithCore specified - assuming compatible but recommend adding')
    } else {
      try {
        // Use semver.satisfies to check compatibility
        const isCompatible = semver.satisfies(CORE_VERSION, config.compatibleWithCore)
        
        if (!isCompatible) {
          result.isCompatible = false
          result.errors.push(`Module requires core version ${config.compatibleWithCore}, but current version is ${CORE_VERSION}`)
        } else {
          result.warnings.push(`Module compatible with core ${config.compatibleWithCore} (current: ${CORE_VERSION})`)
        }
      } catch (error) {
        result.warnings.push(`Invalid semver range "${config.compatibleWithCore}" - please use valid semver syntax`)
        // Don't mark as incompatible for invalid ranges, just warn
      }
    }
  }

  private validateWidgetConsistency(config: ModuleConfig, result: ModuleValidationResult): void {
    const hasWidgetFlag = config.hasWidget || config.hasDashboardWidget
    const hasWidgetFunction = !!(config.widget || config.dashboardWidget)

    if (hasWidgetFlag && !hasWidgetFunction) {
      result.errors.push('Module declares hasWidget/hasDashboardWidget as true but no widget/dashboardWidget function provided')
      result.valid = false
    }

    if (!hasWidgetFlag && hasWidgetFunction) {
      result.warnings.push('Module provides widget function but hasWidget/hasDashboardWidget is not true')
    }
  }

  private async validateRoutesFunction(config: ModuleConfig, result: ModuleValidationResult): Promise<void> {
    if (!config.routes) {
      result.warnings.push('No routes function provided - module will not register any routes')
      return
    }

    try {
      const routes = await config.routes()
      
      if (!Array.isArray(routes)) {
        result.errors.push('Routes function must return an array')
        result.valid = false
        return
      }

      // Validate each route
      routes.forEach((route, index) => {
        if (!('path' in route)) {
          result.errors.push(`Route ${index}: missing "path" property`)
          result.valid = false
        }
        
        if (!route.component && !route.redirect) {
          result.errors.push(`Route ${index}: missing "component" or "redirect" property`)
          result.valid = false
        }
      })

    } catch (error) {
      result.errors.push(`Routes function failed to execute: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.valid = false
    }
  }

  private async validateWidgetFunction(config: ModuleConfig, result: ModuleValidationResult): Promise<void> {
    const widgetFunction = config.widget || config.dashboardWidget
    
    if (!widgetFunction) return

    try {
      const widget = await widgetFunction()
      
      if (!widget) {
        result.errors.push('Widget function returned null/undefined')
        result.valid = false
      }
    } catch (error) {
      result.errors.push(`Widget function failed to execute: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.valid = false
    }
  }

  private generateReport(results: ModuleValidationResult[]): TestReport {
    const executionTime = Date.now() - this.startTime
    const validModules = results.filter(r => r.valid).length
    const invalidModules = results.filter(r => !r.valid).length
    const compatibleModules = results.filter(r => r.isCompatible).length
    const incompatibleModules = results.filter(r => !r.isCompatible).length
    const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0)

    return {
      totalModules: results.length,
      validModules,
      invalidModules,
      compatibleModules,
      incompatibleModules,
      warningCount,
      executionTime,
      timestamp: new Date().toISOString(),
      coreVersion: CORE_VERSION,
      results
    }
  }

  getResults(): ModuleValidationResult[] {
    return this.results
  }

  hasErrors(): boolean {
    return this.results.some(result => !result.valid)
  }

  hasIncompatibleModules(): boolean {
    return this.results.some(result => !result.isCompatible)
  }
}

// Export singleton instance
export const moduleTestRunner = new ModuleTestRunner()