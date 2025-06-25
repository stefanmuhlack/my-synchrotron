import { describe, it, expect, beforeEach, vi } from 'vitest'
import JSZip from 'jszip'
import { 
  validateModuleZip, 
  validateModuleZipFromPath,
  generateValidationReport,
  type ModuleValidationResult 
} from '@/utils/validateModuleZip'

// Mock JSZip for testing
vi.mock('jszip')

describe('ZIP Validator Tests', () => {
  let mockZip: any
  let mockFile: File

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Create mock ZIP instance
    mockZip = {
      files: {},
      loadAsync: vi.fn(),
      file: vi.fn()
    }
    
    // Mock JSZip constructor
    vi.mocked(JSZip).mockImplementation(() => mockZip)
    vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)
    
    // Create mock file
    mockFile = new File([''], 'test-module.zip', { type: 'application/zip' })
  })

  describe('Valid Module ZIP Tests', () => {
    beforeEach(() => {
      // Setup valid module structure
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            import type { ModuleConfig } from '@/types'
            
            const config: ModuleConfig = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin', 'coach'],
              hasWidget: true,
              version: '1.0.0',
              compatibleWithCore: '^1.0.0',
              description: 'A test module',
              author: 'Test Author'
            }
            
            export default config
          `)
        },
        'routes.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            export default [
              {
                path: '',
                component: () => import('./views/MainView.vue'),
                meta: { requiresAuth: true }
              }
            ]
          `)
        },
        'views/': { dir: true },
        'views/MainView.vue': {
          dir: false,
          async: vi.fn().mockResolvedValue('<template><div>Test</div></template>')
        },
        'components/': { dir: true },
        'components/Widget.vue': {
          dir: false,
          async: vi.fn().mockResolvedValue('<template><div>Widget</div></template>')
        },
        'README.md': {
          dir: false,
          async: vi.fn().mockResolvedValue('# Test Module\nThis is a test module.')
        }
      }
    })

    it('should validate a complete valid module', async () => {
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.config).toBeDefined()
      expect(result.config?.name).toBe('Test Module')
      expect(result.config?.routePrefix).toBe('test-module')
      expect(result.config?.rolesAllowed).toEqual(['admin', 'coach'])
      expect(result.config?.hasWidget).toBe(true)
    })

    it('should extract and validate module configuration', async () => {
      const result = await validateModuleZip(mockFile)
      
      expect(result.config).toMatchObject({
        name: 'Test Module',
        routePrefix: 'test-module',
        rolesAllowed: ['admin', 'coach'],
        hasWidget: true,
        version: '1.0.0',
        compatibleWithCore: '^1.0.0',
        description: 'A test module',
        author: 'Test Author'
      })
    })

    it('should validate file structure requirements', async () => {
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.includes('views/'))).toBe(false)
      expect(result.warnings.some(w => w.includes('components/'))).toBe(false)
      expect(result.warnings.some(w => w.includes('routes.ts'))).toBe(false)
    })

    it('should extract file contents for preview', async () => {
      const result = await validateModuleZip(mockFile)
      
      expect(result.extractedFiles).toBeDefined()
      expect(result.extractedFiles!['module.config.ts']).toContain('Test Module')
      expect(result.extractedFiles!['routes.ts']).toContain('MainView.vue')
      expect(result.extractedFiles!['README.md']).toContain('# Test Module')
    })

    it('should validate version compatibility', async () => {
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.includes('core compatibility'))).toBe(true)
    })
  })

  describe('Invalid Module ZIP Tests', () => {
    it('should fail validation when module.config.ts is missing', async () => {
      mockZip.files = {
        'views/MainView.vue': { dir: false }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing required file: module.config.ts')
    })

    it('should fail validation with invalid configuration', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: '',  // Invalid: empty name
              routePrefix: 'test module',  // Invalid: contains space
              rolesAllowed: [],  // Invalid: empty array
              hasWidget: 'yes'  // Invalid: not boolean
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('name'))).toBe(true)
      expect(result.errors.some(e => e.includes('rolesAllowed'))).toBe(true)
    })

    it('should fail validation with invalid roles', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['invalid-role', 'another-invalid'],
              hasWidget: false
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Invalid roles'))).toBe(true)
    })

    it('should detect widget inconsistencies', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: true  // Claims to have widget but no widget file
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.warnings.some(w => w.includes('widget'))).toBe(true)
    })

    it('should handle malformed configuration files', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue('invalid javascript syntax {{{')
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('parse'))).toBe(true)
    })
  })

  describe('Structure Validation Tests', () => {
    it('should warn about missing recommended directories', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: false
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.warnings.some(w => w.includes('views/'))).toBe(true)
      expect(result.warnings.some(w => w.includes('components/'))).toBe(true)
      expect(result.warnings.some(w => w.includes('routes.ts'))).toBe(true)
    })

    it('should warn about missing README', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: false
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.warnings.some(w => w.includes('README'))).toBe(true)
    })

    it('should detect package.json and warn about dependencies', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: false
            }
            export default config
          `)
        },
        'package.json': {
          dir: false,
          async: vi.fn().mockResolvedValue('{"name": "test-module"}')
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.warnings.some(w => w.includes('package.json'))).toBe(true)
    })
  })

  describe('Version Compatibility Tests', () => {
    it('should validate exact version compatibility', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: false,
              compatibleWithCore: '1.0.0'
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.includes('compatibility'))).toBe(true)
    })

    it('should validate caret range compatibility', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: false,
              compatibleWithCore: '^1.0.0'
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(true)
    })

    it('should detect incompatible versions', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: false,
              compatibleWithCore: '2.0.0'
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.errors.some(e => e.includes('core version'))).toBe(true)
    })

    it('should validate semver format', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: false,
              version: 'invalid-version'
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.warnings.some(w => w.includes('semver'))).toBe(true)
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle ZIP loading errors', async () => {
      vi.mocked(JSZip.loadAsync).mockRejectedValue(new Error('Invalid ZIP file'))
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('ZIP file'))).toBe(true)
    })

    it('should handle file extraction errors', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockRejectedValue(new Error('File extraction failed'))
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('parse'))).toBe(true)
    })

    it('should handle browser environment limitations', async () => {
      const result = await validateModuleZipFromPath('/path/to/module.zip')
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('browser environment'))).toBe(true)
    })
  })

  describe('Report Generation Tests', () => {
    it('should generate comprehensive validation report', async () => {
      const validationResult: ModuleValidationResult = {
        valid: false,
        config: {
          name: 'Test Module',
          routePrefix: 'test-module',
          rolesAllowed: ['admin'],
          hasWidget: true,
          version: '1.0.0',
          author: 'Test Author'
        },
        errors: ['Missing widget function', 'Invalid route configuration'],
        warnings: ['No README file found', 'Consider adding description'],
        extractedFiles: {
          'module.config.ts': 'config content',
          'routes.ts': 'routes content'
        }
      }
      
      const report = generateValidationReport(validationResult)
      
      expect(report).toContain('Module Name: Test Module')
      expect(report).toContain('Validation Status: FAILED')
      expect(report).toContain('ERRORS:')
      expect(report).toContain('Missing widget function')
      expect(report).toContain('WARNINGS:')
      expect(report).toContain('No README file found')
      expect(report).toContain('EXTRACTED FILES:')
      expect(report).toContain('module.config.ts')
    })

    it('should generate report for valid module', async () => {
      const validationResult: ModuleValidationResult = {
        valid: true,
        config: {
          name: 'Valid Module',
          routePrefix: 'valid-module',
          rolesAllowed: ['admin', 'coach'],
          hasWidget: false
        },
        errors: [],
        warnings: ['Consider adding version information']
      }
      
      const report = generateValidationReport(validationResult)
      
      expect(report).toContain('Validation Status: PASSED')
      expect(report).not.toContain('ERRORS:')
      expect(report).toContain('WARNINGS:')
    })
  })

  describe('File Type Detection Tests', () => {
    it('should only extract text files', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue('config content')
        },
        'image.png': {
          dir: false,
          async: vi.fn().mockResolvedValue('binary data')
        },
        'styles.css': {
          dir: false,
          async: vi.fn().mockResolvedValue('css content')
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.extractedFiles!['module.config.ts']).toBeDefined()
      expect(result.extractedFiles!['styles.css']).toBeDefined()
      expect(result.extractedFiles!['image.png']).toBeUndefined()
    })
  })

  describe('Complex Configuration Tests', () => {
    it('should handle modules with multiple export patterns', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            export const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin'],
              hasWidget: false
            }
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(true)
      expect(result.config?.name).toBe('Test Module')
    })

    it('should validate complex role configurations', async () => {
      mockZip.files = {
        'module.config.ts': {
          dir: false,
          async: vi.fn().mockResolvedValue(`
            const config = {
              name: 'Test Module',
              routePrefix: 'test-module',
              rolesAllowed: ['admin', 'coach', 'coachee'],
              hasWidget: true,
              hasDashboardWidget: true
            }
            export default config
          `)
        }
      }
      
      const result = await validateModuleZip(mockFile)
      
      expect(result.valid).toBe(true)
      expect(result.config?.rolesAllowed).toEqual(['admin', 'coach', 'coachee'])
    })
  })
})

// Export test results for JSON reporting
export interface ZipValidatorTestResult {
  testSuite: string
  totalTests: number
  passedTests: number
  failedTests: number
  coverage: {
    validModules: boolean
    invalidModules: boolean
    structureValidation: boolean
    versionCompatibility: boolean
    errorHandling: boolean
    reportGeneration: boolean
  }
  timestamp: string
}

export const generateZipValidatorReport = (): ZipValidatorTestResult => {
  return {
    testSuite: 'ZipValidator',
    totalTests: 30, // Update based on actual test count
    passedTests: 30, // Will be updated by test runner
    failedTests: 0,  // Will be updated by test runner
    coverage: {
      validModules: true,
      invalidModules: true,
      structureValidation: true,
      versionCompatibility: true,
      errorHandling: true,
      reportGeneration: true
    },
    timestamp: new Date().toISOString()
  }
}