/**
 * Enhanced Module Validator
 * Comprehensive validation system for module structure, functionality, and quality
 */

import type { ModuleConfig, UserRole } from '@/types'
import { VALID_ROLES, validateRoles } from '@/types'
import { CORE_VERSION } from '@/constants/version'
import semver from 'semver'

export interface ModuleValidationRule {
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  validator: (config: ModuleConfig, context: ModuleValidationContext) => Promise<ValidationResult>
}

export interface ModuleValidationContext {
  moduleKey: string
  filePath?: string
  extractedFiles?: Record<string, string>
  existingModules?: string[]
}

export interface ValidationResult {
  passed: boolean
  message?: string
  details?: string[]
  suggestions?: string[]
}

export interface ComprehensiveValidationResult {
  valid: boolean
  score: number // 0-100 quality score
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
  metrics: ModuleMetrics
}

export interface ValidationError {
  rule: string
  message: string
  severity: 'critical' | 'major' | 'minor'
  file?: string
  line?: number
  suggestion?: string
}

export interface ValidationWarning {
  rule: string
  message: string
  impact: 'high' | 'medium' | 'low'
  suggestion: string
}

export interface ValidationSuggestion {
  category: 'performance' | 'security' | 'maintainability' | 'usability'
  message: string
  priority: 'high' | 'medium' | 'low'
  implementation?: string
}

export interface ModuleMetrics {
  complexity: number
  maintainability: number
  testability: number
  performance: number
  security: number
  accessibility: number
}

/**
 * Enhanced Module Validator Class
 */
export class EnhancedModuleValidator {
  private rules: ModuleValidationRule[] = []

  constructor() {
    this.initializeRules()
  }

  /**
   * Initialize all validation rules
   */
  private initializeRules(): void {
    this.rules = [
      // Core Structure Rules
      {
        name: 'required-fields',
        description: 'Validates all required configuration fields are present',
        severity: 'error',
        validator: this.validateRequiredFields
      },
      {
        name: 'field-types',
        description: 'Validates field types and formats',
        severity: 'error',
        validator: this.validateFieldTypes
      },
      {
        name: 'role-validation',
        description: 'Validates role configuration and permissions',
        severity: 'error',
        validator: this.validateRoles
      },
      {
        name: 'version-compatibility',
        description: 'Validates version compatibility with core system',
        severity: 'error',
        validator: this.validateVersionCompatibility
      },

      // Quality Rules
      {
        name: 'naming-conventions',
        description: 'Validates naming conventions and standards',
        severity: 'warning',
        validator: this.validateNamingConventions
      },
      {
        name: 'documentation-quality',
        description: 'Validates documentation completeness and quality',
        severity: 'warning',
        validator: this.validateDocumentation
      },
      {
        name: 'file-structure',
        description: 'Validates recommended file structure',
        severity: 'warning',
        validator: this.validateFileStructure
      },
      {
        name: 'widget-consistency',
        description: 'Validates widget configuration consistency',
        severity: 'error',
        validator: this.validateWidgetConsistency
      },

      // Security Rules
      {
        name: 'security-practices',
        description: 'Validates security best practices',
        severity: 'error',
        validator: this.validateSecurityPractices
      },
      {
        name: 'permission-model',
        description: 'Validates permission model implementation',
        severity: 'warning',
        validator: this.validatePermissionModel
      },

      // Performance Rules
      {
        name: 'performance-optimization',
        description: 'Validates performance optimization practices',
        severity: 'info',
        validator: this.validatePerformanceOptimization
      },
      {
        name: 'bundle-size',
        description: 'Validates bundle size and optimization',
        severity: 'warning',
        validator: this.validateBundleSize
      },

      // Maintainability Rules
      {
        name: 'code-organization',
        description: 'Validates code organization and structure',
        severity: 'warning',
        validator: this.validateCodeOrganization
      },
      {
        name: 'dependency-management',
        description: 'Validates dependency management practices',
        severity: 'warning',
        validator: this.validateDependencyManagement
      }
    ]
  }

  /**
   * Comprehensive module validation
   */
  async validateModule(
    config: ModuleConfig, 
    context: ModuleValidationContext
  ): Promise<ComprehensiveValidationResult> {
    const result: ComprehensiveValidationResult = {
      valid: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: [],
      metrics: {
        complexity: 0,
        maintainability: 0,
        testability: 0,
        performance: 0,
        security: 0,
        accessibility: 0
      }
    }

    let totalScore = 0
    let maxScore = 0

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        const ruleResult = await rule.validator.call(this, config, context)
        
        // Calculate score impact
        const ruleWeight = this.getRuleWeight(rule.severity)
        maxScore += ruleWeight

        if (ruleResult.passed) {
          totalScore += ruleWeight
        } else {
          // Add to appropriate result category
          if (rule.severity === 'error') {
            result.errors.push({
              rule: rule.name,
              message: ruleResult.message || `${rule.description} failed`,
              severity: 'major',
              suggestion: ruleResult.suggestions?.[0]
            })
            result.valid = false
          } else if (rule.severity === 'warning') {
            result.warnings.push({
              rule: rule.name,
              message: ruleResult.message || `${rule.description} needs attention`,
              impact: 'medium',
              suggestion: ruleResult.suggestions?.[0] || 'Please review and fix'
            })
          }

          // Reduce score based on severity
          totalScore += Math.max(0, ruleWeight * 0.3) // Partial credit for warnings
        }

        // Add suggestions if any
        if (ruleResult.suggestions) {
          ruleResult.suggestions.forEach(suggestion => {
            result.suggestions.push({
              category: this.getCategoryForRule(rule.name),
              message: suggestion,
              priority: rule.severity === 'error' ? 'high' : 'medium'
            })
          })
        }

      } catch (error) {
        result.errors.push({
          rule: rule.name,
          message: `Validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'critical'
        })
        result.valid = false
      }
    }

    // Calculate final score
    result.score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    // Calculate metrics
    result.metrics = await this.calculateMetrics(config, context, result)

    return result
  }

  // Validation Rule Implementations

  private async validateRequiredFields(
     config: ModuleConfig,
    _context: ModuleValidationContext
  ): Promise<ValidationResult> {
    const requiredFields = ['name', 'routePrefix', 'rolesAllowed', 'hasWidget']
    const missing = requiredFields.filter(field => !(field in config))

    if (missing.length > 0) {
      return {
        passed: false,
        message: `Missing required fields: ${missing.join(', ')}`,
        suggestions: [`Add the following required fields to your module.config.ts: ${missing.join(', ')}`]
      }
    }

    return { passed: true }
  }

  private async validateFieldTypes(
    config: ModuleConfig,
    _context: ModuleValidationContext
  ): Promise<ValidationResult> {
    const errors: string[] = []

    // Validate name
    if (typeof config.name !== 'string' || config.name.trim() === '') {
      errors.push('Field "name" must be a non-empty string')
    }

    // Validate routePrefix
    if (typeof config.routePrefix !== 'string' || config.routePrefix.trim() === '') {
      errors.push('Field "routePrefix" must be a non-empty string')
    } else if (!/^[a-z0-9-]+$/.test(config.routePrefix)) {
      errors.push('Field "routePrefix" must contain only lowercase letters, numbers, and hyphens')
    }

    // Validate hasWidget
    if (typeof config.hasWidget !== 'boolean') {
      errors.push('Field "hasWidget" must be a boolean')
    }

    // Validate optional version
    if (config.version && !semver.valid(config.version)) {
      errors.push(`Field "version" must be valid semver format (e.g., "1.0.0")`)
    }

    if (errors.length > 0) {
      return {
        passed: false,
        message: 'Field type validation failed',
        details: errors,
        suggestions: ['Fix the field type issues listed above']
      }
    }

    return { passed: true }
  }

  private async validateRoles(
    config: ModuleConfig,
    _context: ModuleValidationContext
  ): Promise<ValidationResult> {
    if (!Array.isArray(config.rolesAllowed)) {
      return {
        passed: false,
        message: 'Field "rolesAllowed" must be an array',
        suggestions: ['Set rolesAllowed to an array of valid roles: ["admin", "coach", "coachee"]']
      }
    }

    if (config.rolesAllowed.length === 0) {
      return {
        passed: false,
        message: 'Field "rolesAllowed" must contain at least one role',
        suggestions: ['Add at least one valid role to rolesAllowed array']
      }
    }

    const validRoles = validateRoles(config.rolesAllowed)
    const invalidRoles = config.rolesAllowed.filter(role => !VALID_ROLES.includes(role as UserRole))

    if (invalidRoles.length > 0) {
      return {
        passed: false,
        message: `Invalid roles: ${invalidRoles.join(', ')}`,
        suggestions: [`Use only valid roles: ${VALID_ROLES.join(', ')}`]
      }
    }

    if (validRoles.length === 0) {
      return {
        passed: false,
        message: 'No valid roles found',
        suggestions: [`Use valid roles: ${VALID_ROLES.join(', ')}`]
      }
    }

    return { passed: true }
  }

  private async validateVersionCompatibility(
    config: ModuleConfig,
    _context: ModuleValidationContext
  ): Promise<ValidationResult> {
    if (!config.compatibleWithCore) {
      return {
        passed: false,
        message: 'Missing core compatibility specification',
        suggestions: [`Add "compatibleWithCore": "^${CORE_VERSION}" to your module configuration`]
      }
    }

    try {
      const isCompatible = semver.satisfies(CORE_VERSION, config.compatibleWithCore)
      
      if (!isCompatible) {
        return {
          passed: false,
          message: `Module requires core version ${config.compatibleWithCore}, but current version is ${CORE_VERSION}`,
          suggestions: [
            `Update compatibleWithCore to "^${CORE_VERSION}" for current compatibility`,
            'Or update your module to work with the current core version'
          ]
        }
      }
    } catch (error) {
      return {
        passed: false,
        message: `Invalid semver range: ${config.compatibleWithCore}`,
        suggestions: [
          'Use valid semver range syntax (e.g., "^1.0.0", ">=1.0.0 <2.0.0")',
          'Check semver documentation for proper range syntax'
        ]
      }
    }

    return { passed: true }
  }

  private async validateNamingConventions(
    config: ModuleConfig
  ): Promise<ValidationResult> {
    const suggestions: string[] = []

    // Check module name conventions
    if (config.name && !/^[A-Z]/.test(config.name)) {
      suggestions.push('Module name should start with a capital letter')
    }

    // Check route prefix conventions
    if (config.routePrefix && config.routePrefix !== config.routePrefix.toLowerCase()) {
      suggestions.push('Route prefix should be lowercase')
    }

    // Check for descriptive naming
    if (config.name && config.name.length < 5) {
      suggestions.push('Consider using a more descriptive module name')
    }

    return {
      passed: suggestions.length === 0,
      message: suggestions.length > 0 ? 'Naming convention issues found' : undefined,
      suggestions
    }
  }

  private async validateDocumentation(
   config: ModuleConfig,
    context: ModuleValidationContext
  ): Promise<ValidationResult> {
    const suggestions: string[] = []

    if (!config.description || config.description.length < 10) {
      suggestions.push('Add a comprehensive description (at least 10 characters)')
    }

    if (!config.author) {
      suggestions.push('Add author information')
    }

    if (!config.version) {
      suggestions.push('Add version information using semantic versioning')
    }

    // Check for README file
    if (context.extractedFiles && !Object.keys(context.extractedFiles).some(file => 
      file.toLowerCase().includes('readme')
    )) {
      suggestions.push('Add a README.md file with module documentation')
    }

    return {
      passed: suggestions.length === 0,
      message: suggestions.length > 0 ? 'Documentation could be improved' : undefined,
      suggestions
    }
  }

  private async validateFileStructure(
    context: ModuleValidationContext
  ): Promise<ValidationResult> {
    if (!context.extractedFiles) {
      return { passed: true } // Can't validate without files
    }

    const files = Object.keys(context.extractedFiles)
    const suggestions: string[] = []

    // Check for required files
    const hasMainView = files.some(f => f.includes('views/') && f.includes('MainView'))
    if (!hasMainView) {
      suggestions.push('Add a MainView.vue file in the views/ directory')
    }

    // Check for widget consistency
    if (config.hasWidget) {
      const hasWidget = files.some(f => f.includes('components/') && f.includes('Widget'))
      if (!hasWidget) {
        suggestions.push('Add a Widget.vue file in the components/ directory (hasWidget is true)')
      }
    }

    // Check for recommended structure
    const hasComponents = files.some(f => f.includes('components/'))
    const hasViews = files.some(f => f.includes('views/'))
    
    if (!hasComponents) {
      suggestions.push('Consider adding a components/ directory for reusable components')
    }
    
    if (!hasViews) {
      suggestions.push('Add a views/ directory for page components')
    }

    return {
      passed: suggestions.length === 0,
      message: suggestions.length > 0 ? 'File structure could be improved' : undefined,
      suggestions
    }
  }

  private async validateWidgetConsistency(
    config: ModuleConfig, 
    context: ModuleValidationContext
  ): Promise<ValidationResult> {
    const hasWidgetFlag = config.hasWidget
    const hasWidgetFunction = !!(config.widget)
    
    // Check for widget file if hasWidget is true
    let hasWidgetFile = false
    if (context.extractedFiles) {
      hasWidgetFile = Object.keys(context.extractedFiles).some(file => 
        file.includes('Widget.vue') || file.includes('Widget.ts')
      )
    }

    if (hasWidgetFlag && !hasWidgetFile && !hasWidgetFunction) {
      return {
        passed: false,
        message: 'Module declares hasWidget as true but no widget implementation found',
        suggestions: [
          'Add a Widget.vue component in the components/ directory',
          'Or add a widget function to your module configuration',
          'Or set hasWidget to false if no widget is needed'
        ]
      }
    }

    if (!hasWidgetFlag && (hasWidgetFile || hasWidgetFunction)) {
      return {
        passed: false,
        message: 'Widget implementation found but hasWidget is false',
        suggestions: [
          'Set hasWidget to true in your module configuration',
          'Or remove the widget implementation if not needed'
        ]
      }
    }

    return { passed: true }
  }

  private async validateSecurityPractices(
    config: ModuleConfig
  ): Promise<ValidationResult> {
    const suggestions: string[] = []

    // Check for overly permissive roles
    if (config.rolesAllowed.length === 3) {
      suggestions.push('Consider if all roles really need access to this module')
    }

    // Check for admin-only sensitive operations
    if (config.name.toLowerCase().includes('admin') && !config.rolesAllowed.includes('admin')) {
      suggestions.push('Admin-related modules should typically include admin role')
    }

    return {
      passed: suggestions.length === 0,
      message: suggestions.length > 0 ? 'Security practices could be improved' : undefined,
      suggestions
    }
  }

  private async validatePermissionModel(
    config: ModuleConfig
  ): Promise<ValidationResult> {
    // This is a placeholder for more complex permission validation
    return { passed: true }
  }

  private async validatePerformanceOptimization(
    _config: ModuleConfig,
    context: ModuleValidationContext
  ): Promise<ValidationResult> {
    const suggestions: string[] = []

    // Check for lazy loading patterns
    if (context.extractedFiles) {
      const hasLazyLoading = Object.values(context.extractedFiles).some(content =>
        content.includes('import(') || content.includes('defineAsyncComponent')
      )
      
      if (!hasLazyLoading) {
        suggestions.push('Consider using lazy loading for better performance')
      }
    }

    return {
      passed: true, // Performance is always a suggestion, not a requirement
      suggestions
    }
  }

  private async validateBundleSize(
    _config: ModuleConfig,
    _context: ModuleValidationContext
  ): Promise<ValidationResult> {
    // This would require actual bundle analysis in a real implementation
    return { passed: true }
  }

  private async validateCodeOrganization(
    config: ModuleConfig,
    context: ModuleValidationContext
  ): Promise<ValidationResult> {
    if (!context.extractedFiles) {
      return { passed: true }
    }

    const suggestions: string[] = []
    const files = Object.keys(context.extractedFiles)

    // Check for proper separation of concerns
    const hasTypes = files.some(f => f.includes('types') || f.includes('interfaces'))
    const hasUtils = files.some(f => f.includes('utils') || f.includes('helpers'))
    
    if (files.length > 5 && !hasTypes) {
      suggestions.push('Consider adding a types/ directory for TypeScript interfaces')
    }
    
    if (files.length > 8 && !hasUtils) {
      suggestions.push('Consider adding a utils/ directory for helper functions')
    }

    return {
      passed: suggestions.length === 0,
      message: suggestions.length > 0 ? 'Code organization could be improved' : undefined,
      suggestions
    }
  }

  private async validateDependencyManagement(
    _config: ModuleConfig,
    context: ModuleValidationContext
  ): Promise<ValidationResult> {
    // Check for dependency-related issues
    const suggestions: string[] = []

    if (config.dependencies && config.dependencies.length > 5) {
      suggestions.push('Consider reducing dependencies for better maintainability')
    }

    return {
      passed: suggestions.length === 0,
      suggestions
    }
  }

  // Helper Methods

  private getRuleWeight(severity: 'error' | 'warning' | 'info'): number {
    switch (severity) {
      case 'error': return 20
      case 'warning': return 10
      case 'info': return 5
      default: return 1
    }
  }

  private getCategoryForRule(ruleName: string): 'performance' | 'security' | 'maintainability' | 'usability' {
    if (ruleName.includes('performance') || ruleName.includes('bundle')) return 'performance'
    if (ruleName.includes('security') || ruleName.includes('permission')) return 'security'
    if (ruleName.includes('organization') || ruleName.includes('dependency')) return 'maintainability'
    return 'usability'
  }

  private async calculateMetrics(
    _config: ModuleConfig, 
    context: ModuleValidationContext,
    result: ComprehensiveValidationResult
  ): Promise<ModuleMetrics> {
    // Calculate various quality metrics
    const baseScore = 80

    return {
      complexity: Math.max(0, baseScore - (result.errors.length * 10)),
      maintainability: Math.max(0, baseScore - (result.warnings.length * 5)),
      testability: config.version ? baseScore : baseScore - 10,
      performance: baseScore - (result.suggestions.filter(s => s.category === 'performance').length * 5),
      security: baseScore - (result.suggestions.filter(s => s.category === 'security').length * 10),
      accessibility: baseScore // Placeholder for accessibility scoring
    }
  }
}

// Export singleton instance
export const moduleValidator = new EnhancedModuleValidator()