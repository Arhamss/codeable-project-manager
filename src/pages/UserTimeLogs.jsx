import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Edit,
  Trash2,
  TrendingUp,
  Target
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { projectService } from '../services/projectService';
import { getWorkTypeLabel, WORK_TYPES } from '../types';
import useAuthStore from '../stores/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TimeLogModal from '../components/modals/TimeLogModal';
import toast from 'react-hot-toast';

const UserTimeLogs = () => {
  const [timeLogs, setTimeLogs] = useState([]);
  const [filteredTimeLogs, setFilteredTimeLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [editingTimeLog, setEditingTimeLog] = useState(null);
  const { userData } = useAuthStore();

  useEffect(() => {
    loadData();
  }, [userData]);

  useEffect(() => {
    filterTimeLogs();
  }, [timeLogs, searchTerm, workTypeFilter, projectFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [timeLogsData, allProjectsData] = await Promise.all([
        projectService.getUserTimeLogs(userData.id),
        projectService.getAllProjects()
      ]);
      
      // Filter projects to only show those where the user is assigned as a developer or admin
      const userAssignedProjects = allProjectsData.filter(project => {
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
      
      setTimeLogs(timeLogsData);
      setProjects(userAssignedProjects);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load time logs');
    } finally {
      setLoading(false);
    }
  };

  const filterTimeLogs = () => {
    let filtered = timeLogs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projects.find(p => p.id === log.projectId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by work type
    if (workTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.workType === workTypeFilter);
    }

    // Filter by project
    if (projectFilter !== 'all') {
      filtered = filtered.filter(log => log.projectId === projectFilter);
    }

    setFilteredTimeLogs(filtered);
  };

  const handleTimeLogSuccess = () => {
    setShowTimeLogModal(false);
    setEditingTimeLog(null);
    loadData();
  };

  const handleEditTimeLog = (timeLog) => {
    setEditingTimeLog(timeLog);
    setShowTimeLogModal(true);
  };

  const handleDeleteTimeLog = async (timeLogId, projectId) => {
    if (window.confirm('Are you sure you want to delete this time log?')) {
      try {
        await projectService.deleteTimeLog(timeLogId, projectId);
        loadData();
        toast.success('Time log deleted successfully');
      } catch (error) {
        console.error('Error deleting time log:', error);
        toast.error('Failed to delete time log');
      }
    }
  };

  const calculateMetrics = () => {
    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisWeekHours = timeLogs
      .filter(log => new Date(log.date) >= thisWeek)
      .reduce((sum, log) => sum + log.hours, 0);
    
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    const thisMonthHours = timeLogs
      .filter(log => new Date(log.date) >= thisMonth)
      .reduce((sum, log) => sum + log.hours, 0);

    const projectsWorkedOn = new Set(timeLogs.map(log => log.projectId)).size;

    return { totalHours, thisWeekHours, thisMonthHours, projectsWorkedOn };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Loading time logs..." />
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
            <h1 className="text-3xl font-bold text-white mb-2">Time Logs</h1>
            <p className="text-gray-400">Track and manage your logged hours</p>
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

        {/* Metrics Cards */}
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
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">{metrics.thisMonthHours}h</p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
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
                <p className="text-gray-400 text-sm">Projects</p>
                <p className="text-2xl font-bold text-white">{metrics.projectsWorkedOn}</p>
              </div>
              <div className="p-3 bg-orange-600/20 rounded-lg">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
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
                placeholder="Search descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary pl-10 w-full"
              />
            </div>

            {/* Work Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                value={workTypeFilter}
                onChange={(e) => setWorkTypeFilter(e.target.value)}
                className="input-primary pl-10 pr-10 w-full sm:w-48"
              >
                <option value="all">All Work Types</option>
                {Object.values(WORK_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {getWorkTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Filter */}
            <div className="relative">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="input-primary pr-10 w-full sm:w-48"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Time Logs Table */}
        {filteredTimeLogs.length > 0 ? (
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Work Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimeLogs.map((log) => {
                    const project = projects.find(p => p.id === log.projectId);
                    
                    return (
                      <tr key={log.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="text-white">{new Date(log.date).toLocaleDateString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-white">{project?.name || 'Unknown Project'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-600/20 text-blue-400">
                            {getWorkTypeLabel(log.workType)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-primary-400 font-medium">{log.hours}h</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-300 max-w-xs truncate">{log.description}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditTimeLog(log)}
                              className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all duration-200"
                              title="Edit Time Log"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTimeLog(log.id, log.projectId)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                              title="Delete Time Log"
                            >
                              <Trash2 className="w-4 h-4" />
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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card text-center py-12"
          >
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || workTypeFilter !== 'all' || projectFilter !== 'all' 
                ? 'No time logs found' 
                : 'No time logs yet'
              }
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || workTypeFilter !== 'all' || projectFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Start tracking your time by logging your first entry.'
              }
            </p>
            {!searchTerm && workTypeFilter === 'all' && projectFilter === 'all' && (
              <button
                onClick={() => setShowTimeLogModal(true)}
                className="btn-primary"
              >
                Log Your First Entry
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Time Log Modal */}
      <TimeLogModal
        isOpen={showTimeLogModal}
        onClose={() => {
          setShowTimeLogModal(false);
          setEditingTimeLog(null);
        }}
        onSuccess={handleTimeLogSuccess}
        projects={projects}
        timeLog={editingTimeLog}
      />
    </DashboardLayout>
  );
};

export default UserTimeLogs;
