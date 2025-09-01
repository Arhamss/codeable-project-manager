import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Edit, Trash2, Upload, Calendar, User, Eye } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { policiesService } from '../services/policiesService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDateWithOrdinal } from '../utils/dateUtils';
import PolicyModal from '../components/modals/PolicyModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

const AdminPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const policiesData = await policiesService.getAllPolicies();
      setPolicies(policiesData);
    } catch (error) {
      console.error('Error loading policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = () => {
    setEditingPolicy(null);
    setIsPolicyModalOpen(true);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setIsPolicyModalOpen(true);
  };

  const handleDeletePolicy = (policy) => {
    setSelectedPolicy(policy);
    setIsDeleteModalOpen(true);
  };

  const handleViewPolicy = (policy) => {
    window.open(policy.fileUrl, '_blank');
  };

  const handlePolicyModalClose = () => {
    setIsPolicyModalOpen(false);
    setEditingPolicy(null);
  };

  const handlePolicyModalSuccess = () => {
    loadPolicies();
    handlePolicyModalClose();
    toast.success(editingPolicy ? 'Policy updated successfully' : 'Policy added successfully');
  };

  const handleDeleteConfirm = async () => {
    try {
      await policiesService.deletePolicy(selectedPolicy.id);
      await loadPolicies();
      setIsDeleteModalOpen(false);
      setSelectedPolicy(null);
      toast.success('Policy deleted successfully');
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error('Failed to delete policy');
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || policy.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'employment', 'leave', 'remote-work', 'equipment', 'compensation', 'other'];

  const getCategoryLabel = (category) => {
    const labels = {
      'employment': 'Employment',
      'leave': 'Leave & Time Off',
      'remote-work': 'Remote Work',
      'equipment': 'Equipment & IT',
      'compensation': 'Compensation',
      'other': 'Other'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'employment': 'bg-blue-500',
      'leave': 'bg-green-500',
      'remote-work': 'bg-purple-500',
      'equipment': 'bg-yellow-500',
      'compensation': 'bg-orange-500',
      'other': 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Manage Policies</h1>
              <p className="text-gray-400">
                Add, edit, and manage company policies and guidelines
              </p>
            </div>
            <button
              onClick={handleAddPolicy}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              Add Policy
            </button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Policies Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden"
        >
          {filteredPolicies.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No policies found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No policies have been added yet'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <button
                  onClick={handleAddPolicy}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Policy
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700 border-b border-dark-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Policy
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filteredPolicies.map((policy, index) => (
                    <motion.tr
                      key={policy.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-dark-700/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="w-8 h-8 text-primary-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-white">{policy.title}</div>
                            {policy.description && (
                              <div className="text-sm text-gray-400 line-clamp-1">
                                {policy.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(policy.category)} text-white`}>
                          {getCategoryLabel(policy.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          policy.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {policy.updatedAt ? formatDateWithOrdinal(policy.updatedAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPolicy(policy)}
                            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-600"
                            title="View Policy"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditPolicy(policy)}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-dark-600"
                            title="Edit Policy"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-dark-600"
                            title="Delete Policy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Modals */}
        <PolicyModal
          isOpen={isPolicyModalOpen}
          onClose={handlePolicyModalClose}
          onSuccess={handlePolicyModalSuccess}
          editingPolicy={editingPolicy}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Policy"
          message={`Are you sure you want to delete "${selectedPolicy?.title}"? This action cannot be undone.`}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminPolicies;
