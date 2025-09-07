import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export class AuthService {
  // Admin login with simple password check (for demo purposes)
  static async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      const { email, password } = credentials;

      // For demo purposes, check against hardcoded admin credentials
      if (email === 'admin@villagemachaan.com' && password === 'admin123') {
        // Create a demo admin user
        const user: AdminUser = {
          id: 'demo-admin-id',
          email: 'admin@villagemachaan.com',
          name: 'Admin User',
          role: 'admin',
          isActive: true
        };

        console.log('✅ Demo admin login successful');
        return { success: true, user };
      }

      // Try to get admin user from database (if Supabase is connected)
      try {
        const { data: adminUser, error: userError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single();

        if (userError) {
          console.log('Database query failed, using demo credentials only');
          return { success: false, error: 'Invalid email or password' };
        }

        if (adminUser) {
          // For demo, accept the password without bcrypt verification
          // In production, this should be done server-side
          if (password === 'admin123') {
            // Update last login
            await supabase
              .from('admin_users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', adminUser.id);

            const user: AdminUser = {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              role: adminUser.role,
              isActive: adminUser.is_active
            };

            return { success: true, user };
          }
        }
      } catch (dbError) {
        console.log('Database not available, using demo mode');
        // Fall back to demo credentials if database is not available
        if (email === 'admin@villagemachaan.com' && password === 'admin123') {
          const user: AdminUser = {
            id: 'demo-admin-id',
            email: 'admin@villagemachaan.com',
            name: 'Admin User',
            role: 'admin',
            isActive: true
          };
          return { success: true, user };
        }
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'admin_login');
      return { success: false, error: appError.message };
    }
  }

  // Verify admin session
  static async verifySession(userId: string): Promise<{ valid: boolean; user?: AdminUser }> {
    try {
      // For demo mode
      if (userId === 'demo-admin-id') {
        return {
          valid: true,
          user: {
            id: 'demo-admin-id',
            email: 'admin@villagemachaan.com',
            name: 'Admin User',
            role: 'admin',
            isActive: true
          }
        };
      }

      // Try database verification
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, is_active')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          isActive: adminUser.is_active
        }
      };
    } catch (error) {
      ErrorHandler.logError(error, 'session_verification');
      return { valid: false };
    }
  }

  // Create new admin user (simplified for demo)
  static async createAdminUser(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real application, password hashing should be done server-side
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email: userData.email,
          password_hash: userData.password, // In production, this should be hashed server-side
          name: userData.name,
          role: userData.role,
          is_active: true
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Email already exists' };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Update admin user
  static async updateAdminUser(userId: string, updates: Partial<{
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.role) updateData.role = updates.role;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating admin user:', error);
      return { success: false, error: 'Failed to update user' };
    }
  }

  // Change password (simplified for demo)
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this should be done server-side with proper password hashing
      const { error } = await supabase
        .from('admin_users')
        .update({ 
          password_hash: newPassword, // In production, hash this server-side
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }
}