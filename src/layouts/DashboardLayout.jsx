import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  User,
  BarChart3,
  Clock,
} from 'lucide-react';
import logo from '../assets/logo.png';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: location.pathname === '/dashboard'
    },
    ...(isAdmin() ? [
      {
        name: 'Projects',
        href: '/admin/projects',
        icon: FolderOpen,
        active: location.pathname.startsWith('/admin/projects')
      },
      {
        name: 'Users',
        href: '/admin/users',
        icon: Users,
        active: location.pathname.startsWith('/admin/users')
      },
      {
        name: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        active: location.pathname.startsWith('/admin/analytics')
      },
      {
        name: 'Leave Management',
        href: '/admin/leaves',
        icon: Calendar,
        active: location.pathname.startsWith('/admin/leaves')
      }
    ] : [
      {
        name: 'Projects',
        href: '/user/projects',
        icon: FolderOpen,
        active: location.pathname.startsWith('/user/projects')
      },
      {
        name: 'Time Logs',
        href: '/user/time-logs',
        icon: Clock,
        active: location.pathname.startsWith('/user/time-logs')
      },
      {
        name: 'My Leaves',
        href: '/user/leaves',
        icon: Calendar,
        active: location.pathname.startsWith('/user/leaves')
      }
    ]),
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      active: location.pathname === '/profile'
    }
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    desktop: {
      x: 0,
      transition: {
        duration: 0
      }
    }
  };

  return (
    <div className="flex h-screen bg-dark-950">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="dashboard-sidebar hidden lg:flex lg:flex-col lg:w-64 lg:bg-dark-900 lg:border-r lg:border-dark-800">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-dark-800">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg p-1">
                <img src={logo} alt="Codeable Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold text-white">Codeable</span>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-dark-800">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-full">
                <span className="text-sm font-medium text-white">
                  {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userData?.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {userData?.role === 'admin' ? 'Administrator' : 'Team Member'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`sidebar-item w-full ${item.active ? 'active' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </motion.button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-dark-800">
            <motion.button
              onClick={handleLogout}
              className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={sidebarOpen ? 'open' : 'closed'}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-800 lg:hidden"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-dark-800">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg p-1">
                <img src={logo} alt="Codeable Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold text-white">Codeable</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-dark-800">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-full">
                <span className="text-sm font-medium text-white">
                  {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userData?.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {userData?.role === 'admin' ? 'Administrator' : 'Team Member'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item w-full ${item.active ? 'active' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </motion.button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-dark-800">
            <motion.button
              onClick={handleLogout}
              className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="dashboard-content flex flex-col">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-6 bg-dark-900 border-b border-dark-800 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-white">
              {location.pathname === '/dashboard' 
                ? `Welcome back, ${userData?.name?.split(' ')[0] || 'User'}!`
                : 'Dashboard'
              }
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-full">
                <span className="text-xs font-medium text-white">
                  {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-dark-950">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
