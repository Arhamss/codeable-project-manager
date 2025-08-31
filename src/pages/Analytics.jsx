import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import {
  DollarSign,
  Clock,
  FolderOpen,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { analyticsService } from '../services/analyticsService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { PROJECT_TYPES, WORK_TYPES, getProjectTypeLabel, getWorkTypeLabel } from '../types';
import { formatCurrency, formatDate } from '../utils/date';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedProject, setSelectedProject] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Date range options
  const dateRangeOptions = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'allTime', label: 'All Time' }
  ];

  // Colors for charts
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    teal: '#14B8A6'
  };

  const pieColors = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.purple, chartColors.teal, chartColors.danger];

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedProject]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAnalytics(dateRange, selectedProject);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const exportData = () => {
    if (!analytics) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      selectedProject,
      summary: analytics.summary,
      projects: analytics.projects,
      timeTracking: analytics.timeTracking
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={loadAnalytics}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    summary,
    revenue,
    projects,
    timeTracking,
    workTypes,
    userProductivity
  } = analytics || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Comprehensive insights into your projects and team performance</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={exportData}
            className="btn-primary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Date Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects?.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 rounded-lg p-6 border border-dark-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(summary?.totalRevenue || 0)}
              </p>
              {summary?.revenueChange && (
                <div className={`flex items-center mt-2 text-sm ${summary.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.revenueChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(summary.revenueChange)}% from last period
                </div>
              )}
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800 rounded-lg p-6 border border-dark-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Hours</p>
              <p className="text-2xl font-bold text-white mt-1">
                {summary?.totalHours || 0}h
              </p>
              {summary?.hoursChange && (
                <div className={`flex items-center mt-2 text-sm ${summary.hoursChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.hoursChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(summary.hoursChange)}% from last period
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800 rounded-lg p-6 border border-dark-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Projects</p>
              <p className="text-2xl font-bold text-white mt-1">
                {summary?.activeProjects || 0}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {summary?.totalProjects || 0} total projects
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FolderOpen className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-800 rounded-lg p-6 border border-dark-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Team Members</p>
              <p className="text-2xl font-bold text-white mt-1">
                {summary?.activeUsers || 0}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Avg {summary?.avgHoursPerUser || 0}h per user
              </p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-dark-800 rounded-lg p-6 border border-dark-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenue || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                tickFormatter={(value) => `$${value}`}
                label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value) => [formatCurrency(value), 'Daily Revenue']}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke={chartColors.primary} 
                fill={`${chartColors.primary}20`}
                strokeWidth={2}
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Project Types Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-dark-800 rounded-lg p-6 border border-dark-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Project Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projects?.reduce((acc, project) => {
                  const type = project.projectType;
                  const existing = acc.find(item => item.type === type);
                  if (existing) {
                    existing.count += 1;
                    existing.revenue += project.totalRevenue || 0;
                  } else {
                    acc.push({
                      type,
                      name: getProjectTypeLabel(type),
                      count: 1,
                      revenue: project.totalRevenue || 0
                    });
                  }
                  return acc;
                }, []) || []}
                cx="50%"
                cy="40%"
                outerRadius={60}
                dataKey="count"
                label={({ name, count, percent }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {projects?.reduce((acc, project) => {
                  const type = project.projectType;
                  if (!acc.find(item => item.type === type)) {
                    acc.push({ type });
                  }
                  return acc;
                }, []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value, name) => [
                  name === 'count' ? `${value} projects` : formatCurrency(value), 
                  name === 'count' ? 'Projects' : 'Total Revenue'
                ]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Types Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-dark-800 rounded-lg p-6 border border-dark-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Work Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workTypes || []} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF" 
                label={{ value: 'Hours Logged', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value) => [`${value} hours`, 'Hours Logged']}
                labelFormatter={(label) => `Work Type: ${label}`}
              />
              <Bar dataKey="hours" fill={chartColors.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* User Productivity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-dark-800 rounded-lg p-6 border border-dark-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Team Productivity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={userProductivity || []} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                stroke="#9CA3AF"
                label={{ value: 'Hours Logged', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#9CA3AF" 
                width={100}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value) => [`${value} hours`, 'Hours Logged']}
                labelFormatter={(label) => `Team Member: ${label}`}
              />
              <Bar dataKey="hours" fill={chartColors.accent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Time Tracking Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-dark-800 rounded-lg border border-dark-700"
      >
        <div className="p-6 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-white">Recent Time Logs</h3>
          <p className="text-gray-400 text-sm mt-1">Latest time entries across all projects</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Work Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {timeTracking?.slice(0, 10).map((log, index) => (
                <tr key={index} className="hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{log.userName}</div>
                    <div className="text-xs text-gray-400">{log.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{log.projectName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                      {getWorkTypeLabel(log.workType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {log.hours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDate(log.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {(!timeTracking || timeTracking.length === 0) && (
          <div className="p-6 text-center text-gray-400">
            No time logs found for the selected period.
          </div>
        )}
      </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;