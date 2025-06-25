import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationError } from 'express-validator'
import { ApiResponse } from '../utils/response'

/**
 * Validation middleware
 * Checks for validation errors and returns formatted response
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }))
    
    return ApiResponse.badRequest(res, 'Validation failed', formattedErrors)
  }
  
  next()
}

/**
 * Sanitize request body
 * Removes undefined and null values, trims strings
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  next()
}

/**
 * Recursively sanitize object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject).filter(item => item !== undefined && item !== null)
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          sanitized[key] = value.trim()
        } else {
          sanitized[key] = sanitizeObject(value)
        }
      }
    }
    
    return sanitized
  }
  
  if (typeof obj === 'string') {
    return obj.trim()
  }
  
  return obj
}

/**
 * Rate limiting validation
 * Checks if request rate is within limits
 */
export const validateRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>()
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get existing requests for this client
    const clientRequests = requests.get(clientId) || []
    
    // Filter out old requests
    const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return ApiResponse.tooManyRequests(res, 'Rate limit exceeded')
    }
    
    // Add current request
    recentRequests.push(now)
    requests.set(clientId, recentRequests)
    
    next()
  }
}

/**
 * File upload validation
 * Validates file type, size, etc.
 */
export const validateFileUpload = (options: {
  allowedTypes?: string[]
  maxSize?: number
  required?: boolean
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file
    
    if (!file && options.required) {
      return ApiResponse.badRequest(res, 'File is required')
    }
    
    if (file) {
      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
        return ApiResponse.badRequest(res, `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`)
      }
      
      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        return ApiResponse.badRequest(res, `File too large. Maximum size: ${options.maxSize} bytes`)
      }
    }
    
    next()
  }
}

/**
 * MongoDB ObjectId validation
 */
export const validateObjectId = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[field] || req.body[field]
    
    if (value && !/^[0-9a-fA-F]{24}$/.test(value)) {
      return ApiResponse.badRequest(res, `Invalid ${field} format`)
    }
    
    next()
  }
}