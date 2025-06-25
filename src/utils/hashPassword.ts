/**
 * Password hashing utility using SHA-256
 * Note: This is a mock implementation for demo purposes.
 * In production, use proper password hashing libraries like bcrypt, scrypt, or Argon2.
 */

/**
 * Hash a password using SHA-256
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Convert string to ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // Hash the password using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Stored hash
 * @returns Promise<boolean> - Whether password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const hashedInput = await hashPassword(password)
    return hashedInput === hash
  } catch (error) {
    console.error('Password verification failed:', error)
    return false
  }
}

/**
 * Generate a random salt (for future use)
 * @param length - Salt length in bytes
 * @returns string - Random salt
 */
export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash password with salt (for future enhancement)
 * @param password - Plain text password
 * @param salt - Salt string
 * @returns Promise<string> - Salted hash
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const saltedPassword = password + salt
  return await hashPassword(saltedPassword)
}

// Demo password mappings for reference:
// admin123 -> 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
// coach123 -> ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
// coachee123 -> 5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5