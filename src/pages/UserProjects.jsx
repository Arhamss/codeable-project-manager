import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Clock,
  Plus,
  Eye,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { projectService } from '../services/projectService';
import { getProjectStatusLabel, PROJECT_STATUS } from '../types';
import useAuthStore from '../stores/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TimeLogModal from '../components/modals/TimeLogModal';
import ProjectCard from '../components/projects/ProjectCard';
import toast from 'react-hot-toast';

const UserProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [userTimeLogs, setUserTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { userData } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [userData]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, timeLogsData] = await Promise.all([
        projectService.getAllProjects(),
        projectService.getUserTimeLogs(userData.id)
      ]);
      
      // Filter projects where user is assigned as a developer or admin
      const userAssignedProjects = projectsData.filter(project => {
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
      
      // Filter only active projects for users
      const activeProjects = userAssignedProjects.filter(project => 
        project.status === PROJECT_STATUS.IN_PROGRESS || 
        project.status === PROJECT_STATUS.PLANNING
      );
      
      setProjects(activeProjects);
      setUserTimeLogs(timeLogsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleTimeLogSuccess = () => {
    setShowTimeLogModal(false);
    setSelectedProject(null);
    loadData();
    toast.success('Time logged successfully!');
  };

  const handleLogTimeForProject = (project) => {
    setSelectedProject(project);
    setShowTimeLogModal(true);
  };

  const calculateUserMetrics = () => {
    const totalHours = userTimeLogs.reduce((sum, log) => sum + log.hours, 0);
    const thisWeekLogs = userTimeLogs.filter(log => {
      const logDate = new Date(log.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    });
    const thisWeekHours = thisWeekLogs.reduce((sum, log) => sum + log.hours, 0);
    
    const projectsWorkedOn = new Set(userTimeLogs.map(log => log.projectId)).size;
    const recentLogs = userTimeLogs.slice(0, 5);

    return { totalHours, thisWeekHours, projectsWorkedOn, recentLogs };
  };

  const getUserProjectHours = (projectId) => {
    return userTimeLogs
      .filter(log => log.projectId === projectId)
      .reduce((sum, log) => sum + log.hours, 0);
  };

  const metrics = calculateUserMetrics();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Loading projects..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-gray-400">Track your time and view project progress</p>
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

        {/* User Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-white">{metrics.totalHours}h</p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400" />
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
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-white">{metrics.thisWeekHours}h</p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-lg">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Projects</p>
                <p className="text-2xl font-bold text-white">{metrics.projectsWorkedOn}</p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Target className="w-6 h-6 text-purple-400" />
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
                <p className="text-gray-400 text-sm">Available</p>
                <p className="text-2xl font-bold text-white">{projects.length}</p>
              </div>
              <div className="p-3 bg-orange-600/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-primary pl-10 pr-10 w-full sm:w-48"
              >
                <option value="all">All Status</option>
                <option value={PROJECT_STATUS.PLANNING}>Planning</option>
                <option value={PROJECT_STATUS.IN_PROGRESS}>In Progress</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => {
              const userHours = getUserProjectHours(project.id);
              const totalEstimated = Object.values(project.estimatedHours || {}).reduce((sum, hours) => sum + hours, 0);
              const remainingHours = Math.max(0, totalEstimated - (project.totalLoggedHours || 0));
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProjectCard
                    project={project}
                    onView={() => navigate(`/projects/${project.id}`)}
                    onLogTime={() => handleLogTimeForProject(project)}
                    showActions={false}
                    userSpecific={{
                      userHours,
                      remainingHours,
                      canLogTime: true
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card text-center py-12"
          >
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No projects found' : 'No projects available'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Contact your admin to get assigned to projects.'
              }
            </p>
          </motion.div>
        )}

        {/* Recent Activity */}
        {metrics.recentLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <p className="text-gray-400 text-sm">Your latest time logs</p>
            </div>
            
            <div className="space-y-3">
              {metrics.recentLogs.map((log, index) => {
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
                        {log.workType?.replace('_', ' ') || 'Other'}
                      </span>
                      <span>
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Time Log Modal */}
      <TimeLogModal
        isOpen={showTimeLogModal}
        onClose={() => {
          setShowTimeLogModal(false);
          setSelectedProject(null);
        }}
        onSuccess={handleTimeLogSuccess}
        projects={selectedProject ? [selectedProject] : projects}
        preselectedProject={selectedProject}
      />
    </DashboardLayout>
  );
};

export default UserProjects;
