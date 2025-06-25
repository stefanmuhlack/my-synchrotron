import mongoose, { Document, Schema } from 'mongoose'

export interface IGoal extends Document {
  title: string
  description?: string
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold'
  progress: number
  dueDate?: Date
  userId: mongoose.Types.ObjectId
  coachId?: mongoose.Types.ObjectId
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const GoalSchema = new Schema<IGoal>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'on-hold'],
    default: 'not-started'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  dueDate: {
    type: Date
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coachId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for performance
GoalSchema.index({ userId: 1 })
GoalSchema.index({ coachId: 1 })
GoalSchema.index({ status: 1 })
GoalSchema.index({ dueDate: 1 })
GoalSchema.index({ createdAt: -1 })

// Auto-set completedAt when status changes to completed
GoalSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date()
      this.progress = 100
    } else if (this.status !== 'completed') {
      this.completedAt = undefined
    }
  }
  next()
})

export default mongoose.model<IGoal>('Goal', GoalSchema)