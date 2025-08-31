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
  FileText,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { leaveService } from '../services/leaveService';
import { userService } from '../services/userService';
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
  const [users, setUsers] = useState([]);
  const [userLeaveBalances, setUserLeaveBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'applications', 'balances'

  useEffect(() => {
    loadLeaves();
    loadStatistics();
    loadUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      loadUserLeaveBalances();
    }
  }, [users]);

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

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserLeaveBalances = async () => {
    try {
      const balances = {};
      for (const user of users) {
        try {
          const balance = await leaveService.getUserLeaveBalance(user.id);
          balances[user.id] = balance;
        } catch (error) {
          console.error(`Error loading balance for user ${user.id}:`, error);
          balances[user.id] = null;
        }
      }
      setUserLeaveBalances(balances);
    } catch (error) {
      console.error('Error loading user leave balances:', error);
    }
  };

  const handleApprovalSuccess = () => {
    loadLeaves();
    loadStatistics();
    loadUserLeaveBalances();
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

  const getLeaveBalanceColor = (leaveType, balance) => {
    if (!balance) return 'text-gray-400';
    const remaining = balance.remaining[leaveType];
    if (remaining <= 0) return 'text-red-400';
    if (remaining <= 2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getLeaveBalanceProgressColor = (leaveType, balance) => {
    if (!balance) return 'bg-gray-500';
    const remaining = balance.remaining[leaveType];
    if (remaining <= 0) return 'bg-red-500';
    if (remaining <= 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const pendingLeaves = leaves.filter(leave => leave.status === LEAVE_STATUS.PENDING);
  const recentLeaves = leaves.slice(0, 5); // Last 5 applications

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Leave Management</h1>
            <p className="text-gray-400">Track employee leaves and manage applications</p>
          </div>
          <motion.button
            onClick={() => {
              loadLeaves();
              loadStatistics();
              loadUserLeaveBalances();
            }}
            className="btn-secondary flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-dark-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'applications', label: 'Applications', icon: FileText },
            { id: 'balances', label: 'Employee Balances', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
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

            {/* Pending Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
                <span className="text-sm text-gray-400">{pendingLeaves.length} requests</span>
              </div>
              
              {pendingLeaves.length > 0 ? (
                <div className="space-y-3">
                  {pendingLeaves.slice(0, 5).map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {leave.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{leave.userName}</p>
                          <p className="text-sm text-gray-400">
                            {getLeaveTypeLabel(leave.leaveType)} • {leave.duration} days
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewLeave(leave)}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                  {pendingLeaves.length > 5 && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setActiveTab('applications')}
                        className="text-primary-400 hover:text-primary-300 text-sm"
                      >
                        View all {pendingLeaves.length} pending requests
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-400">No pending leave requests</p>
                </div>
              )}
            </motion.div>

            {/* Recent Applications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Applications</h3>
                <button
                  onClick={() => setActiveTab('applications')}
                  className="text-primary-400 hover:text-primary-300 text-sm"
                >
                  View all
                </button>
              </div>
              
              {recentLeaves.length > 0 ? (
                <div className="space-y-3">
                  {recentLeaves.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {leave.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{leave.userName}</p>
                          <p className="text-sm text-gray-400">
                            {getLeaveTypeLabel(leave.leaveType)} • {formatDate(leave.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeaveStatusColor(leave.status)}`}>
                        {getLeaveStatusLabel(leave.status)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No recent applications</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
              transition={{ delay: 0.1 }}
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
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Employee Leave Balances</h3>
                <span className="text-sm text-gray-400">{users.length} employees</span>
              </div>
              
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" color="white" />
                </div>
              ) : users.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {users.map((user, index) => {
                    const balance = userLeaveBalances[user.id];
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-dark-700 rounded-lg p-4 border border-dark-600"
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.department || 'No department'}</p>
                          </div>
                        </div>
                        
                        {balance ? (
                          <div className="space-y-3">
                            {Object.values(LEAVE_TYPES).map((type) => (
                              <div key={type} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">{getLeaveTypeLabel(type)}</span>
                                  <span className={`text-sm font-medium ${getLeaveBalanceColor(type, balance)}`}>
                                    {balance.remaining[type]}/{balance.allocation[type]}
                                  </span>
                                </div>
                                <div className="w-full bg-dark-600 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full ${getLeaveBalanceProgressColor(type, balance)}`}
                                    style={{ 
                                      width: `${Math.max(0, (balance.remaining[type] / balance.allocation[type]) * 100)}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-xs text-gray-400">?</span>
                            </div>
                            <p className="text-xs text-gray-400">Balance not available</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No employees found</h3>
                  <p className="text-gray-400">Employee leave balances will appear here once users are added.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
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
