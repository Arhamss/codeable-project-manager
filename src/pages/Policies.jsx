import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, Calendar, User, Eye } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { policiesService } from '../services/policiesService';
import FormattedText from '../components/ui/FormattedText';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDateWithOrdinal } from '../utils/dateUtils';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const handleDownload = async (policy) => {
    if (!policy.fileUrl) {
      toast.error('Policy file not available');
      return;
    }

    try {
      toast.loading('Preparing download...');
      
      // Fetch the file from Firebase Storage
      const response = await fetch(policy.fileUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = policy.fileName || `${policy.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success(`Downloaded ${policy.title}`);
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading policy:', error);
      toast.error('Failed to download policy');
    }
  };

  const handleView = (policy) => {
    if (!policy.fileUrl) {
      toast.error('Policy file not available');
      return;
    }
    
    // Firebase Storage URLs can be opened directly
    window.open(policy.fileUrl, '_blank');
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
          <h1 className="text-3xl font-bold text-white mb-2">Company Policies</h1>
          <p className="text-gray-400">
            Access and download all company policies and guidelines
          </p>
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

        {/* Policies Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPolicies.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No policies found</h3>
              <p className="text-gray-400">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No policies have been added yet'
                }
              </p>
            </div>
          ) : (
            filteredPolicies.map((policy, index) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800 rounded-lg border border-dark-700 p-6 hover:border-dark-600 transition-all duration-300"
              >
                {/* Policy Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {policy.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(policy.category)} text-white`}>
                        {getCategoryLabel(policy.category)}
                      </span>
                      {policy.isActive ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500 text-white">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center ml-4">
                    <FileText className="w-6 h-6 text-primary-400" />
                  </div>
                </div>

                {/* Policy Description */}
                {policy.description && (
                  <div className="mb-4">
                    <FormattedText 
                      text={policy.description} 
                      className="text-gray-400 text-sm line-clamp-3" 
                    />
                  </div>
                )}

                {/* Policy Meta */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Updated: {policy.updatedAt ? formatDateWithOrdinal(policy.updatedAt) : 'N/A'}</span>
                  </div>
                  {policy.uploadedBy && (
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-2" />
                      <span>By: {policy.uploadedBy}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleView(policy)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(policy)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white border border-dark-600 rounded-lg transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Policies;
