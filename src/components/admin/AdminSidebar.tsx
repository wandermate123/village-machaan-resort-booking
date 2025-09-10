import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Home, 
  Package, 
  Users, 
  BarChart3, 
  Menu, 
  X, 
  TreePine,
  Building,
  MessageSquare
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
    { icon: Building, label: 'Occupancy', path: '/admin/occupancy' },
    { icon: MessageSquare, label: 'Safari Queries', path: '/admin/safari-queries' },
    { icon: Home, label: 'Villas', path: '/admin/villas' },
    { icon: Package, label: 'Packages', path: '/admin/packages' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary-950 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-primary-800">
          <div className="flex items-center space-x-2">
            <img 
              src="/images/village-machaan-logo.png" 
              alt="Village Machaan" 
              className="h-16 w-auto mt-1"
            />
            <span className="text-lg font-serif font-bold text-white">Admin Panel</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-primary-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-6 mb-6">
            <p className="text-primary-400 text-xs uppercase tracking-wider font-medium">
              Main Menu
            </p>
          </div>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200
                  ${isActive 
                    ? 'bg-secondary-600 text-white border-r-4 border-secondary-400' 
                    : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu button for desktop */}
        <div className="absolute top-4 -right-12 lg:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-primary-950 text-white p-2 rounded-r-lg shadow-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;