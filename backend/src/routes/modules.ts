import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import Module from '../models/Module'
import { auth, requireRole } from '../middleware/auth'
import { ApiResponse } from '../utils/response'

const router = Router()

// Get all modules (with filtering)
router.get('/', auth, [
  query('enabled').optional().isBoolean(),
  query('role').optional().isIn(['admin', 'coach', 'coachee']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { enabled, role, search } = req.query
    const filter: any = {}

    // Apply filters
    if (enabled !== undefined) {
      filter.enabled = enabled === 'true'
    }

    if (role) {
      filter.rolesAllowed = { $in: [role] }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Role-based filtering
    const user = req.user!
    if (user.role !== 'admin') {
      // Non-admin users only see modules they have permission for
      filter.rolesAllowed = { $in: [user.role] }
      
      if (user.modulePermissions && user.modulePermissions.length > 0) {
        filter.key = { $in: user.modulePermissions }
      }
    }

    const modules = await Module.find(filter).sort({ name: 1 })
    
    ApiResponse.success(res, 'Modules retrieved successfully', modules)
  } catch (error) {
    console.error('Get modules error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve modules')
  }
})

// Get single module
router.get('/:key', auth, [
  param('key').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { key } = req.params
    const module = await Module.findOne({ key })

    if (!module) {
      return ApiResponse.notFound(res, 'Module not found')
    }

    // Check permissions
    const user = req.user!
    if (user.role !== 'admin') {
      const hasRoleAccess = module.rolesAllowed.includes(user.role)
      const hasModulePermission = user.modulePermissions?.includes(key)
      
      if (!hasRoleAccess || (user.role !== 'admin' && !hasModulePermission)) {
        return ApiResponse.forbidden(res, 'Access denied to this module')
      }
    }

    ApiResponse.success(res, 'Module retrieved successfully', module)
  } catch (error) {
    console.error('Get module error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve module')
  }
})

// Create module (admin only)
router.post('/', auth, requireRole('admin'), [
  body('key').isString().notEmpty().matches(/^[a-z0-9-]+$/),
  body('name').isString().notEmpty(),
  body('routePrefix').isString().notEmpty(),
  body('rolesAllowed').isArray().notEmpty(),
  body('rolesAllowed.*').isIn(['admin', 'coach', 'coachee']),
  body('hasWidget').isBoolean(),
  body('description').optional().isString(),
  body('version').optional().matches(/^\d+\.\d+\.\d+$/),
  body('author').optional().isString(),
  body('compatibleWithCore').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { key } = req.body

    // Check if module already exists
    const existingModule = await Module.findOne({ key })
    if (existingModule) {
      return ApiResponse.conflict(res, 'Module with this key already exists')
    }

    const module = new Module({
      ...req.body,
      enabled: true,
      installed: true,
      createdBy: req.user!.id,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await module.save()

    ApiResponse.created(res, 'Module created successfully', module)
  } catch (error) {
    console.error('Create module error:', error)
    ApiResponse.serverError(res, 'Failed to create module')
  }
})

// Update module (admin only)
router.put('/:key', auth, requireRole('admin'), [
  param('key').isString().notEmpty(),
  body('name').optional().isString().notEmpty(),
  body('description').optional().isString(),
  body('version').optional().matches(/^\d+\.\d+\.\d+$/),
  body('author').optional().isString(),
  body('rolesAllowed').optional().isArray().notEmpty(),
  body('rolesAllowed.*').optional().isIn(['admin', 'coach', 'coachee']),
  body('hasWidget').optional().isBoolean(),
  body('enabled').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { key } = req.params
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: req.user!.id
    }

    const module = await Module.findOneAndUpdate(
      { key },
      updateData,
      { new: true, runValidators: true }
    )

    if (!module) {
      return ApiResponse.notFound(res, 'Module not found')
    }

    ApiResponse.success(res, 'Module updated successfully', module)
  } catch (error) {
    console.error('Update module error:', error)
    ApiResponse.serverError(res, 'Failed to update module')
  }
})

// Toggle module enabled status (admin only)
router.patch('/:key/toggle', auth, requireRole('admin'), [
  param('key').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { key } = req.params
    const module = await Module.findOne({ key })

    if (!module) {
      return ApiResponse.notFound(res, 'Module not found')
    }

    module.enabled = !module.enabled
    module.updatedAt = new Date()
    module.updatedBy = req.user!.id

    await module.save()

    ApiResponse.success(res, `Module ${module.enabled ? 'enabled' : 'disabled'} successfully`, module)
  } catch (error) {
    console.error('Toggle module error:', error)
    ApiResponse.serverError(res, 'Failed to toggle module')
  }
})

// Delete module (admin only)
router.delete('/:key', auth, requireRole('admin'), [
  param('key').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { key } = req.params
    const module = await Module.findOneAndDelete({ key })

    if (!module) {
      return ApiResponse.notFound(res, 'Module not found')
    }

    ApiResponse.success(res, 'Module deleted successfully', { key })
  } catch (error) {
    console.error('Delete module error:', error)
    ApiResponse.serverError(res, 'Failed to delete module')
  }
})

// Get module health status (admin only)
router.get('/:key/health', auth, requireRole('admin'), [
  param('key').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { key } = req.params
    const module = await Module.findOne({ key })

    if (!module) {
      return ApiResponse.notFound(res, 'Module not found')
    }

    // Simple health check - in production this would be more sophisticated
    const health = {
      moduleKey: key,
      status: module.enabled && !module.error ? 'healthy' : 'error',
      lastCheck: new Date().toISOString(),
      enabled: module.enabled,
      error: module.error,
      uptime: Date.now() - module.createdAt.getTime()
    }

    ApiResponse.success(res, 'Module health retrieved successfully', health)
  } catch (error) {
    console.error('Get module health error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve module health')
  }
})

module.exports = router