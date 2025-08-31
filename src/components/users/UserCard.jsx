import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Edit, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  TrendingUp,
  MoreVertical,
  Shield,
  User
} from 'lucide-react';
import { USER_ROLES } from '../../types';

const UserCard = ({ 
  user, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  showActions = true 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getRoleColor = (role) => {
    return role === USER_ROLES.ADMIN 
      ? 'bg-purple-600/20 text-purple-400 border-purple-600/30'
      : 'bg-blue-600/20 text-blue-400 border-blue-600/30';
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-600/20 text-green-400 border-green-600/30'
      : 'bg-red-600/20 text-red-400 border-red-600/30';
  };

  const getRoleIcon = (role) => {
    return role === USER_ROLES.ADMIN ? Shield : User;
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <motion.div
      className="card group hover:shadow-xl transition-all duration-300 hover:border-primary-600/30 relative"
      whileHover={{ y: -4 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full flex-shrink-0">
            <span className="text-lg font-medium text-white">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
              {user.name}
            </h3>
            <p className="text-gray-400 text-sm truncate">{user.email}</p>
          </div>
        </div>
        
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-8 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-10 min-w-36">
                <button
                  onClick={() => {
                    onEdit?.();
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors rounded-t-lg"
                >
                  <Edit className="w-3 h-3 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onToggleStatus?.();
                    setShowDropdown(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${
                    user.isActive 
                      ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                      : 'text-green-400 hover:bg-green-900/20 hover:text-green-300'
                  } ${!onDelete ? 'rounded-b-lg' : ''}`}
                >
                  {user.isActive ? (
                    <>
                      <UserX className="w-3 h-3 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 mr-2" />
                      Activate
                    </>
                  )}
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors rounded-b-lg"
                  >
                    <UserX className="w-3 h-3 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role and Status Badges */}
      <div className="flex items-center space-x-2 mb-4">
        <span className={`px-2 py-1 text-xs rounded-full border flex items-center ${getRoleColor(user.role)}`}>
          <RoleIcon className="w-3 h-3 mr-1" />
          {user.role === USER_ROLES.ADMIN ? 'Administrator' : 'Team Member'}
        </span>
        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(user.isActive)}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* User Details */}
      <div className="space-y-3 mb-4">
        {/* Department */}
        {user.department && (
          <div className="flex items-center text-gray-400 text-sm">
            <TrendingUp className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="truncate">{user.department}</span>
          </div>
        )}

        {/* Phone */}
        {user.phone && (
          <div className="flex items-center text-gray-400 text-sm">
            <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="truncate">{user.phone}</span>
          </div>
        )}

        {/* Email (if not shown in header) */}
        <div className="flex items-center text-gray-400 text-sm">
          <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
      </div>

      {/* Activity Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Joined</span>
          <span className="text-gray-300">{formatDate(user.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Last Active</span>
          <span className="text-gray-300">{formatDate(user.lastLoginAt)}</span>
        </div>
        {user.hourlyRate > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Hourly Rate</span>
            <span className="text-green-400 font-medium">${user.hourlyRate}/hr</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-4 border-t border-dark-700">
        <motion.button
          onClick={onEdit}
          className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Edit className="w-3 h-3 mr-1" />
          Edit
        </motion.button>
        
        <motion.button
          onClick={onToggleStatus}
          className={`text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center font-medium ${
            user.isActive 
              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
              : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {user.isActive ? (
            <>
              <UserX className="w-3 h-3 mr-1" />
              Deactivate
            </>
          ) : (
            <>
              <UserCheck className="w-3 h-3 mr-1" />
              Activate
            </>
          )}
        </motion.button>
      </div>

      {/* Click overlay for card navigation - excluding buttons area */}
      <div 
        className="absolute inset-0 cursor-pointer"
        style={{ bottom: '60px' }} // Exclude the bottom action buttons area
        onClick={onEdit}
      />
    </motion.div>
  );
};

export default UserCard;
