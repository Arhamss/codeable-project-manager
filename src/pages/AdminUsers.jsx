import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Clock,
  TrendingUp,
  Users as UsersIcon,
  Shield,
  User
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { userService } from '../services/userService';
import { USER_ROLES } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import UserModal from '../components/modals/UserModal';
import UserCard from '../components/users/UserCard';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.isActive === true);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => user.isActive === false);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleUserSuccess = () => {
    setShowUserModal(false);
    setEditingUser(null);
    loadUsers();
    toast.success(editingUser ? 'User updated successfully!' : 'User created successfully!');
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await userService.updateUserStatus(userId, !currentStatus);
      loadUsers();
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        loadUsers();
        toast.success('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const calculateUserMetrics = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const adminUsers = users.filter(u => u.role === USER_ROLES.ADMIN).length;
    const teamMembers = users.filter(u => u.role === USER_ROLES.USER).length;

    return { totalUsers, activeUsers, adminUsers, teamMembers };
  };

  const getRoleColor = (role) => {
    return role === USER_ROLES.ADMIN 
      ? 'bg-purple-600/20 text-purple-400 border-purple-600/30'
      : 'bg-blue-600/20 text-blue-400 border-blue-600/30';
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-600/20 text-green-400 border-green-600/30'
      : 'bg-red-600/20 text-red-400 border-red-600/30';
  };

  const metrics = calculateUserMetrics();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Loading users..." />
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
            <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
            <p className="text-gray-400">Manage team members, roles, and permissions</p>
          </div>
          <motion.button
            onClick={() => setShowUserModal(true)}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
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
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{metrics.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-400" />
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
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">{metrics.activeUsers}</p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-400" />
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
                <p className="text-gray-400 text-sm">Administrators</p>
                <p className="text-2xl font-bold text-white">{metrics.adminUsers}</p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Shield className="w-6 h-6 text-purple-400" />
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
                <p className="text-gray-400 text-sm">Team Members</p>
                <p className="text-2xl font-bold text-white">{metrics.teamMembers}</p>
              </div>
              <div className="p-3 bg-orange-600/20 rounded-lg">
                <User className="w-6 h-6 text-orange-400" />
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-primary pl-10 w-full sm:w-64"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input-primary pl-10 pr-10 w-full sm:w-48"
                >
                  <option value="all">All Roles</option>
                  <option value={USER_ROLES.ADMIN}>Administrators</option>
                  <option value={USER_ROLES.USER}>Team Members</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-primary pr-10 w-full sm:w-48"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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

        {/* Users Display */}
        {filteredUsers.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <UserCard
                    user={user}
                    onEdit={() => handleEditUser(user)}
                    onToggleStatus={() => handleToggleUserStatus(user.id, user.isActive)}
                    onDelete={() => handleDeleteUser(user.id)}
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Department</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Last Active</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-full">
                              <span className="text-sm font-medium text-white">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getRoleColor(user.role)}`}>
                            {user.role === USER_ROLES.ADMIN ? 'Administrator' : 'Team Member'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-white">{user.department || 'Not specified'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(user.isActive)}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-400 text-sm">
                            {user.lastLoginAt 
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : 'Never'
                            }
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              className={`p-1 transition-colors ${
                                user.isActive 
                                  ? 'text-gray-400 hover:text-red-400' 
                                  : 'text-gray-400 hover:text-green-400'
                              }`}
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
            <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first team member.'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={() => setShowUserModal(true)}
                className="btn-primary"
              >
                Add User
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
        }}
        onSuccess={handleUserSuccess}
        user={editingUser}
      />
    </DashboardLayout>
  );
};

export default AdminUsers;
