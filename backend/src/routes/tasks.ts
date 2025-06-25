import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import Task from '../models/Task'
import { auth } from '../middleware/auth'
import { ApiResponse } from '../utils/response'

const router = Router()

// Get all tasks (filtered by user permissions)
router.get('/', auth, [
  query('status').optional().isIn(['pending', 'in-progress', 'completed', 'overdue']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('userId').optional().isMongoId(),
  query('goalId').optional().isMongoId(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { status, priority, userId, goalId, search } = req.query
    const currentUser = req.user!
    const filter: any = {}

    // Role-based filtering
    if (currentUser.role === 'admin') {
      // Admin sees all tasks, can filter by userId
      if (userId) filter.userId = userId
    } else if (currentUser.role === 'coach') {
      // Coach sees tasks of their coachees and their own
      filter.$or = [
        { userId: currentUser.id },
        { assignedBy: currentUser.id }
      ]
      if (userId) filter.userId = userId
    } else {
      // Coachees see only their own tasks
      filter.userId = currentUser.id
    }

    // Additional filters
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (goalId) filter.goalId = goalId
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const tasks = await Task.find(filter)
      .populate('userId', 'name email')
      .populate('assignedBy', 'name email')
      .populate('goalId', 'title')
      .sort({ createdAt: -1 })

    ApiResponse.success(res, 'Tasks retrieved successfully', tasks)
  } catch (error) {
    console.error('Get tasks error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve tasks')
  }
})

// Get single task
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

    const task = await Task.findById(id)
      .populate('userId', 'name email')
      .populate('assignedBy', 'name email')
      .populate('goalId', 'title')

    if (!task) {
      return ApiResponse.notFound(res, 'Task not found')
    }

    // Check permissions
    const hasAccess = currentUser.role === 'admin' ||
                     task.userId.toString() === currentUser.id ||
                     task.assignedBy?.toString() === currentUser.id

    if (!hasAccess) {
      return ApiResponse.forbidden(res, 'Access denied')
    }

    ApiResponse.success(res, 'Task retrieved successfully', task)
  } catch (error) {
    console.error('Get task error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve task')
  }
})

// Create task
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'overdue']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601(),
  body('userId').optional().isMongoId(),
  body('goalId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const currentUser = req.user!
    const taskData = {
      ...req.body,
      userId: req.body.userId || currentUser.id,
      status: req.body.status || 'pending',
      priority: req.body.priority || 'medium'
    }

    // Set assignedBy if creating task for someone else
    if (taskData.userId !== currentUser.id) {
      if (currentUser.role === 'admin' || currentUser.role === 'coach') {
        taskData.assignedBy = currentUser.id
      } else {
        return ApiResponse.forbidden(res, 'Cannot create tasks for other users')
      }
    }

    const task = new Task(taskData)
    await task.save()

    const populatedTask = await Task.findById(task._id)
      .populate('userId', 'name email')
      .populate('assignedBy', 'name email')
      .populate('goalId', 'title')

    ApiResponse.created(res, 'Task created successfully', populatedTask)
  } catch (error) {
    console.error('Create task error:', error)
    ApiResponse.serverError(res, 'Failed to create task')
  }
})

// Update task
router.put('/:id', auth, [
  param('id').isMongoId(),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'overdue']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array())
    }

    const { id } = req.params
    const currentUser = req.user!

    const task = await Task.findById(id)
    if (!task) {
      return ApiResponse.notFound(res, 'Task not found')
    }

    // Check permissions
    const canEdit = currentUser.role === 'admin' ||
                   task.userId.toString() === currentUser.id ||
                   task.assignedBy?.toString() === currentUser.id

    if (!canEdit) {
      return ApiResponse.forbidden(res, 'Access denied')
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    }

    // If marking as completed, set completedAt
    if (req.body.status === 'completed' && task.status !== 'completed') {
      updateData.completedAt = new Date()
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email')
     .populate('assignedBy', 'name email')
     .populate('goalId', 'title')

    ApiResponse.success(res, 'Task updated successfully', updatedTask)
  } catch (error) {
    console.error('Update task error:', error)
    ApiResponse.serverError(res, 'Failed to update task')
  }
})

// Delete task
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

    const task = await Task.findById(id)
    if (!task) {
      return ApiResponse.notFound(res, 'Task not found')
    }

    // Check permissions
    const canDelete = currentUser.role === 'admin' ||
                     task.userId.toString() === currentUser.id ||
                     task.assignedBy?.toString() === currentUser.id

    if (!canDelete) {
      return ApiResponse.forbidden(res, 'Access denied')
    }

    await Task.findByIdAndDelete(id)

    ApiResponse.success(res, 'Task deleted successfully', { id })
  } catch (error) {
    console.error('Delete task error:', error)
    ApiResponse.serverError(res, 'Failed to delete task')
  }
})

// Get task statistics
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
        { assignedBy: currentUser.id }
      ]
    }
    // Admin sees all tasks (no filter)

    const totalTasks = await Task.countDocuments(filter)
    const completedTasks = await Task.countDocuments({ ...filter, status: 'completed' })
    const inProgressTasks = await Task.countDocuments({ ...filter, status: 'in-progress' })
    const pendingTasks = await Task.countDocuments({ ...filter, status: 'pending' })
    const overdueTasks = await Task.countDocuments({ ...filter, status: 'overdue' })

    // Priority breakdown
    const highPriorityTasks = await Task.countDocuments({ ...filter, priority: 'high' })
    const mediumPriorityTasks = await Task.countDocuments({ ...filter, priority: 'medium' })
    const lowPriorityTasks = await Task.countDocuments({ ...filter, priority: 'low' })

    const stats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      lastUpdated: new Date().toISOString()
    }

    ApiResponse.success(res, 'Task statistics retrieved successfully', stats)
  } catch (error) {
    console.error('Get task stats error:', error)
    ApiResponse.serverError(res, 'Failed to retrieve task statistics')
  }
})

module.exports = router