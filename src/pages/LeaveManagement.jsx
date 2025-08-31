import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  X,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { leaveService } from '../services/leaveService';
import { 
  LEAVE_STATUS, 
  LEAVE_TYPES,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  getLeaveStatusColor
} from '../types';
import LeaveApprovalModal from '../components/modals/LeaveApprovalModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadLeaves();
    loadStatistics();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getAllLeaves();
      setLeaves(data);
    } catch (error) {
      console.error('Error loading leaves:', error);
      toast.error('Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await leaveService.getLeaveStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleApprovalSuccess = () => {
    loadLeaves();
    loadStatistics();
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = 
      leave.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    const matchesType = typeFilter === 'all' || leave.leaveType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case LEAVE_STATUS.PENDING:
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case LEAVE_STATUS.APPROVED:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case LEAVE_STATUS.REJECTED:
        return <X className="w-4 h-4 text-red-400" />;
      case LEAVE_STATUS.CANCELLED:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setShowApprovalModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Leave Management</h1>
            <p className="text-gray-400">Manage employee leave applications</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{statistics.total}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{statistics.pending}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-white">{statistics.approved}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-600/20 rounded-lg">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Rejected</p>
                  <p className="text-2xl font-bold text-white">{statistics.rejected}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-primary pl-10 w-full"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-primary w-full"
              >
                <option value="all">All Status</option>
                {Object.values(LEAVE_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {getLeaveStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="lg:w-48">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-primary w-full"
              >
                <option value="all">All Types</option>
                {Object.values(LEAVE_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {getLeaveTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Leave Applications Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" color="white" />
            </div>
          ) : filteredLeaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Employee</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Leave Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date Range</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Applied On</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave, index) => (
                    <motion.tr
                      key={leave.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {leave.userName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{leave.userName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-300">
                          {getLeaveTypeLabel(leave.leaveType)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-300">
                          {formatDateRange(leave.startDate, leave.endDate)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-300">
                          {leave.duration} days
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(leave.status)}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeaveStatusColor(leave.status)}`}>
                            {getLeaveStatusLabel(leave.status)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-300">
                          {formatDate(leave.createdAt)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewLeave(leave)}
                            className="p-1 text-gray-400 hover:text-primary-400 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {leave.status === LEAVE_STATUS.PENDING && (
                            <button
                              onClick={() => handleViewLeave(leave)}
                              className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                              title="Review Application"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'No leaves found' : 'No leave applications yet'}
              </h3>
              <p className="text-gray-400">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Leave applications will appear here when employees submit them.'
                }
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Leave Approval Modal */}
      <LeaveApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedLeave(null);
        }}
        onSuccess={handleApprovalSuccess}
        leave={selectedLeave}
      />
    </DashboardLayout>
  );
};

export default LeaveManagement;
