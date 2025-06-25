import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import Goal from '../models/Goal'
import { auth } from '../middleware/auth'
import { ApiResponse } from '../utils/response'

const router = Router()

// Get all goals (filtered by user permissions)
router.get('/', auth, [
  query('status').optional().isIn(['not-started', 'in-progress', 'completed', 'on-hold']),
  query('userId').optional().isMongoId(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { status, userId, search } = req.query
    const currentUser = req.user!
    const filter: any = {}

    // Role-based filtering
    if (currentUser.role === 'admin') {
      // Admin sees all goals, can filter by userId
      if (userId) filter.userId = userId
    } else if (currentUser.role === 'coach') {
      // Coach sees goals of their coachees and their own
      filter.$or = [
        { userId: currentUser.id },
        { coachId: currentUser.id }
      ]
      if (userId) filter.userId = userId
    } else {
      // Coachees see only their own goals
      filter.userId = currentUser.id
    }

    // Additional filters
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const goals = await Goal.find(filter)
      .populate('userId', 'name email')
      .populate('coachId', 'name email')
      .sort({ createdAt: -1 })

    ApiResponse.success(res, 'Goals retrieved successfully', goals)
  } catch (error) {
    console.error('Get goals error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve goals')
  }
})

// Get single goal
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

    const goal = await Goal.findById(id)
      .populate('userId', 'name email')
      .populate('coachId', 'name email')

    if (!goal) {
      return ApiResponse.notFound(res, 'Goal not found')
    }

    // Check permissions
    const hasAccess = currentUser.role === 'admin' ||
                     goal.userId.toString() === currentUser.id ||
                     goal.coachId?.toString() === currentUser.id

    if (!hasAccess) {
      return ApiResponse.forbidden(res, 'Access denied')
    }

    ApiResponse.success(res, 'Goal retrieved successfully', goal)
  } catch (error) {
    console.error('Get goal error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve goal')
  }
})

// Create goal
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('status').optional().isIn(['not-started', 'in-progress', 'completed', 'on-hold']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('dueDate').optional().isISO8601(),
  body('userId').optional().isMongoId(),
  body('coachId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const currentUser = req.user!
    const goalData = {
      ...req.body,
      userId: req.body.userId || currentUser.id,
      status: req.body.status || 'not-started',
      progress: req.body.progress || 0
    }

    // Set coach based on role and permissions
    if (currentUser.role === 'coach') {
      goalData.coachId = currentUser.id
    } else if (currentUser.role === 'coachee' && !goalData.coachId) {
      // Find the coach for this coachee
      const User = require('../models/User')
      const coachee = await User.findById(currentUser.id)
      if (coachee && coachee.mandant !== '*') {
        goalData.coachId = coachee.mandant
      }
    }

    // Permission check for creating goals for other users
    if (goalData.userId !== currentUser.id && currentUser.role !== 'admin') {
      if (currentUser.role !== 'coach') {
        return ApiResponse.forbidden(res, 'Cannot create goals for other users')
      }
    }

    const goal = new Goal(goalData)
    await goal.save()

    const populatedGoal = await Goal.findById(goal._id)
      .populate('userId', 'name email')
      .populate('coachId', 'name email')

    ApiResponse.created(res, 'Goal created successfully', populatedGoal)
  } catch (error) {
    console.error('Create goal error:', error)
    ApiResponse.serverError(res, 'Failed to create goal')
  }
})

// Update goal
router.put('/:id', auth, [
  param('id').isMongoId(),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('status').optional().isIn(['not-started', 'in-progress', 'completed', 'on-hold']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { id } = req.params
    const currentUser = req.user!

    const goal = await Goal.findById(id)
    if (!goal) {
      return ApiResponse.notFound(res, 'Goal not found')
    }

    // Check permissions
    const canEdit = currentUser.role === 'admin' ||
                   goal.userId.toString() === currentUser.id ||
                   goal.coachId?.toString() === currentUser.id

    if (!canEdit) {
      return ApiResponse.forbidden(res, 'Access denied')
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    }

    const updatedGoal = await Goal.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email')
     .populate('coachId', 'name email')

    ApiResponse.success(res, 'Goal updated successfully', updatedGoal)
  } catch (error) {
    console.error('Update goal error:', error)
    ApiResponse.serverError(res, 'Failed to update goal')
  }
})

// Delete goal
router.delete('/:id', auth, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { id } = req.params
    const currentUser = req.user!

    const goal = await Goal.findById(id)
    if (!goal) {
      return ApiResponse.notFound(res, 'Goal not found')
    }

    // Check permissions
    const canDelete = currentUser.role === 'admin' ||
                     goal.userId.toString() === currentUser.id ||
                     goal.coachId?.toString() === currentUser.id

    if (!canDelete) {
      return ApiResponse.forbidden(res, 'Access denied')
    }

    await Goal.findByIdAndDelete(id)

    ApiResponse.success(res, 'Goal deleted successfully', { id })
  } catch (error) {
    console.error('Delete goal error:', error)
    ApiResponse.serverError(res, 'Failed to delete goal')
  }
})

// Get goal statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const currentUser = req.user!
    const filter: any = {}

    // Apply role-based filtering
    if (currentUser.role === 'coachee') {
      filter.userId = currentUser.id
    } else if (currentUser.role === 'coach') {
      filter.$or = [
        { userId: currentUser.id },
        { coachId: currentUser.id }
      ]
    }
    // Admin sees all goals (no filter)

    const totalGoals = await Goal.countDocuments(filter)
    const completedGoals = await Goal.countDocuments({ ...filter, status: 'completed' })
    const inProgressGoals = await Goal.countDocuments({ ...filter, status: 'in-progress' })
    const notStartedGoals = await Goal.countDocuments({ ...filter, status: 'not-started' })
    const onHoldGoals = await Goal.countDocuments({ ...filter, status: 'on-hold' })

    const stats = {
      totalGoals,
      completedGoals,
      inProgressGoals,
      notStartedGoals,
      onHoldGoals,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      lastUpdated: new Date().toISOString()
    }

    ApiResponse.success(res, 'Goal statistics retrieved successfully', stats)
  } catch (error) {
    console.error('Get goal stats error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve goal statistics')
  }
})

module.exports = router