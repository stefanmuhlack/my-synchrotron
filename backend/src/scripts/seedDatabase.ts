import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User'
import Module from '../models/Module'
import Goal from '../models/Goal'
import Task from '../models/Task'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface SeedUser {
  email: string
  password: string
  name: string
  role: 'admin' | 'coach' | 'coachee'
  mandant: string
  avatar?: string
  modulePermissions?: string[]
}

interface SeedModule {
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
}

interface SeedGoal {
  title: string
  description?: string
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold'
  progress: number
  dueDate?: string
  userEmail: string
  coachEmail?: string
}

interface SeedTask {
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  userEmail: string
  assignedByEmail?: string
}

// Seed data
const seedUsers: SeedUser[] = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin',
    mandant: '*',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1'
  },
  {
    email: 'coach1@example.com',
    password: 'coach123',
    name: 'John Coach',
    role: 'coach',
    mandant: '*',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1',
    modulePermissions: ['goals', 'tasks', 'sgnb']
  },
  {
    email: 'coach2@example.com',
    password: 'coach123',
    name: 'Jane Coach',
    role: 'coach',
    mandant: '*',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1',
    modulePermissions: ['goals', 'tasks']
  },
  {
    email: 'coachee1@example.com',
    password: 'coachee123',
    name: 'Alice Coachee',
    role: 'coachee',
    mandant: '2', // Will be updated to coach1's ObjectId
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1',
    modulePermissions: ['goals', 'tasks']
  },
  {
    email: 'coachee2@example.com',
    password: 'coachee123',
    name: 'Bob Coachee',
    role: 'coachee',
    mandant: '2', // Will be updated to coach1's ObjectId
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1',
    modulePermissions: ['goals']
  },
  {
    email: 'coachee3@example.com',
    password: 'coachee123',
    name: 'Carol Coachee',
    role: 'coachee',
    mandant: '3', // Will be updated to coach2's ObjectId
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1',
    modulePermissions: ['tasks', 'checklists']
  }
]

const seedModules: SeedModule[] = [
  {
    key: 'goals',
    name: 'Goal Management',
    routePrefix: 'goals',
    rolesAllowed: ['coach', 'coachee'],
    hasWidget: true,
    version: '1.0.0',
    compatibleWithCore: '^1.0.0',
    description: 'Manage and track goals for coaching sessions',
    author: 'System',
    enabled: true
  },
  {
    key: 'tasks',
    name: 'Task Management',
    routePrefix: 'tasks',
    rolesAllowed: ['coach', 'coachee'],
    hasWidget: true,
    version: '1.0.0',
    compatibleWithCore: '^1.0.0',
    description: 'Manage and track tasks and assignments',
    author: 'System',
    enabled: true
  },
  {
    key: 'sgnb',
    name: 'SGNB Management',
    routePrefix: 'sgnb',
    rolesAllowed: ['coach', 'admin'],
    hasWidget: true,
    version: '1.0.0',
    compatibleWithCore: '^1.0.0',
    description: 'Systematic Goal-oriented Needs-based Coaching (SGNB) management system',
    author: 'System',
    enabled: true
  },
  {
    key: 'checklists',
    name: 'Checklisten',
    routePrefix: 'checklists',
    rolesAllowed: ['coachee', 'coach', 'admin'],
    hasWidget: true,
    version: '1.0.0',
    compatibleWithCore: '^1.0.0',
    description: 'Manage checklists and templates for coaching processes',
    author: 'System',
    enabled: true
  }
]

const seedGoals: SeedGoal[] = [
  {
    title: 'Improve Communication Skills',
    description: 'Work on active listening and clear expression of ideas',
    status: 'in-progress',
    progress: 65,
    dueDate: '2024-03-15',
    userEmail: 'coachee1@example.com',
    coachEmail: 'coach1@example.com'
  },
  {
    title: 'Complete Leadership Training',
    description: 'Finish the advanced leadership certification program',
    status: 'not-started',
    progress: 0,
    dueDate: '2024-04-30',
    userEmail: 'coachee2@example.com',
    coachEmail: 'coach1@example.com'
  },
  {
    title: 'Develop Time Management Skills',
    description: 'Learn effective time management techniques and tools',
    status: 'in-progress',
    progress: 40,
    dueDate: '2024-03-30',
    userEmail: 'coachee3@example.com',
    coachEmail: 'coach2@example.com'
  }
]

const seedTasks: SeedTask[] = [
  {
    title: 'Review quarterly reports',
    description: 'Analyze Q1 performance metrics and prepare summary',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-02-15',
    userEmail: 'coachee1@example.com',
    assignedByEmail: 'coach1@example.com'
  },
  {
    title: 'Prepare presentation slides',
    description: 'Create slides for next week\'s team meeting',
    status: 'pending',
    priority: 'medium',
    dueDate: '2024-02-20',
    userEmail: 'coachee2@example.com',
    assignedByEmail: 'coach1@example.com'
  },
  {
    title: 'Complete online course module',
    description: 'Finish module 3 of the leadership course',
    status: 'completed',
    priority: 'medium',
    dueDate: '2024-02-10',
    userEmail: 'coachee3@example.com',
    assignedByEmail: 'coach2@example.com'
  }
]

/**
 * Connect to MongoDB
 */
async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set')
    }
    
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

/**
 * Clear existing data
 */
async function clearDatabase(): Promise<void> {
  console.log('🧹 Clearing existing data...')
  
  await Promise.all([
    User.deleteMany({}),
    Module.deleteMany({}),
    Goal.deleteMany({}),
    Task.deleteMany({})
  ])
  
  console.log('✅ Database cleared')
}

/**
 * Seed users
 */
async function seedUsersData(): Promise<Map<string, string>> {
  console.log('👥 Seeding users...')
  
  const userIdMap = new Map<string, string>()
  
  for (const userData of seedUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const user = new User({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role,
      mandant: userData.mandant,
      avatar: userData.avatar || '',
      modulePermissions: userData.modulePermissions || [],
      isActive: true
    })
    
    await user.save()
    userIdMap.set(userData.email, user._id.toString())
    
    console.log(`  ✅ Created user: ${userData.name} (${userData.email})`)
  }
  
  // Update mandant references for coachees
  const coach1Id = userIdMap.get('coach1@example.com')
  const coach2Id = userIdMap.get('coach2@example.com')
  
  if (coach1Id) {
    await User.updateMany(
      { email: { $in: ['coachee1@example.com', 'coachee2@example.com'] } },
      { mandant: coach1Id }
    )
  }
  
  if (coach2Id) {
    await User.updateMany(
      { email: 'coachee3@example.com' },
      { mandant: coach2Id }
    )
  }
  
  console.log('✅ Users seeded successfully')
  return userIdMap
}

/**
 * Seed modules
 */
async function seedModulesData(adminId: string): Promise<void> {
  console.log('🧩 Seeding modules...')
  
  for (const moduleData of seedModules) {
    const module = new Module({
      ...moduleData,
      createdBy: adminId,
      installed: true
    })
    
    await module.save()
    console.log(`  ✅ Created module: ${moduleData.name}`)
  }
  
  console.log('✅ Modules seeded successfully')
}

/**
 * Seed goals
 */
async function seedGoalsData(userIdMap: Map<string, string>): Promise<void> {
  console.log('🎯 Seeding goals...')
  
  for (const goalData of seedGoals) {
    const userId = userIdMap.get(goalData.userEmail)
    const coachId = goalData.coachEmail ? userIdMap.get(goalData.coachEmail) : undefined
    
    if (!userId) {
      console.warn(`  ⚠️  User not found for email: ${goalData.userEmail}`)
      continue
    }
    
    const goal = new Goal({
      title: goalData.title,
      description: goalData.description,
      status: goalData.status,
      progress: goalData.progress,
      dueDate: goalData.dueDate ? new Date(goalData.dueDate) : undefined,
      userId,
      coachId
    })
    
    await goal.save()
    console.log(`  ✅ Created goal: ${goalData.title}`)
  }
  
  console.log('✅ Goals seeded successfully')
}

/**
 * Seed tasks
 */
async function seedTasksData(userIdMap: Map<string, string>): Promise<void> {
  console.log('📋 Seeding tasks...')
  
  for (const taskData of seedTasks) {
    const userId = userIdMap.get(taskData.userEmail)
    const assignedBy = taskData.assignedByEmail ? userIdMap.get(taskData.assignedByEmail) : undefined
    
    if (!userId) {
      console.warn(`  ⚠️  User not found for email: ${taskData.userEmail}`)
      continue
    }
    
    const task = new Task({
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      userId,
      assignedBy,
      completedAt: taskData.status === 'completed' ? new Date() : undefined
    })
    
    await task.save()
    console.log(`  ✅ Created task: ${taskData.title}`)
  }
  
  console.log('✅ Tasks seeded successfully')
}

/**
 * Display seeding summary
 */
async function displaySummary(): Promise<void> {
  console.log('\n📊 Database Seeding Summary:')
  
  const userCount = await User.countDocuments()
  const moduleCount = await Module.countDocuments()
  const goalCount = await Goal.countDocuments()
  const taskCount = await Task.countDocuments()
  
  console.log(`  👥 Users: ${userCount}`)
  console.log(`  🧩 Modules: ${moduleCount}`)
  console.log(`  🎯 Goals: ${goalCount}`)
  console.log(`  📋 Tasks: ${taskCount}`)
  
  console.log('\n🔐 Demo Credentials:')
  console.log('  Admin: admin@example.com / admin123')
  console.log('  Coach: coach1@example.com / coach123')
  console.log('  Coachee: coachee1@example.com / coachee123')
}

/**
 * Main seeding function
 */
async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...\n')
    
    // Connect to database
    await connectDB()
    
    // Clear existing data
    await clearDatabase()
    
    // Seed data
    const userIdMap = await seedUsersData()
    const adminId = userIdMap.get('admin@example.com')!
    
    await seedModulesData(adminId)
    await seedGoalsData(userIdMap)
    await seedTasksData(userIdMap)
    
    // Display summary
    await displaySummary()
    
    console.log('\n🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

/**
 * Run seeding if called directly
 */
if (require.main === module) {
  seedDatabase()
}

export default seedDatabase