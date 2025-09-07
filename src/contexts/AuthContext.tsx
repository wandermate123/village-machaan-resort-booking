import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, AdminUser } from '../services/authService';

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userId = localStorage.getItem('admin_user_id');
      if (!userId) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { valid, user } = await AuthService.verifySession(userId);
      
      if (valid && user) {
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        localStorage.removeItem('admin_user_id');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔑 AuthContext: Attempting login for', email);
      
      const { success, user, error } = await AuthService.login({ email, password });
      
      if (success && user) {
        console.log('✅ AuthContext: Login successful');
        localStorage.setItem('admin_user_id', user.id);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        console.log('❌ AuthContext: Login failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_user_id');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}