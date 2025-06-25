import { Response } from 'express'

export interface ApiResponseData {
  success: boolean
  message: string
  data?: any
  errors?: any[]
  timestamp: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Standardized API response utility
 */
export class ApiResponse {
  /**
   * Success response (200)
   */
  static success(res: Response, message: string, data?: any, pagination?: any): Response {
    const response: ApiResponseData = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    }
    
    if (pagination) {
      response.pagination = pagination
    }
    
    return res.status(200).json(response)
  }

  /**
   * Created response (201)
   */
  static created(res: Response, message: string, data?: any): Response {
    const response: ApiResponseData = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    }
    
    return res.status(201).json(response)
  }

  /**
   * No content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(204).send()
  }

  /**
   * Bad request response (400)
   */
  static badRequest(res: Response, message: string, errors?: any[]): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    }
    
    return res.status(400).json(response)
  }

  /**
   * Unauthorized response (401)
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    }
    
    return res.status(401).json(response)
  }

  /**
   * Forbidden response (403)
   */
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    }
    
    return res.status(403).json(response)
  }

  /**
   * Not found response (404)
   */
  static notFound(res: Response, message: string = 'Resource not found'): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    }
    
    return res.status(404).json(response)
  }

  /**
   * Conflict response (409)
   */
  static conflict(res: Response, message: string, errors?: any[]): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    }
    
    return res.status(409).json(response)
  }

  /**
   * Too many requests response (429)
   */
  static tooManyRequests(res: Response, message: string = 'Too many requests'): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    }
    
    return res.status(429).json(response)
  }

  /**
   * Internal server error response (500)
   */
  static serverError(res: Response, message: string = 'Internal server error', errors?: any[]): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    }
    
    return res.status(500).json(response)
  }

  /**
   * Custom response
   */
  static custom(res: Response, statusCode: number, message: string, data?: any, errors?: any[]): Response {
    const response: ApiResponseData = {
      success: statusCode < 400,
      message,
      data,
      errors,
      timestamp: new Date().toISOString()
    }
    
    return res.status(statusCode).json(response)
  }

  /**
   * Paginated response
   */
  static paginated(
    res: Response, 
    message: string, 
    data: any[], 
    page: number, 
    limit: number, 
    total: number
  ): Response {
    const pages = Math.ceil(total / limit)
    
    const response: ApiResponseData = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total,
        pages
      }
    }
    
    return res.status(200).json(response)
  }
}