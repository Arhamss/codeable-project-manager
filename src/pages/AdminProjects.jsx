import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  Archive,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Timer
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { projectService } from '../services/projectService';

import { getProjectStatusLabel, getProjectTypeLabel, PROJECT_STATUS, PROJECT_TYPES, REVENUE_TYPE } from '../types';
import useAuthStore from '../stores/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProjectModal from '../components/modals/ProjectModal';
import TimeLogModal from '../components/modals/TimeLogModal';
import ProjectCard from '../components/projects/ProjectCard';
import toast from 'react-hot-toast';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [selectedProjectForTimeLog, setSelectedProjectForTimeLog] = useState(null);
  const [userTimeLogs, setUserTimeLogs] = useState([]);
  const { userData } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData) {
      loadProjects();
    }
  }, [userData]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
      
      // Try to load user time logs, but don't fail if it doesn't work
      try {
        const timeLogsData = await projectService.getUserTimeLogs(userData.id);
        setUserTimeLogs(timeLogsData);
      } catch (timeLogError) {
        console.warn('Could not load user time logs:', timeLogError);
        setUserTimeLogs([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
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
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleProjectSuccess = () => {
    setShowProjectModal(false);
    setEditingProject(null);
    loadProjects();
    toast.success(editingProject ? 'Project updated successfully!' : 'Project created successfully!');
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleArchiveProject = async (projectId) => {
    if (window.confirm('Are you sure you want to archive this project?')) {
      try {
        await projectService.deleteProject(projectId);
        loadProjects();
        toast.success('Project archived successfully');
      } catch (error) {
        console.error('Error archiving project:', error);
        toast.error('Failed to archive project');
      }
    }
  };

  const handleLogTime = (project) => {
    setSelectedProjectForTimeLog(project);
    setShowTimeLogModal(true);
  };

  const handleTimeLogSuccess = () => {
    setShowTimeLogModal(false);
    setSelectedProjectForTimeLog(null);
    toast.success('Time logged successfully!');
    // Optionally reload projects to update logged hours
    loadProjects();
  };

  const getUserProjectHours = (projectId) => {
    return userTimeLogs
      .filter(log => log.projectId === projectId)
      .reduce((sum, log) => sum + log.hours, 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      [PROJECT_STATUS.PLANNING]: 'bg-gray-600/20 text-gray-400',
      [PROJECT_STATUS.IN_PROGRESS]: 'bg-green-600/20 text-green-400',
      [PROJECT_STATUS.ON_HOLD]: 'bg-yellow-600/20 text-yellow-400',
      [PROJECT_STATUS.COMPLETED]: 'bg-blue-600/20 text-blue-400',
      [PROJECT_STATUS.CANCELLED]: 'bg-red-600/20 text-red-400'
    };
    return colors[status] || 'bg-gray-600/20 text-gray-400';
  };

  const calculateProjectMetrics = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === PROJECT_STATUS.IN_PROGRESS).length;
    
    // Calculate revenue based on project type
    const totalRevenue = projects.reduce((sum, p) => {
      if (p.projectType === PROJECT_TYPES.RETAINER) {
        // For retainers, count monthly amount (could be multiplied by months if needed)
        return sum + (p.monthlyAmount || 0);
      } else if (p.projectType === PROJECT_TYPES.HOURLY) {
        // For hourly projects, multiply rate by logged hours
        return sum + ((p.hourlyRate || 0) * (p.totalLoggedHours || 0));
      } else {
        // For one-time projects, use total income
        return sum + (p.income || 0);
      }
    }, 0);
    
    const totalHours = projects.reduce((sum, p) => sum + (p.totalLoggedHours || 0), 0);

    return { totalProjects, activeProjects, totalRevenue, totalHours };
  };

  const metrics = calculateProjectMetrics();

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
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-400">Manage and monitor all your projects</p>
          </div>
          <motion.button
            onClick={() => setShowProjectModal(true)}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </motion.button>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Projects</p>
                <p className="text-2xl font-bold text-white">{metrics.totalProjects}</p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-400" />
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
                <p className="text-gray-400 text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-white">{metrics.activeProjects}</p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-lg">
                <Users className="w-6 h-6 text-green-400" />
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
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  ${metrics.totalRevenue.toLocaleString()}
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
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-white">{metrics.totalHours}h</p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-400" />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-primary pl-10 w-full sm:w-64"
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
                  {Object.values(PROJECT_STATUS).map((status) => (
                    <option key={status} value={status}>
                      {getProjectStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                <div className="grid grid-cols-2 gap-1 w-4 h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                <div className="space-y-1 w-4 h-4">
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Projects Display */}
        {filteredProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProjectCard
                    project={project}
                    onEdit={() => handleEditProject(project)}
                    onView={() => navigate(`/projects/${project.id}`)}
                    onArchive={() => handleArchiveProject(project.id)}
                    onLogTime={() => handleLogTime(project)}
                    showActions={true}
                    userSpecific={{
                      userHours: getUserProjectHours(project.id),
                      remainingHours: Math.max(0, Object.values(project.estimatedHours || {}).reduce((sum, hours) => sum + hours, 0) - (project.totalLoggedHours || 0)),
                      canLogTime: true
                    }}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Project</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Progress</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => {
                      const totalEstimated = Object.values(project.estimatedHours || {}).reduce((sum, hours) => sum + hours, 0);
                      const progressPercentage = totalEstimated > 0 ? (project.totalLoggedHours / totalEstimated) * 100 : 0;
                      
                      // Calculate revenue based on project type and revenue type
                      const getProjectRevenue = () => {
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
                      
                      return (
                        <tr key={project.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-white">{project.name}</p>
                              <p className="text-sm text-gray-400 truncate max-w-xs">{project.description}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-600/20 text-blue-400">
                              {getProjectTypeLabel(project.projectType || PROJECT_TYPES.ONE_TIME)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-white">{project.client || 'No client'}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                              {getProjectStatusLabel(project.status)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-24">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{Math.round(progressPercentage)}%</span>
                              </div>
                              <div className="w-full bg-dark-700 rounded-full h-2">
                                <div 
                                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-green-400">
                                ${getProjectRevenue().toLocaleString()}
                                {project.projectType === PROJECT_TYPES.RETAINER && (
                                  <span className="text-xs text-gray-500 ml-1">/month</span>
                                )}
                                {project.projectType === PROJECT_TYPES.HOURLY && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (${project.hourlyRate || 0}/hr)
                                  </span>
                                )}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/projects/${project.id}`)}
                                className="p-1 text-gray-400 hover:text-primary-400 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditProject(project)}
                                className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                                title="Edit Project"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleArchiveProject(project.id)}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                title="Archive Project"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card text-center py-12"
          >
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first project.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="btn-primary"
              >
                Create Project
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setEditingProject(null);
        }}
        onSuccess={handleProjectSuccess}
        project={editingProject}
      />

      {/* Time Log Modal */}
      <TimeLogModal
        isOpen={showTimeLogModal}
        onClose={() => {
          setShowTimeLogModal(false);
          setSelectedProjectForTimeLog(null);
        }}
        onSuccess={handleTimeLogSuccess}
        projects={selectedProjectForTimeLog ? [selectedProjectForTimeLog] : projects}
        preselectedProject={selectedProjectForTimeLog}
      />
    </DashboardLayout>
  );
};

export default AdminProjects;
