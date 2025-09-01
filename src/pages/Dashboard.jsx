import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  FolderOpen, 
  TrendingUp, 
  Calendar,
  Plus,
  Timer,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import useAuthStore from '../stores/authStore';
import { projectService } from '../services/projectService';
import { getWorkTypeLabel, PROJECT_STATUS } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TimeLogModal from '../components/modals/TimeLogModal';

import toast from 'react-hot-toast';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [recentTimeLogs, setRecentTimeLogs] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const { userData } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, [userData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get all projects
      const allProjects = await projectService.getAllProjects();
      
      // Filter projects where user is assigned as a developer or admin
      const userAssignedProjects = allProjects.filter(project => {
        // Check if user is admin (show all projects for admin)
        if (userData.role === 'admin') {
          return true;
        }
        
        // Check if user is assigned to any developer role in the project
        const developerRoles = project.developerRoles || {};
        
        // Check each role to see if the current user is assigned
        for (const [role, assignedUserIds] of Object.entries(developerRoles)) {
          // Handle both old string format and new array format
          if (Array.isArray(assignedUserIds)) {
            if (assignedUserIds.includes(userData.id)) {
              return true;
            }
          } else if (assignedUserIds === userData.id) {
            // Handle old single string format
            return true;
          }
        }
        
        return false;
      });
      
      setProjects(userAssignedProjects);

      // Get user's recent time logs
      let userTimeLogs = [];
      try {
        userTimeLogs = await projectService.getUserTimeLogs(userData.id);
        // Limit to 10 most recent logs on the client side
        setRecentTimeLogs(userTimeLogs.slice(0, 10));
      } catch (timeLogError) {
        console.warn('Could not load user time logs:', timeLogError);
        setRecentTimeLogs([]);
      }

      // Calculate user stats
      const totalHours = userTimeLogs.reduce((sum, log) => sum + log.hours, 0);
      const activeProjects = allProjects.filter(p => p.status === PROJECT_STATUS.IN_PROGRESS || p.status === PROJECT_STATUS.PLANNING).length;
      const completedProjects = allProjects.filter(p => p.status === PROJECT_STATUS.COMPLETED).length;

      setUserStats({
        totalHours,
        activeProjects,
        completedProjects,
        recentLogs: userTimeLogs.length
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeLogSuccess = () => {
    setShowTimeLogModal(false);
    loadDashboardData();
    toast.success('Time logged successfully!');
  };



  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {userData?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-400">
              Track your time and manage your projects efficiently.
            </p>
          </div>
          <motion.button
            onClick={() => setShowTimeLogModal(true)}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>Log Time</span>
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-white">
                  {userStats.totalHours || 0}h
                </p>
              </div>
              <div className="p-3 bg-primary-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-primary-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-white">
                  {userStats.activeProjects || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-600/20 rounded-lg">
                <FolderOpen className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {userStats.completedProjects || 0}
                </p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recent Logs</p>
                <p className="text-2xl font-bold text-white">
                  {userStats.recentLogs || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Projects */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Available Projects</h3>
              <p className="text-gray-400 text-sm">Projects you can log time to</p>
            </div>
            
            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.slice(0, 5).map((project) => {
                  const totalEstimated = Object.values(project.estimatedHours || {}).reduce((sum, hours) => sum + hours, 0);
                  const progressPercentage = totalEstimated > 0 ? (project.totalLoggedHours / totalEstimated) * 100 : 0;
                  
                  return (
                    <motion.div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{project.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'in_progress' 
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{project.totalLoggedHours || 0}h logged</span>
                        <span>{totalEstimated}h estimated</span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No projects available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Time Logs */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Recent Time Logs</h3>
              <p className="text-gray-400 text-sm">Your latest logged hours</p>
            </div>
            
            <div className="space-y-3">
              {recentTimeLogs.length > 0 ? (
                recentTimeLogs.map((log, index) => {
                  const project = projects.find(p => p.id === log.projectId);
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-dark-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">
                          {project?.name || 'Unknown Project'}
                        </h4>
                        <span className="text-primary-400 font-medium">
                          {log.hours}h
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                        {log.description}
                        </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="bg-dark-700 px-2 py-1 rounded">
                          {getWorkTypeLabel(log.workType)}
                        </span>
                        <span>
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Timer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No time logs yet</p>
                  <button
                    onClick={() => setShowTimeLogModal(true)}
                    className="text-primary-400 hover:text-primary-300 mt-2"
                  >
                    Log your first entry
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Company Policies */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
            className="card"
          >
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Company Policies</h3>
              <p className="text-gray-400 text-sm">Important company guidelines and policies</p>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">Employment Policy</h4>
                      <p className="text-gray-400 text-xs">Core employment guidelines</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">Leave Policy</h4>
                      <p className="text-gray-400 text-xs">Time off and leave guidelines</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">Remote Work</h4>
                      <p className="text-gray-400 text-xs">Remote work guidelines</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">Equipment Policy</h4>
                      <p className="text-gray-400 text-xs">IT and equipment guidelines</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <button
                  onClick={() => navigate('/policies')}
                  className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
                >
                  View All Policies →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Time Log Modal */}
      <TimeLogModal
        isOpen={showTimeLogModal}
        onClose={() => setShowTimeLogModal(false)}
        onSuccess={handleTimeLogSuccess}
        projects={projects}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
