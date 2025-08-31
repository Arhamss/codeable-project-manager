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
import { getProjectStatusLabel, getWorkTypeLabel, getCostCategoryLabel } from '../types';
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
      const analyticsData = await projectService.getProjectAnalytics(projectId);
      
      if (!analyticsData) {
        toast.error('Project not found');
        navigate('/dashboard');
        return;
      }
      
      setProject(analyticsData.project);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project data');
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

  const totalCosts = Object.values(project.costs || {}).reduce((sum, cost) => sum + cost, 0);
  const profit = (project.income || 0) - totalCosts;

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
                  ${(project.income || 0).toLocaleString()}
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

            {/* Hours by Work Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Hours by Work Type</h3>
              </div>
              
              <div className="space-y-3">
                {Object.entries(analytics.hoursByWorkType).map(([workType, hours]) => {
                  const percentage = analytics.totalLoggedHours > 0 
                    ? (hours / analytics.totalLoggedHours) * 100 
                    : 0;
                  
                  return (
                    <div key={workType} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{getWorkTypeLabel(workType)}</span>
                        <span className="text-white">{hours}h ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Breakdown */}
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
                    ${(project.income || 0).toLocaleString()}
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
