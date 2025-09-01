import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  X,
  AlertTriangle,
  TrendingUp,
  FileText,
  User
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
import LeaveApplicationModal from '../components/modals/LeaveApplicationModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import { formatTableDate, formatDateRange } from '../utils/dateUtils';

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const { userData } = useAuthStore();

  useEffect(() => {
    if (userData?.id) {
      loadLeaves();
      loadLeaveBalance();
    }
  }, [userData]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getUserLeaves(userData.id);
      setLeaves(data);
    } catch (error) {
      console.error('Error loading leaves:', error);
      toast.error('Failed to load your leave applications');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveBalance = async () => {
    try {
      setLoadingBalance(true);
      const balance = await leaveService.getUserLeaveBalance(userData.id);
      setLeaveBalance(balance);
    } catch (error) {
      console.error('Error loading leave balance:', error);
      toast.error('Failed to load leave balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleApplicationSuccess = () => {
    loadLeaves();
    loadLeaveBalance();
  };

  const handleViewDetails = (leave) => {
    // For now, just show a toast with leave details
    // In the future, this could open a detailed modal
    toast.success(`Leave Details: ${leave.leaveType} for ${leave.duration} days`);
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      const confirmed = window.confirm('Are you sure you want to cancel this leave application?');
      if (!confirmed) return;

      await leaveService.cancelLeave(leaveId, userData.id);
      toast.success('Leave application cancelled successfully');
      loadLeaves();
      loadLeaveBalance();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      toast.error('Failed to cancel leave application');
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = 
      leave.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    const matchesType = typeFilter === 'all' || leave.leaveType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });



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

  const getLeaveBalanceColor = (leaveType) => {
    if (!leaveBalance) return 'text-gray-400';
    const remaining = leaveBalance.remaining[leaveType];
    if (remaining <= 0) return 'text-red-400';
    if (remaining <= 2) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Leaves</h1>
            <p className="text-gray-400">Manage your leave applications</p>
          </div>
          <motion.button
            onClick={() => setShowApplicationModal(true)}
            className="btn-primary flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </motion.button>
        </div>

        {/* Leave Balance */}
        {loadingBalance ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" color="white" />
              <span className="ml-2 text-gray-400">Loading leave balance...</span>
            </div>
          </motion.div>
        ) : leaveBalance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary-600/20 rounded-lg">
                <Calendar className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Leave Balance</h2>
                <p className="text-sm text-gray-400">Your available leave days</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.values(LEAVE_TYPES).map((type, index) => {
                const remaining = leaveBalance.remaining[type];
                const allocation = leaveBalance.allocation[type];
                const percentage = (remaining / allocation) * 100;
                const isLow = remaining <= 2;
                const isExhausted = remaining <= 0;
                
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="relative group"
                  >
                    <div className={`
                      relative overflow-hidden rounded-xl p-6 border transition-all duration-300
                      ${isExhausted 
                        ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                        : isLow 
                          ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50' 
                          : 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                      }
                      hover:scale-105 hover:shadow-lg
                    `}>
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 right-0 w-20 h-20 transform rotate-12">
                          <Calendar className="w-full h-full" />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className={`
                              p-2 rounded-lg
                              ${isExhausted 
                                ? 'bg-red-500/20 text-red-400' 
                                : isLow 
                                  ? 'bg-yellow-500/20 text-yellow-400' 
                                  : 'bg-green-500/20 text-green-400'
                              }
                            `}>
                              <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                              {getLeaveTypeLabel(type)}
                            </span>
                          </div>
                          {isLow && !isExhausted && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-yellow-400 font-medium">Low</span>
                            </div>
                          )}
                          {isExhausted && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <span className="text-xs text-red-400 font-medium">Exhausted</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center mb-4">
                          <div className="flex items-baseline justify-center space-x-1">
                            <span className={`
                              text-3xl font-bold
                              ${isExhausted 
                                ? 'text-red-400' 
                                : isLow 
                                  ? 'text-yellow-400' 
                                  : 'text-green-400'
                              }
                            `}>
                              {remaining}
                            </span>
                            <span className="text-lg text-gray-400">/ {allocation}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            days remaining
                          </p>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Used</span>
                            <span className="text-gray-300 font-medium">{allocation - remaining} days</span>
                          </div>
                          <div className="w-full bg-dark-600/50 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className={`
                                h-2 rounded-full transition-all duration-500 ease-out
                                ${isExhausted 
                                  ? 'bg-red-500' 
                                  : isLow 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                                }
                              `}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.2 + index * 0.1, duration: 0.8 }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by reason..."
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
          transition={{ delay: 0.3 }}
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
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-primary-400" />
                          <span className="text-sm text-gray-300">
                            {getLeaveTypeLabel(leave.leaveType)}
                          </span>
                        </div>
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
                          {formatTableDate(leave.createdAt)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(leave)}
                            className="p-1 text-gray-400 hover:text-primary-400 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {leave.status === LEAVE_STATUS.PENDING && (
                            <button
                              onClick={() => handleCancelLeave(leave.id)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Cancel Application"
                            >
                              <X className="w-4 h-4" />
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
              <p className="text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : 'You haven\'t applied for any leaves yet.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="btn-primary"
                >
                  Apply for Your First Leave
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Leave Application Modal */}
      <LeaveApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onSuccess={handleApplicationSuccess}
      />
    </DashboardLayout>
  );
};

export default MyLeaves;
