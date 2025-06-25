import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import User from '../models/User'

const router = Router()

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      })
    }

    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )

    // Return user data (without password)
    const userResponse = user.toObject()
    delete userResponse.password

    res.json({
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['admin', 'coach', 'coachee'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      })
    }

    const { email, password, name, role, mandant } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role,
      mandant: mandant || '*',
      modulePermissions: []
    })

    await user.save()

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )

    // Return user data (without password)
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(201).json({
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        error: 'No token provided'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token'
      })
    }

    res.json({
      user: user.toObject()
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(401).json({
      error: 'Invalid token'
    })
  }
})

module.exports = router