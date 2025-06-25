import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string
  name: string
  role: 'admin' | 'coach' | 'coachee'
  mandant: string
  avatar?: string
  modulePermissions: string[]
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'coach', 'coachee'],
    default: 'coachee'
  },
  mandant: {
    type: String,
    required: true,
    default: '*'
  },
  avatar: {
    type: String,
    default: ''
  },
  modulePermissions: [{
    type: String
  }]
}, {
  timestamps: true
})

// Index for performance
UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ mandant: 1 })

export default mongoose.model<IUser>('User', UserSchema)