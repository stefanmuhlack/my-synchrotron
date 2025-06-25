import { describe, it, expect } from 'vitest'
import { ModuleTestRunner } from '@/utils/moduleTestRunner'

describe('Goals Module Self-Test', () => {
  let testRunner: ModuleTestRunner

  beforeEach(() => {
    testRunner = new ModuleTestRunner()
  })

  it('should validate Goals module configuration', async () => {
    const result = await testRunner.runSingleModuleTest('goals')
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.config).toBeDefined()
    
    if (result.config) {
      expect(result.config.name).toBe('Goal Management')
      expect(result.config.routePrefix).toBe('goals')
      expect(result.config.rolesAllowed).toContain('coach')
      expect(result.config.rolesAllowed).toContain('coachee')
      expect(result.config.hasWidget).toBe(true)
    }
  })

  it('should have valid routes function', async () => {
    const result = await testRunner.runSingleModuleTest('goals')
    
    expect(result.valid).toBe(true)
    expect(result.errors.some(e => e.includes('routes'))).toBe(false)
  })

  it('should have valid widget function', async () => {
    const result = await testRunner.runSingleModuleTest('goals')
    
    expect(result.valid).toBe(true)
    expect(result.errors.some(e => e.includes('widget'))).toBe(false)
  })

  it('should have proper version information', async () => {
    const result = await testRunner.runSingleModuleTest('goals')
    
    if (result.config?.version) {
      const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/
      expect(semverPattern.test(result.config.version)).toBe(true)
    }
  })

  it('should be compatible with current core version', async () => {
    const result = await testRunner.runSingleModuleTest('goals')
    
    expect(result.errors.some(e => e.includes('core version'))).toBe(false)
  })
})