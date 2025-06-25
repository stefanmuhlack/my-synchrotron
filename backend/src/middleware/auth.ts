import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User, { IUser } from '../models/User'
import { ApiResponse } from '../utils/response'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

export interface JWTPayload {
  userId: string
  role: string
  iat: number
  exp: number
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return ApiResponse.unauthorized(res, 'Access token required')
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid token - user not found')
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return ApiResponse.unauthorized(res, 'Invalid token')
    }
    if (error instanceof jwt.TokenExpiredError) {
      return ApiResponse.unauthorized(res, 'Token expired')
    }
    
    console.error('Auth middleware error:', error)
    return ApiResponse.serverError(res, 'Authentication failed')
  }
}

/**
 * Role-based authorization middleware
 * Requires specific role to access endpoint
 */
export const requireRole = (role: 'admin' | 'coach' | 'coachee') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required')
    }

    if (req.user.role !== role) {
      return ApiResponse.forbidden(res, `${role} role required`)
    }

    next()
  }
}

/**
 * Multiple roles authorization middleware
 * Requires one of the specified roles to access endpoint
 */
export const requireAnyRole = (roles: ('admin' | 'coach' | 'coachee')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required')
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, `One of these roles required: ${roles.join(', ')}`)
    }

    next()
  }
}

/**
 * Module permission middleware
 * Checks if user has permission to access specific module
 */
export const requireModulePermission = (moduleKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required')
    }

    // Admin has access to all modules
    if (req.user.role === 'admin') {
      return next()
    }

    // Check if user has permission for this module
    if (!req.user.modulePermissions?.includes(moduleKey)) {
      return ApiResponse.forbidden(res, `Access denied to module: ${moduleKey}`)
    }

    next()
  }
}

/**
 * Owner or admin middleware
 * Allows access if user is admin or owns the resource
 */
export const requireOwnerOrAdmin = (userIdField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required')
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next()
    }

    // Get the user ID from request params or body
    const resourceUserId = req.params[userIdField] || req.body[userIdField]
    
    if (req.user.id !== resourceUserId) {
      return ApiResponse.forbidden(res, 'Access denied - not owner or admin')
    }

    next()
  }
}