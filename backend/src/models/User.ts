import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string
  name: string
  role: 'admin' | 'coach' | 'coachee'
  mandant: string
  avatar?: string
  modulePermissions: string[]
  lastLogin?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
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
    type: String,
    trim: true
  }],
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes for performance
UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ mandant: 1 })
UserSchema.index({ isActive: 1 })

// Virtual for id (to match frontend expectations)
UserSchema.virtual('id').get(function() {
  return this._id.toHexString()
})

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.__v
    delete ret.password
    return ret
  }
})

export default mongoose.model<IUser>('User', UserSchema)