/**
 * Core Application Version
 * 
 * This file defines the current version of the core application.
 * Used for module compatibility checking with semver.
 */

export const CORE_VERSION = '1.0.0'

export const VERSION_INFO = {
  major: 1,
  minor: 0,
  patch: 0,
  prerelease: null,
  build: null,
  full: CORE_VERSION
}

export const COMPATIBILITY = {
  minModuleVersion: '0.1.0',
  maxModuleVersion: '2.0.0',
  recommendedRange: `^${CORE_VERSION}`
}

/**
 * Version history and changelog
 */
export const VERSION_HISTORY = [
  {
    version: '1.0.0',
    date: '2024-01-01',
    changes: [
      'Initial release',
      'Module system with version compatibility',
      'Role-based access control',
      'Dashboard widgets'
    ]
  }
]

export default CORE_VERSION