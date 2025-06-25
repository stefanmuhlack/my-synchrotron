import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import User from '../models/User'
import { auth, requireRole } from '../middleware/auth'
import { ApiResponse } from '../utils/response'

const router = Router()

// Get all users (admin only, or filtered for coaches)
router.get('/', auth, [
  query('role').optional().isIn(['admin', 'coach', 'coachee']),
  query('mandant').optional().isString(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { role, mandant, search } = req.query
    const currentUser = req.user!
    const filter: any = {}

    // Role-based filtering
    if (currentUser.role === 'admin') {
      // Admin sees all users, can filter by role and mandant
      if (role) filter.role = role
      if (mandant) filter.mandant = mandant
    } else if (currentUser.role === 'coach') {
      // Coach sees only their coachees and themselves
      filter.$or = [
        { mandant: currentUser.id },
        { _id: currentUser.id }
      ]
    } else {
      // Coachees see only themselves
      filter._id = currentUser.id
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(filter)
      .select('-password -hashedPassword')
      .sort({ name: 1 })

    ApiResponse.success(res, 'Users retrieved successfully', users)
  } catch (error) {
    console.error('Get users error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve users')
  }
})

// Get single user
router.get('/:id', auth, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { id } = req.params
    const currentUser = req.user!

    // Check permissions
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      if (currentUser.role === 'coach') {
        // Check if this user is their coachee
        const targetUser = await User.findById(id)
        if (!targetUser || targetUser.mandant !== currentUser.id) {
          return ApiResponse.forbidden(res, 'Access denied')
        }
      } else {
        return ApiResponse.forbidden(res, 'Access denied')
      }
    }

    const user = await User.findById(id).select('-password -hashedPassword')

    if (!user) {
      return ApiResponse.notFound(res, 'User not found')
    }

    ApiResponse.success(res, 'User retrieved successfully', user)
  } catch (error) {
    console.error('Get user error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve user')
  }
})

// Create user (admin only)
router.post('/', auth, requireRole('admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['admin', 'coach', 'coachee']),
  body('mandant').optional().isString(),
  body('avatar').optional().isURL(),
  body('modulePermissions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { email, password, name, role, mandant, avatar, modulePermissions } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return ApiResponse.conflict(res, 'User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = new User({
      email,
      password: hashedPassword,
      name,
      role,
      mandant: mandant || '*',
      avatar: avatar || '',
      modulePermissions: modulePermissions || []
    })

    await user.save()

    // Return user without password
    const userResponse = user.toObject()
    delete userResponse.password

    ApiResponse.created(res, 'User created successfully', userResponse)
  } catch (error) {
    console.error('Create user error:', error)
    ApiResponse.serverError(res, 'Failed to create user')
  }
})

// Update user
router.put('/:id', auth, [
  param('id').isMongoId(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('name').optional().trim().isLength({ min: 2 }),
  body('role').optional().isIn(['admin', 'coach', 'coachee']),
  body('mandant').optional().isString(),
  body('avatar').optional().isURL(),
  body('modulePermissions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { id } = req.params
    const currentUser = req.user!
    const updateData = { ...req.body }

    // Check permissions
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return ApiResponse.forbidden(res, 'Access denied')
    }

    // Non-admin users cannot change role or certain fields
    if (currentUser.role !== 'admin') {
      delete updateData.role
      delete updateData.modulePermissions
      delete updateData.mandant
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12)
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return ApiResponse.notFound(res, 'User not found')
    }

    ApiResponse.success(res, 'User updated successfully', user)
  } catch (error) {
    console.error('Update user error:', error)
    ApiResponse.serverError(res, 'Failed to update user')
  }
})

// Update user module permissions (admin only)
router.patch('/:id/permissions', auth, requireRole('admin'), [
  param('id').isMongoId(),
  body('modulePermissions').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { id } = req.params
    const { modulePermissions } = req.body

    const user = await User.findByIdAndUpdate(
      id,
      { modulePermissions },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return ApiResponse.notFound(res, 'User not found')
    }

    ApiResponse.success(res, 'User permissions updated successfully', user)
  } catch (error) {
    console.error('Update user permissions error:', error)
    ApiResponse.serverError(res, 'Failed to update user permissions')
  }
})

// Delete user (admin only, cannot delete self)
router.delete('/:id', auth, requireRole('admin'), [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { id } = req.params
    const currentUser = req.user!

    // Cannot delete self
    if (currentUser.id === id) {
      return ApiResponse.badRequest(res, 'Cannot delete your own account')
    }

    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return ApiResponse.notFound(res, 'User not found')
    }

    ApiResponse.success(res, 'User deleted successfully', { id })
  } catch (error) {
    console.error('Delete user error:', error)
    ApiResponse.serverError(res, 'Failed to delete user')
  }
})

// Get user statistics (admin only)
router.get('/stats/overview', auth, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const adminCount = await User.countDocuments({ role: 'admin' })
    const coachCount = await User.countDocuments({ role: 'coach' })
    const coacheeCount = await User.countDocuments({ role: 'coachee' })

    const stats = {
      totalUsers,
      adminCount,
      coachCount,
      coacheeCount,
      lastUpdated: new Date().toISOString()
    }

    ApiResponse.success(res, 'User statistics retrieved successfully', stats)
  } catch (error) {
    console.error('Get user stats error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve user statistics')
  }
})

module.exports = router