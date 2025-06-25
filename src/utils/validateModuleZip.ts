import JSZip from 'jszip'
import type { ModuleConfig } from '@/types'
import { CORE_VERSION } from '@/constants/version'
import { useModuleStatusStore } from '@/stores/moduleStatus'
import semver from 'semver'

export interface ModuleValidationResult {
  valid: boolean
  config?: ModuleConfig
  errors: string[]
  warnings: string[]
  extractedFiles?: Record<string, string>
  structure?: {
    hasConfig: boolean
    hasRoutes: boolean
    hasMainView: boolean
    hasWidget: boolean
    hasComponents: boolean
    hasViews: boolean
  }
  versionCompatibility?: {
    isCompatible: boolean
    requiredVersion?: string
    currentVersion: string
    issues: string[]
  }
}

export interface ModuleStructure {
  hasConfig: boolean
  hasRoutes: boolean
  hasMainView: boolean
  hasWidget: boolean
  hasComponents: boolean
  hasViews: boolean
  files: string[]
  directories: string[]
}

/**
 * Validate a module ZIP file with enhanced version checking
 * @param file - ZIP file to validate
 * @returns Promise<ModuleValidationResult>
 */
export async function validateModuleZip(file: File): Promise<ModuleValidationResult> {
  const result: ModuleValidationResult = {
    valid: false,
    errors: [],
    warnings: [],
    extractedFiles: {},
    versionCompatibility: {
      isCompatible: true,
      currentVersion: CORE_VERSION,
      issues: []
    }
  }

  try {
    // Load ZIP file
    const zip = await JSZip.loadAsync(file)
    
    // Extract file structure
    const structure = await extractModuleStructure(zip)
    result.structure = structure
    
    // Validate basic structure
    const structureValidation = validateModuleStructure(structure)
    result.errors.push(...structureValidation.errors)
    result.warnings.push(...structureValidation.warnings)
    
    if (structureValidation.errors.length > 0) {
      return result
    }
    
    // Extract and validate module.config.ts
    const configValidation = await validateModuleConfig(zip)
    result.errors.push(...configValidation.errors)
    result.warnings.push(...configValidation.warnings)
    
    if (configValidation.config) {
      result.config = configValidation.config
      
      // Enhanced version compatibility validation
      const versionValidation = validateVersionCompatibility(configValidation.config)
      result.versionCompatibility = versionValidation
      result.warnings.push(...versionValidation.issues)
      
      if (!versionValidation.isCompatible) {
        result.errors.push(`Module is incompatible with current core version ${CORE_VERSION}`)
      }
      
      // Validate widget requirements
      const widgetValidation = validateWidgetRequirements(configValidation.config, structure)
      result.errors.push(...widgetValidation.errors)
      result.warnings.push(...widgetValidation.warnings)
    }
    
    // Extract file contents for preview
    result.extractedFiles = await extractFileContents(zip)
    
    // Set valid flag
    result.valid = result.errors.length === 0
    
    return result
    
  } catch (error) {
    result.errors.push(`Failed to process ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Enhanced version compatibility validation using semver
 */
function validateVersionCompatibility(config: ModuleConfig): {
  isCompatible: boolean
  requiredVersion?: string
  currentVersion: string
  issues: string[]
} {
  const result = {
    isCompatible: true,
    requiredVersion: config.compatibleWithCore,
    currentVersion: CORE_VERSION,
    issues: [] as string[]
  }

  // Check if version is specified
  if (!config.version) {
    result.issues.push('No module version specified - consider adding version field')
  } else {
    // Validate semver format
    if (!semver.valid(config.version)) {
      result.issues.push(`Module version "${config.version}" is not valid semver format`)
    }
  }

  // Check core compatibility
  if (!config.compatibleWithCore) {
    result.issues.push('No core compatibility specified - assuming compatible')
  } else {
    try {
      // Use semver to check compatibility
      const isCompatible = semver.satisfies(CORE_VERSION, config.compatibleWithCore)
      
      if (!isCompatible) {
        result.isCompatible = false
        result.issues.push(`Module requires core version ${config.compatibleWithCore}, current is ${CORE_VERSION}`)
      } else {
        result.issues.push(`Module compatible with core ${config.compatibleWithCore} (current: ${CORE_VERSION})`)
      }
    } catch (error) {
      result.issues.push(`Invalid semver range "${config.compatibleWithCore}" - please use valid semver syntax`)
      // Don't mark as incompatible for invalid ranges, just warn
    }
  }

  return result
}

/**
 * Show version compatibility warning during upload
 */
export function showVersionCompatibilityWarning(result: ModuleValidationResult): boolean {
  if (!result.versionCompatibility) return false
  
  const { isCompatible, issues } = result.versionCompatibility
  
  if (!isCompatible) {
    const message = `⚠️ Version Incompatibility Detected!\n\n${issues.join('\n')}\n\nThis module may not work correctly with the current core version.`
    
    // For admin users, allow override
    const moduleStatusStore = useModuleStatusStore()
    // Note: In a real implementation, you'd check user role here
    
    return confirm(`${message}\n\nDo you want to continue anyway? (Admin override)`)
  }
  
  if (issues.length > 0) {
    console.warn('Module version warnings:', issues)
  }
  
  return true
}

/**
 * Extract module structure from ZIP
 */
async function extractModuleStructure(zip: JSZip): Promise<ModuleStructure> {
  const structure: ModuleStructure = {
    hasConfig: false,
    hasRoutes: false,
    hasMainView: false,
    hasWidget: false,
    hasComponents: false,
    hasViews: false,
    files: [],
    directories: []
  }

  // Get all file paths
  const filePaths = Object.keys(zip.files)
  
  for (const path of filePaths) {
    const file = zip.files[path]
    
    if (file.dir) {
      structure.directories.push(path)
    } else {
      structure.files.push(path)
      
      // Check for required files
      if (path.endsWith('module.config.ts') || path.endsWith('module.config.js')) {
        structure.hasConfig = true
      }
      
      if (path.endsWith('routes.ts') || path.endsWith('routes.js')) {
        structure.hasRoutes = true
      }
      
      if (path.includes('views/MainView.vue') || path.includes('views/MainView.ts')) {
        structure.hasMainView = true
      }
      
      if (path.includes('components/Widget.vue') || path.includes('components/Widget.ts')) {
        structure.hasWidget = true
      }
    }
  }
  
  // Check for required directories
  structure.hasViews = structure.directories.some(dir => 
    dir.includes('views/') || dir.includes('pages/')
  )
  
  structure.hasComponents = structure.directories.some(dir => 
    dir.includes('components/')
  )
  
  return structure
}

/**
 * Validate module structure requirements
 */
function validateModuleStructure(structure: ModuleStructure): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required files
  if (!structure.hasConfig) {
    errors.push('Missing required file: module.config.ts')
  }
  
  if (!structure.hasRoutes) {
    errors.push('Missing required file: routes.ts')
  }
  
  if (!structure.hasMainView) {
    errors.push('Missing required file: views/MainView.vue')
  }
  
  // Recommended structure
  if (!structure.hasViews) {
    warnings.push('No views/ directory found - module may not have any pages')
  }
  
  if (!structure.hasComponents) {
    warnings.push('No components/ directory found - module may not have reusable components')
  }
  
  // Check for common files
  const hasReadme = structure.files.some(file => 
    file.toLowerCase().includes('readme')
  )
  
  if (!hasReadme) {
    warnings.push('No README file found - consider adding documentation')
  }
  
  return { errors, warnings }
}

/**
 * Extract and validate module configuration
 */
async function validateModuleConfig(zip: JSZip): Promise<{ config?: ModuleConfig, errors: string[], warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  let config: ModuleConfig | undefined
  
  try {
    // Find config file
    const configFile = Object.keys(zip.files).find(path => 
      path.endsWith('module.config.ts') || path.endsWith('module.config.js')
    )
    
    if (!configFile) {
      errors.push('No module.config.ts file found')
      return { errors, warnings }
    }
    
    // Extract config content
    const configContent = await zip.files[configFile].async('string')
    
    // Parse TypeScript/JavaScript config (basic validation)
    const configValidation = parseModuleConfig(configContent)
    errors.push(...configValidation.errors)
    warnings.push(...configValidation.warnings)
    
    if (configValidation.config) {
      config = configValidation.config
      
      // Validate config fields
      const fieldValidation = validateConfigFields(config)
      errors.push(...fieldValidation.errors)
      warnings.push(...fieldValidation.warnings)
    }
    
  } catch (error) {
    errors.push(`Failed to parse module config: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return { config, errors, warnings }
}

/**
 * Parse module configuration from string content
 */
function parseModuleConfig(content: string): { config?: ModuleConfig, errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // This is a simplified parser - in production you might want to use a proper TypeScript parser
    // For now, we'll use regex to extract the config object
    
    // Look for export default or export const config patterns
    const exportDefaultMatch = content.match(/export\s+default\s+({[\s\S]*?})\s*(?:;|$)/m)
    const exportConfigMatch = content.match(/export\s+const\s+config\s*[:=]\s*({[\s\S]*?})\s*(?:;|$)/m)
    
    const configMatch = exportDefaultMatch || exportConfigMatch
    
    if (!configMatch) {
      errors.push('Could not find exported configuration object')
      return { errors, warnings }
    }
    
    // Extract basic properties using regex (simplified approach)
    const configStr = configMatch[1]
    
    const config: Partial<ModuleConfig> = {}
    
    // Extract string properties
    const extractStringProp = (prop: string) => {
      const match = configStr.match(new RegExp(`${prop}\\s*:\\s*['"\`]([^'"\`]*?)['"\`]`))
      return match ? match[1] : undefined
    }
    
    // Extract array properties
    const extractArrayProp = (prop: string) => {
      const match = configStr.match(new RegExp(`${prop}\\s*:\\s*\\[([^\\]]*?)\\]`))
      if (match) {
        return match[1]
          .split(',')
          .map(item => item.trim().replace(/['"`]/g, ''))
          .filter(item => item.length > 0)
      }
      return undefined
    }
    
    // Extract boolean properties
    const extractBooleanProp = (prop: string) => {
      const match = configStr.match(new RegExp(`${prop}\\s*:\\s*(true|false)`))
      return match ? match[1] === 'true' : undefined
    }
    
    // Extract properties
    config.name = extractStringProp('name')
    config.routePrefix = extractStringProp('routePrefix')
    config.description = extractStringProp('description')
    config.version = extractStringProp('version')
    config.author = extractStringProp('author')
    config.compatibleWithCore = extractStringProp('compatibleWithCore')
    
    config.rolesAllowed = extractArrayProp('rolesAllowed') || extractArrayProp('allowedRoles')
    
    config.hasWidget = extractBooleanProp('hasWidget')
    config.hasDashboardWidget = extractBooleanProp('hasDashboardWidget')
    
    // Check for function properties
    if (configStr.includes('routes:') || configStr.includes('routes()')) {
      warnings.push('Routes function detected - will need runtime validation')
    }
    
    if (configStr.includes('widget:') || configStr.includes('widget()')) {
      warnings.push('Widget function detected - will need runtime validation')
    }
    
    return { config: config as ModuleConfig, errors, warnings }
    
  } catch (error) {
    errors.push(`Failed to parse config: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { errors, warnings }
  }
}

/**
 * Validate configuration fields
 */
function validateConfigFields(config: ModuleConfig): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required fields
  if (!config.name || typeof config.name !== 'string' || config.name.trim() === '') {
    errors.push('Field "name" is required and must be a non-empty string')
  }
  
  if (!config.routePrefix || typeof config.routePrefix !== 'string' || config.routePrefix.trim() === '') {
    errors.push('Field "routePrefix" is required and must be a non-empty string')
  }
  
  if (!config.rolesAllowed || !Array.isArray(config.rolesAllowed) || config.rolesAllowed.length === 0) {
    errors.push('Field "rolesAllowed" is required and must be a non-empty array')
  } else {
    // Validate roles
    const validRoles = ['admin', 'coach', 'coachee', 'user']
    const invalidRoles = config.rolesAllowed.filter(role => 
      typeof role !== 'string' || !validRoles.includes(role)
    )
    
    if (invalidRoles.length > 0) {
      errors.push(`Invalid roles: ${invalidRoles.join(', ')}. Valid roles: ${validRoles.join(', ')}`)
    }
  }
  
  // Optional field validation
  if (config.description && typeof config.description !== 'string') {
    errors.push('Field "description" must be a string')
  }
  
  if (config.version && typeof config.version !== 'string') {
    errors.push('Field "version" must be a string')
  }
  
  if (config.author && typeof config.author !== 'string') {
    errors.push('Field "author" must be a string')
  }
  
  if (config.compatibleWithCore && typeof config.compatibleWithCore !== 'string') {
    errors.push('Field "compatibleWithCore" must be a string')
  }
  
  // Boolean field validation
  if (config.hasWidget !== undefined && typeof config.hasWidget !== 'boolean') {
    errors.push('Field "hasWidget" must be a boolean')
  }
  
  if (config.hasDashboardWidget !== undefined && typeof config.hasDashboardWidget !== 'boolean') {
    errors.push('Field "hasDashboardWidget" must be a boolean')
  }
  
  return { errors, warnings }
}

/**
 * Validate widget requirements
 */
function validateWidgetRequirements(config: ModuleConfig, structure: ModuleStructure): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  const hasWidgetFlag = config.hasWidget || config.hasDashboardWidget
  
  if (hasWidgetFlag && !structure.hasWidget) {
    errors.push('Module declares hasWidget/hasDashboardWidget as true but no components/Widget.vue file found')
  }
  
  if (!hasWidgetFlag && structure.hasWidget) {
    warnings.push('Module contains Widget.vue but hasWidget/hasDashboardWidget is not true')
  }
  
  return { errors, warnings }
}

/**
 * Extract file contents for preview
 */
async function extractFileContents(zip: JSZip): Promise<Record<string, string>> {
  const contents: Record<string, string> = {}
  
  // Extract important files for preview
  const importantFiles = [
    'module.config.ts',
    'module.config.js',
    'routes.ts',
    'routes.js',
    'README.md',
    'README.txt',
    'package.json'
  ]
  
  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue
    
    // Extract important files or files in root directory
    const fileName = path.split('/').pop() || ''
    const isImportant = importantFiles.some(important => 
      fileName.toLowerCase().includes(important.toLowerCase())
    )
    
    const isRootFile = !path.includes('/') || path.split('/').length <= 2
    
    if (isImportant || isRootFile) {
      try {
        // Only extract text files (avoid binary files)
        if (isTextFile(fileName)) {
          contents[path] = await file.async('string')
        }
      } catch (error) {
        console.warn(`Failed to extract ${path}:`, error)
      }
    }
  }
  
  return contents
}

/**
 * Check if file is a text file based on extension
 */
function isTextFile(fileName: string): boolean {
  const textExtensions = [
    '.ts', '.js', '.vue', '.json', '.md', '.txt', '.yml', '.yaml',
    '.css', '.scss', '.sass', '.less', '.html', '.xml', '.svg'
  ]
  
  return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
}

/**
 * Generate a validation report
 */
export function generateValidationReport(result: ModuleValidationResult): string {
  const lines: string[] = []
  
  lines.push('=== Module Validation Report ===')
  lines.push('')
  
  if (result.config) {
    lines.push(`Module Name: ${result.config.name}`)
    lines.push(`Route Prefix: ${result.config.routePrefix}`)
    lines.push(`Version: ${result.config.version || 'Not specified'}`)
    lines.push(`Author: ${result.config.author || 'Not specified'}`)
    lines.push(`Roles Allowed: ${result.config.rolesAllowed?.join(', ') || 'None'}`)
    lines.push(`Has Widget: ${result.config.hasWidget ? 'Yes' : 'No'}`)
    lines.push(`Compatible With Core: ${result.config.compatibleWithCore || 'Not specified'}`)
    lines.push('')
  }
  
  lines.push(`Validation Status: ${result.valid ? 'PASSED' : 'FAILED'}`)
  
  if (result.versionCompatibility) {
    lines.push(`Version Compatibility: ${result.versionCompatibility.isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}`)
    lines.push(`Current Core Version: ${result.versionCompatibility.currentVersion}`)
    if (result.versionCompatibility.requiredVersion) {
      lines.push(`Required Core Version: ${result.versionCompatibility.requiredVersion}`)
    }
  }
  
  lines.push('')
  
  if (result.errors.length > 0) {
    lines.push('ERRORS:')
    result.errors.forEach(error => lines.push(`  ❌ ${error}`))
    lines.push('')
  }
  
  if (result.warnings.length > 0) {
    lines.push('WARNINGS:')
    result.warnings.forEach(warning => lines.push(`  ⚠️  ${warning}`))
    lines.push('')
  }
  
  if (result.versionCompatibility?.issues.length) {
    lines.push('VERSION ISSUES:')
    result.versionCompatibility.issues.forEach(issue => lines.push(`  📋 ${issue}`))
    lines.push('')
  }
  
  if (result.extractedFiles) {
    lines.push('EXTRACTED FILES:')
    Object.keys(result.extractedFiles).forEach(file => lines.push(`  📄 ${file}`))
  }
  
  return lines.join('\n')
}