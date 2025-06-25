import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const execAsync = promisify(exec)

interface BackupOptions {
  outputDir?: string
  compress?: boolean
  includeIndexes?: boolean
}

/**
 * Create database backup using mongodump
 */
async function backupDatabase(options: BackupOptions = {}): Promise<void> {
  try {
    console.log('💾 Starting database backup...')
    
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set')
    }
    
    // Parse MongoDB URI to extract database name
    const dbMatch = mongoUri.match(/\/([^?]+)/)
    const dbName = dbMatch ? dbMatch[1] : 'sgblock'
    
    // Setup backup directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = options.outputDir || path.join(process.cwd(), 'backups')
    const backupPath = path.join(backupDir, `backup-${dbName}-${timestamp}`)
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // Build mongodump command
    const dumpCommand = [
      'mongodump',
      `--uri="${mongoUri}"`,
      `--out="${backupPath}"`,
      options.includeIndexes !== false ? '--dumpDbUsersAndRoles' : '',
      '--verbose'
    ].filter(Boolean).join(' ')
    
    console.log(`📂 Backup location: ${backupPath}`)
    console.log('⏳ Running mongodump...')
    
    const { stdout, stderr } = await execAsync(dumpCommand)
    
    if (stderr && !stderr.includes('done dumping')) {
      console.warn('⚠️  Backup warnings:', stderr)
    }
    
    console.log('✅ Database backup completed successfully')
    
    // Compress backup if requested
    if (options.compress) {
      await compressBackup(backupPath)
    }
    
    // Display backup info
    await displayBackupInfo(backupPath)
    
  } catch (error) {
    console.error('❌ Database backup failed:', error)
    throw error
  }
}

/**
 * Compress backup directory
 */
async function compressBackup(backupPath: string): Promise<void> {
  try {
    console.log('🗜️  Compressing backup...')
    
    const tarCommand = `tar -czf "${backupPath}.tar.gz" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`
    await execAsync(tarCommand)
    
    // Remove uncompressed directory
    await execAsync(`rm -rf "${backupPath}"`)
    
    console.log(`✅ Backup compressed: ${backupPath}.tar.gz`)
  } catch (error) {
    console.error('❌ Backup compression failed:', error)
  }
}

/**
 * Display backup information
 */
async function displayBackupInfo(backupPath: string): Promise<void> {
  try {
    const stats = fs.statSync(backupPath)
    const size = (stats.size / 1024 / 1024).toFixed(2)
    
    console.log('\n📊 Backup Information:')
    console.log(`  📁 Path: ${backupPath}`)
    console.log(`  📏 Size: ${size} MB`)
    console.log(`  📅 Created: ${stats.birthtime.toISOString()}`)
    
    // List collections in backup
    const collections = fs.readdirSync(backupPath)
      .filter(file => file.endsWith('.bson'))
      .map(file => file.replace('.bson', ''))
    
    if (collections.length > 0) {
      console.log(`  📋 Collections: ${collections.join(', ')}`)
    }
    
  } catch (error) {
    console.warn('⚠️  Could not read backup info:', error)
  }
}

/**
 * List available backups
 */
async function listBackups(backupDir?: string): Promise<void> {
  try {
    const dir = backupDir || path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(dir)) {
      console.log('📁 No backups directory found')
      return
    }
    
    const backups = fs.readdirSync(dir)
      .filter(file => file.startsWith('backup-'))
      .sort()
      .reverse()
    
    if (backups.length === 0) {
      console.log('📁 No backups found')
      return
    }
    
    console.log('\n📋 Available Backups:')
    backups.forEach((backup, index) => {
      const backupPath = path.join(dir, backup)
      const stats = fs.statSync(backupPath)
      const size = stats.isDirectory() 
        ? 'Directory' 
        : `${(stats.size / 1024 / 1024).toFixed(2)} MB`
      
      console.log(`  ${index + 1}. ${backup}`)
      console.log(`     📏 Size: ${size}`)
      console.log(`     📅 Created: ${stats.birthtime.toLocaleString()}`)
    })
    
  } catch (error) {
    console.error('❌ Failed to list backups:', error)
  }
}

/**
 * Clean old backups (keep last N backups)
 */
async function cleanOldBackups(keepCount: number = 5, backupDir?: string): Promise<void> {
  try {
    const dir = backupDir || path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(dir)) {
      console.log('📁 No backups directory found')
      return
    }
    
    const backups = fs.readdirSync(dir)
      .filter(file => file.startsWith('backup-'))
      .map(file => ({
        name: file,
        path: path.join(dir, file),
        stats: fs.statSync(path.join(dir, file))
      }))
      .sort((a, b) => b.stats.birthtime.getTime() - a.stats.birthtime.getTime())
    
    if (backups.length <= keepCount) {
      console.log(`📁 Only ${backups.length} backups found, nothing to clean`)
      return
    }
    
    const toDelete = backups.slice(keepCount)
    
    console.log(`🧹 Cleaning ${toDelete.length} old backups...`)
    
    for (const backup of toDelete) {
      if (backup.stats.isDirectory()) {
        await execAsync(`rm -rf "${backup.path}"`)
      } else {
        fs.unlinkSync(backup.path)
      }
      console.log(`  🗑️  Deleted: ${backup.name}`)
    }
    
    console.log('✅ Backup cleanup completed')
    
  } catch (error) {
    console.error('❌ Backup cleanup failed:', error)
  }
}

/**
 * Main backup function with CLI support
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]
  
  try {
    switch (command) {
      case 'list':
        await listBackups()
        break
        
      case 'clean':
        const keepCount = parseInt(args[1]) || 5
        await cleanOldBackups(keepCount)
        break
        
      case 'backup':
      default:
        const options: BackupOptions = {
          compress: args.includes('--compress'),
          includeIndexes: !args.includes('--no-indexes'),
          outputDir: args.find(arg => arg.startsWith('--output='))?.split('=')[1]
        }
        await backupDatabase(options)
        break
    }
  } catch (error) {
    console.error('❌ Operation failed:', error)
    process.exit(1)
  }
}

/**
 * Run if called directly
 */
if (require.main === module) {
  main()
}

export { backupDatabase, listBackups, cleanOldBackups }