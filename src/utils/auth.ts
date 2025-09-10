// Production-ready authentication utilities
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = import.meta.env.VITE_JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = parseInt(import.meta.env.VITE_BCRYPT_ROUNDS || '12');

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthUtils {
  // Hash password securely
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Password verification failed');
    }
  }

  // Generate JWT token
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'village-machaan',
        audience: 'village-machaan-users'
      });
    } catch (error) {
      throw new Error('Token generation failed');
    }
  }

  // Verify JWT token
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'village-machaan',
        audience: 'village-machaan-users'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Validate password strength
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate secure random token for password reset
  static generateSecureToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Refresh token
  static refreshToken(oldToken: string): string {
    try {
      const payload = this.verifyToken(oldToken);
      // Remove iat and exp from payload
      const { iat, exp, ...newPayload } = payload;
      return this.generateToken(newPayload);
    } catch (error) {
      throw new Error('Cannot refresh invalid token');
    }
  }
}

// Session management
export class SessionManager {
  private static sessions = new Map<string, { userId: string; lastActivity: number; expiresAt: number }>();
  private static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static MAX_SESSIONS_PER_USER = 5;

  static createSession(userId: string, token: string): void {
    const now = Date.now();
    const expiresAt = now + this.SESSION_TIMEOUT;
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    // Check if user has too many sessions
    const userSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => session.userId === userId);
    
    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      const oldestSession = userSessions.reduce((oldest, current) => 
        current[1].lastActivity < oldest[1].lastActivity ? current : oldest
      );
      this.sessions.delete(oldestSession[0]);
    }
    
    this.sessions.set(token, { userId, lastActivity: now, expiresAt });
  }

  static validateSession(token: string): { valid: boolean; userId?: string } {
    const session = this.sessions.get(token);
    const now = Date.now();
    
    if (!session || session.expiresAt < now) {
      this.sessions.delete(token);
      return { valid: false };
    }
    
    // Update last activity
    session.lastActivity = now;
    return { valid: true, userId: session.userId };
  }

  static invalidateSession(token: string): void {
    this.sessions.delete(token);
  }

  static invalidateUserSessions(userId: string): void {
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
  }

  private static cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
      }
    }
  }
}

