import mongoose, { Document, Schema } from 'mongoose'

export interface IModule extends Document {
  key: string
  name: string
  routePrefix: string
  rolesAllowed: ('admin' | 'coach' | 'coachee')[]
  hasWidget: boolean
  description?: string
  version?: string
  author?: string
  compatibleWithCore?: string
  enabled: boolean
  installed: boolean
  error?: string
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
}

const ModuleSchema = new Schema<IModule>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  routePrefix: {
    type: String,
    required: true,
    trim: true
  },
  rolesAllowed: [{
    type: String,
    enum: ['admin', 'coach', 'coachee'],
    required: true
  }],
  hasWidget: {
    type: Boolean,
    required: true,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    trim: true,
    match: /^\d+\.\d+\.\d+$/
  },
  author: {
    type: String,
    trim: true
  },
  compatibleWithCore: {
    type: String,
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  installed: {
    type: Boolean,
    default: true
  },
  error: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes for performance
ModuleSchema.index({ key: 1 })
ModuleSchema.index({ enabled: 1 })
ModuleSchema.index({ rolesAllowed: 1 })
ModuleSchema.index({ createdBy: 1 })

export default mongoose.model<IModule>('Module', ModuleSchema)