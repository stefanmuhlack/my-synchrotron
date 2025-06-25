import mongoose, { Document, Schema } from 'mongoose'

export interface ITask extends Document {
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  userId: mongoose.Types.ObjectId
  assignedBy?: mongoose.Types.ObjectId
  goalId?: mongoose.Types.ObjectId
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>({
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
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  goalId: {
    type: Schema.Types.ObjectId,
    ref: 'Goal'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for performance
TaskSchema.index({ userId: 1 })
TaskSchema.index({ assignedBy: 1 })
TaskSchema.index({ goalId: 1 })
TaskSchema.index({ status: 1 })
TaskSchema.index({ priority: 1 })
TaskSchema.index({ dueDate: 1 })
TaskSchema.index({ createdAt: -1 })

// Auto-set completedAt when status changes to completed
TaskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date()
    } else if (this.status !== 'completed') {
      this.completedAt = undefined
    }
  }
  next()
})

// Auto-update overdue status
TaskSchema.pre('find', function() {
  const now = new Date()
  this.updateMany(
    { 
      dueDate: { $lt: now }, 
      status: { $in: ['pending', 'in-progress'] } 
    },
    { status: 'overdue' }
  )
})

export default mongoose.model<ITask>('Task', TaskSchema)