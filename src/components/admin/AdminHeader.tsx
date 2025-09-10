import React from 'react';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RealTimeNotifications from './RealTimeNotifications';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-primary-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-primary-600 hover:text-primary-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <img 
              src="/images/village-machaan-logo.png" 
              alt="Village Machaan" 
              className="h-16 w-auto mt-1"
            />
            <div>
              <h1 className="text-xl font-semibold text-primary-950">
                Welcome back, {user?.name}
              </h1>
              <p className="text-primary-600 text-sm">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Real-time Notifications */}
          <RealTimeNotifications />

          {/* User Menu */}
          <div className="relative group">
            <button className="flex items-center space-x-2 text-primary-700 hover:text-primary-900 transition-colors">
              <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block font-medium">{user?.name}</span>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-primary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                <button className="w-full text-left px-4 py-2 text-primary-700 hover:bg-primary-50 transition-colors flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-error-600 hover:bg-error-50 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;