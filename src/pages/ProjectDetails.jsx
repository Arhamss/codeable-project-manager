import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  Plus,
  Edit,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { projectService } from '../services/projectService';
import { getProjectStatusLabel, getWorkTypeLabel, getCostCategoryLabel, PROJECT_TYPES, REVENUE_TYPE } from '../types';
import useAuthStore from '../stores/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TimeLogModal from '../components/modals/TimeLogModal';
import ProjectModal from '../components/modals/ProjectModal';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { userData, isAdmin } = useAuthStore();
  
  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // First try to get the project directly
      const projectData = await projectService.getProjectById(projectId);
      
      if (!projectData) {
        toast.error('Project not found');
        navigate('/dashboard');
        return;
      }
      
      const analyticsData = await projectService.getProjectAnalytics(projectId);
      
      if (!analyticsData) {
        toast.error('Project analytics not found');
        navigate('/dashboard');
        return;
      }
      
      setProject(analyticsData.project);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeLogSuccess = () => {
    setShowTimeLogModal(false);
    loadProjectData();
    toast.success('Time logged successfully!');
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    loadProjectData();
    toast.success('Project updated successfully!');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Loading project details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!project || !analytics) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate income based on project type and revenue type
  const getProjectIncome = () => {
    if (project.projectType === PROJECT_TYPES.RETAINER) {
      // For retainer projects, check revenue type
      if (project.revenueType === REVENUE_TYPE.FIXED) {
        // Fixed amount regardless of hours worked
        return project.monthlyAmount || 0;
      } else {
        // Based on hours worked (similar to hourly projects)
        return (project.monthlyAmount || 0) * (analytics.totalLoggedHours || 0);
      }
    } else if (project.projectType === PROJECT_TYPES.HOURLY) {
      return (project.hourlyRate || 0) * (analytics.totalLoggedHours || 0);
    } else {
      // One-time projects
      if (project.revenueType === REVENUE_TYPE.FIXED) {
        // Fixed amount regardless of hours worked
        return project.income || 0;
      } else {
        // Based on hours worked
        return (project.income || 0) * (analytics.totalLoggedHours || 0);
      }
    }
  };

  const projectIncome = getProjectIncome();
  const totalCosts = Object.values(project.costs || {}).reduce((sum, cost) => sum + cost, 0);
  const profit = projectIncome - totalCosts;

  // User-specific metrics for non-admins
  const userHours = (analytics?.recentLogs || [])
    .filter((log) => log.userId === userData?.id)
    .reduce((sum, log) => sum + (log.hours || 0), 0);
  const totalEstimated = Object.values(project?.estimatedHours || {}).reduce((sum, hrs) => sum + hrs, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <p className="text-gray-400">{project.client || 'No client specified'}</p>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <motion.button
              onClick={() => setShowTimeLogModal(true)}
              className="btn-secondary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              <span>Log Time</span>
            </motion.button>
            
            {isAdmin() && (
              <motion.button
                onClick={() => setShowEditModal(true)}
                className="btn-primary flex items-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit className="w-4 h-4" />
                <span>Edit Project</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Progress</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(analytics.progressPercentage)}%
                </p>
              </div>
              <div className="p-3 bg-primary-600/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Hours Logged</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.totalLoggedHours}h
                </p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </motion.div>

          {isAdmin() ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Revenue</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${projectIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-600/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Profit</p>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${profit.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                    <BarChart3 className={`w-6 h-6 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">My Hours</p>
                    <p className="text-2xl font-bold text-white">{userHours}h</p>
                  </div>
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Remaining Hours</p>
                    <p className="text-2xl font-bold text-white">{Math.max(0, totalEstimated - (analytics.totalLoggedHours || 0))}h</p>
                  </div>
                  <div className="p-3 bg-orange-600/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Project Overview</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      project.status === 'in_progress' 
                        ? 'bg-green-600/20 text-green-400'
                        : project.status === 'completed'
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {getProjectStatusLabel(project.status)}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Remaining Hours</p>
                    <p className="font-medium text-white">{analytics.remainingHours}h</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Description</p>
                  <p className="text-white">{project.description}</p>
                </div>

                {(project.startDate || project.endDate) && (
                  <div className="grid grid-cols-2 gap-4">
                    {project.startDate && (
                      <div>
                        <p className="text-gray-400 text-sm">Start Date</p>
                        <p className="text-white">
                          {new Date(project.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {project.endDate && (
                      <div>
                        <p className="text-gray-400 text-sm">End Date</p>
                        <p className="text-white">
                          {new Date(project.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Daily Hours Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Daily Hours Breakdown</h3>
              </div>
              
              <div className="space-y-4">
                {/* Color Legend */}
                <div className="flex flex-wrap gap-3 text-xs border-b border-dark-700 pb-3">
                  {Object.entries({
                    'backend': 'Backend Development',
                    'frontend_web': 'Frontend Web',
                    'frontend_mobile': 'Frontend Mobile',
                    'ui_design': 'UI/UX Design',
                    'deployment': 'Deployment',
                    'testing': 'Testing',
                    'documentation': 'Documentation',
                    'meetings': 'Meetings',
                    'other': 'Other'
                  }).map(([workType, label]) => (
                    <div key={workType} className="flex items-center space-x-1">
                      <div className={`w-3 h-3 rounded-full ${
                        workType === 'backend' ? 'bg-blue-500' :
                        workType === 'frontend_web' ? 'bg-green-500' :
                        workType === 'frontend_mobile' ? 'bg-purple-500' :
                        workType === 'ui_design' ? 'bg-yellow-500' :
                        workType === 'deployment' ? 'bg-red-500' :
                        workType === 'testing' ? 'bg-indigo-500' :
                        workType === 'documentation' ? 'bg-pink-500' :
                        workType === 'meetings' ? 'bg-gray-500' :
                        'bg-orange-500'
                      }`} />
                      <span className="text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>

                {(() => {
                  // Group time logs by date
                  const dailyLogs = {};
                  analytics.recentLogs.forEach(log => {
                    const date = new Date(log.date).toLocaleDateString();
                    if (!dailyLogs[date]) {
                      dailyLogs[date] = {};
                    }
                    if (!dailyLogs[date][log.workType]) {
                      dailyLogs[date][log.workType] = 0;
                    }
                    dailyLogs[date][log.workType] += log.hours;
                  });

                  // Helper function to format date with ordinal suffix
                  const formatDateWithOrdinal = (dateString) => {
                    const date = new Date(dateString);
                    const day = date.getDate();
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    
                    // Get ordinal suffix
                    const getOrdinalSuffix = (day) => {
                      if (day > 3 && day < 21) return 'th';
                      switch (day % 10) {
                        case 1: return 'st';
                        case 2: return 'nd';
                        case 3: return 'rd';
                        default: return 'th';
                      }
                    };

                    return `${dayNames[date.getDay()]}, ${day}${getOrdinalSuffix(day)} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                  };

                  // Sort dates
                  const sortedDates = Object.keys(dailyLogs).sort((a, b) => new Date(a) - new Date(b));

                  return sortedDates.map(date => {
                    const dayLogs = dailyLogs[date];
                    const totalDayHours = Object.values(dayLogs).reduce((sum, hours) => sum + hours, 0);
                    
                    // Work type colors
                    const workTypeColors = {
                      'backend': 'bg-blue-500',
                      'frontend_web': 'bg-green-500',
                      'frontend_mobile': 'bg-purple-500',
                      'ui_design': 'bg-yellow-500',
                      'deployment': 'bg-red-500',
                      'testing': 'bg-indigo-500',
                      'documentation': 'bg-pink-500',
                      'meetings': 'bg-gray-500',
                      'other': 'bg-orange-500'
                    };

                    return (
                      <div key={date} className="space-y-2 p-3 bg-dark-800 rounded-lg border border-dark-700">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">{formatDateWithOrdinal(date)}</span>
                          <span className="text-white font-bold text-lg">{totalDayHours}h</span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-4 flex overflow-hidden">
                          {Object.entries(dayLogs).map(([workType, hours], index) => {
                            const percentage = totalDayHours > 0 ? (hours / totalDayHours) * 100 : 0;
                            return (
                              <div
                                key={workType}
                                className={`${workTypeColors[workType] || 'bg-gray-500'} h-full transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                                title={`${getWorkTypeLabel(workType)}: ${hours}h`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {Object.entries(dayLogs).map(([workType, hours]) => (
                            <div key={workType} className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${workTypeColors[workType] || 'bg-gray-500'}`} />
                              <span className="text-gray-400">{getWorkTypeLabel(workType)}: {hours}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
                
                {analytics.recentLogs.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No time logs recorded yet</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Conditional Sidebar */}
            {isAdmin() ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Financial Breakdown</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Revenue</span>
                  <span className="text-green-400 font-medium">
                    ${projectIncome.toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">Costs Breakdown:</p>
                  {Object.entries(project.costs || {}).map(([category, cost]) => {
                    if (cost > 0) {
                      return (
                        <div key={category} className="flex justify-between text-sm">
                          <span className="text-gray-300">{getCostCategoryLabel(category)}</span>
                          <span className="text-white">${cost.toLocaleString()}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <div className="border-t border-dark-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Costs</span>
                    <span className="text-red-400 font-medium">
                      ${totalCosts.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-dark-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">Net Profit</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${profit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
            ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Activity Summary</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Hours</span>
                  <span className="text-white font-medium">{userHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Hours</span>
                  <span className="text-white font-medium">{analytics.totalLoggedHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated (Total)</span>
                  <span className="text-white font-medium">{totalEstimated}h</span>
                </div>
              </div>
            </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              </div>
              
              <div className="space-y-3">
                {analytics.recentLogs.length > 0 ? (
                  analytics.recentLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-3 bg-dark-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{log.userName}</span>
                        <span className="text-primary-400 text-sm">{log.hours}h</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{log.description}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{getWorkTypeLabel(log.workType)}</span>
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No recent activity</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TimeLogModal
        isOpen={showTimeLogModal}
        onClose={() => setShowTimeLogModal(false)}
        onSuccess={handleTimeLogSuccess}
        projects={[project]}
      />

      {isAdmin() && (
        <ProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          project={project}
        />
      )}
    </DashboardLayout>
  );
};

export default ProjectDetails;
