import { motion } from 'framer-motion';
import { 
  Eye, 
  Edit, 
  Archive, 
  Trash2,
  Clock, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Plus,
  MoreVertical
} from 'lucide-react';
import { useState } from 'react';
import { getProjectStatusLabel, getProjectTypeLabel, PROJECT_STATUS, PROJECT_TYPES, REVENUE_TYPE } from '../../types';

const ProjectCard = ({ 
  project, 
  onView, 
  onEdit, 
  onArchive, 
  onDelete,
  onLogTime,
  showActions = true,
  userSpecific = null
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const totalEstimated = Object.values(project.estimatedHours || {}).reduce((sum, hours) => sum + hours, 0);
  const progressPercentage = totalEstimated > 0 ? (project.totalLoggedHours / totalEstimated) * 100 : 0;
  const totalCosts = Object.values(project.costs || {}).reduce((sum, cost) => sum + cost, 0);
  
  // Calculate income based on project type and revenue type
  const getProjectIncome = () => {
    if (project.projectType === PROJECT_TYPES.RETAINER) {
      // For retainer projects, check revenue type
      if (project.revenueType === REVENUE_TYPE.FIXED) {
        // Fixed amount regardless of hours worked
        return project.monthlyAmount || 0;
      } else {
        // Based on hours worked (similar to hourly projects)
        return (project.monthlyAmount || 0) * (project.totalLoggedHours || 0);
      }
    } else if (project.projectType === PROJECT_TYPES.HOURLY) {
      return (project.hourlyRate || 0) * (project.totalLoggedHours || 0);
    } else {
      // One-time projects
      if (project.revenueType === REVENUE_TYPE.FIXED) {
        // Fixed amount regardless of hours worked
        return project.income || 0;
      } else {
        // Based on hours worked
        return (project.income || 0) * (project.totalLoggedHours || 0);
      }
    }
  };
  
  const projectIncome = getProjectIncome();
  const profit = projectIncome - totalCosts;

  const getStatusColor = (status) => {
    const colors = {
      [PROJECT_STATUS.PLANNING]: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
      [PROJECT_STATUS.IN_PROGRESS]: 'bg-green-600/20 text-green-400 border-green-600/30',
      [PROJECT_STATUS.ON_HOLD]: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      [PROJECT_STATUS.COMPLETED]: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      [PROJECT_STATUS.CANCELLED]: 'bg-red-600/20 text-red-400 border-red-600/30'
    };
    return colors[status] || 'bg-gray-600/20 text-gray-400 border-gray-600/30';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-primary-500';
  };

  return (
    <motion.div
      className="card group hover:shadow-xl transition-all duration-300 hover:border-primary-600/30 relative"
      whileHover={{ y: -4 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
            {project.name}
          </h3>
          <div className="space-y-1">
            {project.client && (
              <div className="flex items-center text-gray-400 text-sm">
                <User className="w-3 h-3 mr-1" />
                <span className="truncate">{project.client}</span>
              </div>
            )}
            <div className="text-xs text-gray-500">
              {getProjectTypeLabel(project.projectType || PROJECT_TYPES.ONE_TIME)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(project.status)}`}>
            {getProjectStatusLabel(project.status)}
          </span>
          
          {showActions && (
            <div className="relative z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="p-1 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-8 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-20 min-w-32">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView?.();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors rounded-t-lg"
                  >
                    <Eye className="w-3 h-3 mr-2" />
                    View
                  </button>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      Edit
                    </button>
                  )}
                  {onArchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive();
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                    >
                      <Archive className="w-3 h-3 mr-2" />
                      Archive
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors rounded-b-lg"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progressPercentage)}`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{project.totalLoggedHours || 0}h logged</span>
          <span>{totalEstimated}h estimated</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3 mb-4">
        {/* Time and Revenue for Admin */}
        {!userSpecific && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-600/20 rounded-lg mr-3">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">
                  {project.projectType === PROJECT_TYPES.RETAINER 
                    ? 'Monthly' 
                    : project.projectType === PROJECT_TYPES.HOURLY 
                    ? 'Earned' 
                    : 'Revenue'
                  }
                </p>
                <p className="text-sm font-medium text-green-400">
                  ${projectIncome.toLocaleString()}
                  {project.projectType === PROJECT_TYPES.HOURLY && (
                    <span className="text-xs text-gray-500 ml-1">
                      (${project.hourlyRate || 0}/hr)
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${profit >= 0 ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                {profit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400">Profit</p>
                <p className={`text-sm font-medium ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${profit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Specific Metrics */}
        {userSpecific && (
          <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center">
                              <div className="p-2 bg-blue-600/20 rounded-lg mr-3">
                                <Clock className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">My Hours</p>
                                <p className="text-sm font-medium text-white">
                                  {userSpecific.userHours || 0}h
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <div className="p-2 bg-orange-600/20 rounded-lg mr-3">
                                <TrendingUp className="w-4 h-4 text-orange-400" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Remaining</p>
                                <p className="text-sm font-medium text-white">
                                  {userSpecific.remainingHours || 0}h
                                </p>
                              </div>
                            </div>
          </div>
        )}

        {/* Dates */}
        {(project.startDate || project.endDate) && (
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            <span>
              {project.startDate && new Date(project.startDate).toLocaleDateString()}
              {project.startDate && project.endDate && ' - '}
              {project.endDate && new Date(project.endDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-4 border-t border-dark-700">
        <motion.button
          onClick={onView}
          className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Eye className="w-3 h-3 mr-1" />
          View Details
        </motion.button>
        
        {userSpecific?.canLogTime && onLogTime && (
          <motion.button
            onClick={onLogTime}
            className="btn-primary flex-1 text-sm py-2 flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Log Time
          </motion.button>
        )}
      </div>

      {/* Click overlay for card navigation */}
      <div 
        className="absolute inset-0 cursor-pointer z-0"
        onClick={onView}
      />
    </motion.div>
  );
};

export default ProjectCard;
