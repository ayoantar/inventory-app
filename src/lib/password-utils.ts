import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { config } from './config'

// Password hashing utilities
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12

  // Hash a password
  static async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  // Verify a password against a hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false
    }
    return bcrypt.compare(password, hash)
  }

  // Generate a secure random password
  static generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length)
      password += charset[randomIndex]
    }
    
    return password
  }

  // Generate password reset token
  static generateResetToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour from now
    
    return { token, expires }
  }

  // Validate password strength
  static validatePasswordStrength(password: string): { 
    isValid: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long')
    } else if (password.length >= 8) {
      score += 1
    }

    if (password.length >= 12) {
      score += 1
    }

    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Password must contain lowercase letters')
    }

    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Password must contain uppercase letters')
    }

    if (/[0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Password must contain numbers')
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Password must contain special characters')
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeating characters')
      score -= 1
    }

    if (/^[a-zA-Z]+$/.test(password)) {
      feedback.push('Password should not be only letters')
      score -= 1
    }

    if (/^[0-9]+$/.test(password)) {
      feedback.push('Password should not be only numbers')
      score -= 1
    }

    const isValid = score >= 4 && feedback.length === 0

    return {
      isValid,
      score: Math.max(0, Math.min(5, score)),
      feedback
    }
  }
}

// Encryption utilities for sensitive data
export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY = Buffer.from(config.security.encryptionKey, 'utf8')

  // Encrypt sensitive data
  static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv)
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()
      
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
      
      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format')
      }
      
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv)
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  // Hash data for integrity checking
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  // Generate secure random tokens
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }
}

// Session security utilities
export class SessionUtils {
  // Generate secure session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Check if session is expired
  static isSessionExpired(sessionDate: Date, maxAge: number = config.auth.sessionMaxAge): boolean {
    const now = new Date()
    const sessionAge = (now.getTime() - sessionDate.getTime()) / 1000
    return sessionAge > maxAge
  }

  // Generate CSRF token
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('base64')
  }

  // Validate CSRF token
  static validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) {
      return false
    }
    return crypto.timingSafeEqual(
      Buffer.from(token, 'base64'),
      Buffer.from(expectedToken, 'base64')
    )
  }
}