import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import User from '../models/User'
import Module from '../models/Module'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface LegacyUser {
  id: string
  email: string
  password?: string
  hashedPassword?: string
  name: string
  role: 'admin' | 'coach' | 'coachee'
  mandant: string
  avatar?: string
  modulePermissions?: string[]
}

interface LegacyUsersData {
  users: LegacyUser[]
}

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
 * Load legacy users data
 */
function loadLegacyUsers(): LegacyUser[] {
  try {
    const dataPath = path.join(__dirname, '../../data/users.json')
    
    if (!fs.existsSync(dataPath)) {
      console.log('⚠️  No legacy users.json found, skipping user migration')
      return []
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const data: LegacyUsersData = JSON.parse(rawData)
    
    console.log(`📄 Found ${data.users.length} legacy users`)
    return data.users
  } catch (error) {
    console.error('❌ Failed to load legacy users:', error)
    return []
  }
}

/**
 * Migrate users from legacy format to MongoDB
 */
async function migrateUsers(legacyUsers: LegacyUser[]): Promise<Map<string, string>> {
  console.log('👥 Migrating users to MongoDB...')
  
  const userIdMap = new Map<string, string>()
  
  for (const legacyUser of legacyUsers) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: legacyUser.email })
      if (existingUser) {
        console.log(`  ⚠️  User already exists: ${legacyUser.email}`)
        userIdMap.set(legacyUser.id, existingUser._id.toString())
        continue
      }
      
      // Determine password hash
      let passwordHash: string
      
      if (legacyUser.hashedPassword) {
        // Use existing hash (assuming it's bcrypt compatible)
        passwordHash = legacyUser.hashedPassword
      } else if (legacyUser.password) {
        // Hash plain text password
        passwordHash = await bcrypt.hash(legacyUser.password, 12)
      } else {
        // Generate random password for users without credentials
        const randomPassword = Math.random().toString(36).slice(-8)
        passwordHash = await bcrypt.hash(randomPassword, 12)
        console.log(`  🔑 Generated password for ${legacyUser.email}: ${randomPassword}`)
      }
      
      // Create new user
      const user = new User({
        email: legacyUser.email,
        password: passwordHash,
        name: legacyUser.name,
        role: legacyUser.role,
        mandant: legacyUser.mandant,
        avatar: legacyUser.avatar || '',
        modulePermissions: legacyUser.modulePermissions || [],
        isActive: true
      })
      
      await user.save()
      userIdMap.set(legacyUser.id, user._id.toString())
      
      console.log(`  ✅ Migrated user: ${legacyUser.name} (${legacyUser.email})`)
      
    } catch (error) {
      console.error(`  ❌ Failed to migrate user ${legacyUser.email}:`, error)
    }
  }
  
  // Update mandant references
  await updateMandantReferences(legacyUsers, userIdMap)
  
  console.log('✅ User migration completed')
  return userIdMap
}

/**
 * Update mandant references from legacy IDs to MongoDB ObjectIds
 */
async function updateMandantReferences(
  legacyUsers: LegacyUser[], 
  userIdMap: Map<string, string>
): Promise<void> {
  console.log('🔗 Updating mandant references...')
  
  for (const legacyUser of legacyUsers) {
    if (legacyUser.mandant !== '*' && userIdMap.has(legacyUser.mandant)) {
      const newUserId = userIdMap.get(legacyUser.id)
      const newMandantId = userIdMap.get(legacyUser.mandant)
      
      if (newUserId && newMandantId) {
        await User.findByIdAndUpdate(newUserId, { mandant: newMandantId })
        console.log(`  ✅ Updated mandant for ${legacyUser.email}`)
      }
    }
  }
}

/**
 * Create default modules if they don't exist
 */
async function createDefaultModules(adminId: string): Promise<void> {
  console.log('🧩 Creating default modules...')
  
  const defaultModules = [
    {
      key: 'goals',
      name: 'Goal Management',
      routePrefix: 'goals',
      rolesAllowed: ['coach', 'coachee'],
      hasWidget: true,
      version: '1.0.0',
      compatibleWithCore: '^1.0.0',
      description: 'Manage and track goals for coaching sessions',
      author: 'System'
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
      author: 'System'
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
      author: 'System'
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
      author: 'System'
    }
  ]
  
  for (const moduleData of defaultModules) {
    try {
      const existingModule = await Module.findOne({ key: moduleData.key })
      if (existingModule) {
        console.log(`  ⚠️  Module already exists: ${moduleData.name}`)
        continue
      }
      
      const module = new Module({
        ...moduleData,
        enabled: true,
        installed: true,
        createdBy: adminId
      })
      
      await module.save()
      console.log(`  ✅ Created module: ${moduleData.name}`)
      
    } catch (error) {
      console.error(`  ❌ Failed to create module ${moduleData.name}:`, error)
    }
  }
  
  console.log('✅ Default modules created')
}

/**
 * Display migration summary
 */
async function displayMigrationSummary(): Promise<void> {
  console.log('\n📊 Migration Summary:')
  
  const userCount = await User.countDocuments()
  const moduleCount = await Module.countDocuments()
  
  console.log(`  👥 Total Users: ${userCount}`)
  console.log(`  🧩 Total Modules: ${moduleCount}`)
  
  const adminCount = await User.countDocuments({ role: 'admin' })
  const coachCount = await User.countDocuments({ role: 'coach' })
  const coacheeCount = await User.countDocuments({ role: 'coachee' })
  
  console.log(`  🔐 Admins: ${adminCount}`)
  console.log(`  👨‍🏫 Coaches: ${coachCount}`)
  console.log(`  👨‍🎓 Coachees: ${coacheeCount}`)
}

/**
 * Main migration function
 */
async function migrateData(): Promise<void> {
  try {
    console.log('🔄 Starting data migration...\n')
    
    // Connect to database
    await connectDB()
    
    // Load and migrate legacy users
    const legacyUsers = loadLegacyUsers()
    const userIdMap = await migrateUsers(legacyUsers)
    
    // Create default modules
    const adminUser = await User.findOne({ role: 'admin' })
    if (adminUser) {
      await createDefaultModules(adminUser._id.toString())
    } else {
      console.warn('⚠️  No admin user found, skipping module creation')
    }
    
    // Display summary
    await displayMigrationSummary()
    
    console.log('\n🎉 Data migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Data migration failed:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

/**
 * Run migration if called directly
 */
if (require.main === module) {
  migrateData()
}

export default migrateData