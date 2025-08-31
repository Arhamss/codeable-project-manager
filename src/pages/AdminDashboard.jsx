import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FolderOpen,
  Calendar,
  Clock,
  Plus,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { projectService } from '../services/projectService';
import { getProjectStatusLabel } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProjectModal from '../components/modals/ProjectModal';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [projectsData, analyticsData] = await Promise.all([
        projectService.getAllProjects(),
        projectService.getDashboardAnalytics()
      ]);
      
      setProjects(projectsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSuccess = () => {
    setShowProjectModal(false);
    setEditingProject(null);
    loadDashboardData();
    toast.success(editingProject ? 'Project updated successfully!' : 'Project created successfully!');
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
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
          <LoadingSpinner size="lg" text="Loading admin dashboard..." />
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
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Manage projects, track performance, and analyze business metrics.
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <motion.button
              onClick={() => navigate('/admin/analytics')}
              className="btn-secondary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </motion.button>
            <motion.button
              onClick={() => setShowProjectModal(true)}
              className="btn-primary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  ${(analytics.totalRevenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
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
                <p className="text-gray-400 text-sm">Total Profit</p>
                <p className={`text-2xl font-bold ${
                  (analytics.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${(analytics.totalProfit || 0).toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                (analytics.totalProfit || 0) >= 0 ? 'bg-green-600/20' : 'bg-red-600/20'
              }`}>
                {(analytics.totalProfit || 0) >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
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
                <p className="text-gray-400 text-sm">Total Projects</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.totalProjects || 0}
                </p>
              </div>
              <div className="p-3 bg-primary-600/20 rounded-lg">
                <FolderOpen className="w-6 h-6 text-primary-400" />
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
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.totalLoggedHours || 0}h
                </p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Projects Overview */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white">Projects Overview</h3>
            <p className="text-gray-400 text-sm">Manage and monitor all projects</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Project</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Revenue</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Progress</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? (
                  projects.map((project) => {
                    const totalEstimated = Object.values(project.estimatedHours || {}).reduce((sum, hours) => sum + hours, 0);
                    const progressPercentage = totalEstimated > 0 ? (project.totalLoggedHours / totalEstimated) * 100 : 0;
                    
                    return (
                      <motion.tr
                        key={project.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors"
                      >
                        <td className="py-4 px-2">
                          <div>
                            <p className="font-medium text-white">{project.name}</p>
                            <p className="text-sm text-gray-400">{project.client || 'No client'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'in_progress' 
                              ? 'bg-green-600/20 text-green-400'
                              : project.status === 'completed'
                              ? 'bg-blue-600/20 text-blue-400'
                              : project.status === 'on_hold'
                              ? 'bg-yellow-600/20 text-yellow-400'
                              : 'bg-gray-600/20 text-gray-400'
                          }`}>
                            {getProjectStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <p className="font-medium text-white">
                            ${(project.income || 0).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-4 px-2">
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
                        <td className="py-4 px-2">
                          <div className="flex space-x-2">
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
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="text-gray-400">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No projects yet</p>
                        <button
                          onClick={() => setShowProjectModal(true)}
                          className="text-primary-400 hover:text-primary-300 mt-2"
                        >
                          Create your first project
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
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
    </DashboardLayout>
  );
};

export default AdminDashboard;
