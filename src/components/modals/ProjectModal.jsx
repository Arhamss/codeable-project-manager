import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Briefcase, DollarSign, Clock, User } from 'lucide-react';
import { 
  PROJECT_STATUS, 
  PROJECT_TYPES, 
  BILLING_FREQUENCY, 
  REVENUE_TYPE,
  COST_CATEGORIES, 
  DEVELOPER_ROLES,
  getCostCategoryLabel, 
  getProjectStatusLabel, 
  getProjectTypeLabel,
  getBillingFrequencyLabel,
  getRevenueTypeLabel,
  getDeveloperRoleLabel
} from '../../types';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  client: z.string().optional(),
  status: z.enum(Object.values(PROJECT_STATUS)),
  projectType: z.enum(Object.values(PROJECT_TYPES)),
  
  // Income - different based on project type
  income: z.number().min(0, 'Income must be non-negative').optional(),
  monthlyAmount: z.number().min(0, 'Monthly amount must be non-negative').optional(),
  billingFrequency: z.enum(Object.values(BILLING_FREQUENCY)).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be non-negative').optional(),
  revenueType: z.enum(Object.values(REVENUE_TYPE)).optional(),
  
  // Costs
  costs: z.object({
    [COST_CATEGORIES.BACKEND]: z.number().min(0).optional(),
    [COST_CATEGORIES.FRONTEND_WEB]: z.number().min(0).optional(),
    [COST_CATEGORIES.FRONTEND_MOBILE]: z.number().min(0).optional(),
    [COST_CATEGORIES.UI_DESIGN]: z.number().min(0).optional(),
    [COST_CATEGORIES.DEPLOYMENT]: z.number().min(0).optional(),
    [COST_CATEGORIES.OTHER]: z.number().min(0).optional()
  }),

  // Estimated Hours
  estimatedHours: z.object({
    [COST_CATEGORIES.BACKEND]: z.number().min(0).optional(),
    [COST_CATEGORIES.FRONTEND_WEB]: z.number().min(0).optional(),
    [COST_CATEGORIES.FRONTEND_MOBILE]: z.number().min(0).optional(),
    [COST_CATEGORIES.UI_DESIGN]: z.number().min(0).optional(),
    [COST_CATEGORIES.DEPLOYMENT]: z.number().min(0).optional(),
    [COST_CATEGORIES.OTHER]: z.number().min(0).optional()
  }),

  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // Developer Roles Assignments (support multiple developers per role)
  developerRoles: z.object({
    [DEVELOPER_ROLES.FRONTEND_MOBILE]: z.array(z.string()).optional(),
    [DEVELOPER_ROLES.FRONTEND_WEB]: z.array(z.string()).optional(),
    [DEVELOPER_ROLES.BACKEND]: z.array(z.string()).optional(),
    [DEVELOPER_ROLES.UI_DESIGNER]: z.array(z.string()).optional(),
    [DEVELOPER_ROLES.TEAM_LEAD]: z.array(z.string()).min(1, 'At least one Team Lead is required')
  })
});

const ProjectModal = ({ isOpen, onClose, onSuccess, project = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: PROJECT_STATUS.PLANNING,
      projectType: PROJECT_TYPES.ONE_TIME,
      income: 0,
      monthlyAmount: 0,
      billingFrequency: BILLING_FREQUENCY.MONTHLY,
      hourlyRate: 0,
      revenueType: REVENUE_TYPE.FIXED,
      costs: {
        [COST_CATEGORIES.BACKEND]: 0,
        [COST_CATEGORIES.FRONTEND_WEB]: 0,
        [COST_CATEGORIES.FRONTEND_MOBILE]: 0,
        [COST_CATEGORIES.UI_DESIGN]: 0,
        [COST_CATEGORIES.DEPLOYMENT]: 0,
        [COST_CATEGORIES.OTHER]: 0
      },
      estimatedHours: {
        [COST_CATEGORIES.BACKEND]: 0,
        [COST_CATEGORIES.FRONTEND_WEB]: 0,
        [COST_CATEGORIES.FRONTEND_MOBILE]: 0,
        [COST_CATEGORIES.UI_DESIGN]: 0,
        [COST_CATEGORIES.DEPLOYMENT]: 0,
        [COST_CATEGORIES.OTHER]: 0
      },
      developerRoles: {
        [DEVELOPER_ROLES.FRONTEND_MOBILE]: [],
        [DEVELOPER_ROLES.FRONTEND_WEB]: [],
        [DEVELOPER_ROLES.BACKEND]: [],
        [DEVELOPER_ROLES.UI_DESIGNER]: [],
        [DEVELOPER_ROLES.TEAM_LEAD]: []
      }
    }
  });

  const projectType = watch('projectType');

  useEffect(() => {
    if (project) {
      // Set form values when editing
      Object.keys(project).forEach(key => {
        if (key === 'startDate' || key === 'endDate') {
          if (project[key]) {
            const date = typeof project[key] === 'string' 
              ? project[key] 
              : project[key].toISOString();
            setValue(key, date.split('T')[0]);
          }
        } else if (key === 'costs' || key === 'estimatedHours' || key === 'developerRoles') {
          Object.keys(project[key] || {}).forEach(subKey => {
            if (key === 'developerRoles') {
              // Handle both old string format and new array format
              const value = project[key][subKey];
              if (Array.isArray(value)) {
                setValue(`${key}.${subKey}`, value);
              } else if (typeof value === 'string' && value) {
                setValue(`${key}.${subKey}`, [value]); // Convert old single value to array
              } else {
                setValue(`${key}.${subKey}`, []);
              }
            } else {
              setValue(`${key}.${subKey}`, project[key][subKey] || 0);
            }
          });
        } else {
          setValue(key, project[key]);
        }
      });
    } else {
      reset();
    }
  }, [project, setValue, reset]);

  // Load users for developer role assignment
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersData = await userService.getUsers();
        const activeUsers = usersData.filter(user => user.isActive !== false); // Include users where isActive is not explicitly false
        setUsers(activeUsers);
        
        if (activeUsers.length === 0) {
          toast.info('No users found. Please create some users first in the Users section.');
        }
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users: ' + error.message);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Clean up data
      const projectData = {
        ...data,
        income: parseFloat(data.income) || 0,
        costs: Object.fromEntries(
          Object.entries(data.costs).map(([key, value]) => [key, parseFloat(value) || 0])
        ),
        estimatedHours: Object.fromEntries(
          Object.entries(data.estimatedHours).map(([key, value]) => [key, parseFloat(value) || 0])
        )
      };

      if (isEditing) {
        await projectService.updateProject(project.id, projectData);
      } else {
        await projectService.createProject(projectData);
      }
      
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} project`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-dark-900 border border-dark-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-white flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-primary-400" />
                    {isEditing ? 'Edit Project' : 'Create New Project'}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-white border-b border-dark-700 pb-2">
                        Basic Information
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Project Name *
                        </label>
                        <input
                          {...register('name')}
                          type="text"
                          className={`input-primary w-full ${
                            errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Enter project name"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Client
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            {...register('client')}
                            type="text"
                            className="input-primary pl-10 w-full"
                            placeholder="Client name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Status *
                        </label>
                        <select
                          {...register('status')}
                          className={`input-primary pr-10 w-full ${
                            errors.status ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                        >
                          {Object.values(PROJECT_STATUS).map((status) => (
                            <option key={status} value={status}>
                              {getProjectStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                        {errors.status && (
                          <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Project Type *
                        </label>
                        <select
                          {...register('projectType')}
                          className={`input-primary pr-10 w-full ${
                            errors.projectType ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                        >
                          {Object.values(PROJECT_TYPES).map((type) => (
                            <option key={type} value={type}>
                              {getProjectTypeLabel(type)}
                            </option>
                          ))}
                        </select>
                        {errors.projectType && (
                          <p className="mt-1 text-sm text-red-500">{errors.projectType.message}</p>
                        )}
                      </div>

                      {/* Income Fields - Conditional based on project type */}
                      {projectType === PROJECT_TYPES.ONE_TIME && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Total Project Value *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              {...register('income', { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              min="0"
                              className={`input-primary pl-10 w-full ${
                                errors.income ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                              }`}
                              placeholder="0.00"
                            />
                          </div>
                          {errors.income && (
                            <p className="mt-1 text-sm text-red-500">{errors.income.message}</p>
                          )}
                        </div>
                      )}

                      {projectType === PROJECT_TYPES.RETAINER && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Monthly Retainer Amount *
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                {...register('monthlyAmount', { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                min="0"
                                className={`input-primary pl-10 w-full ${
                                  errors.monthlyAmount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                                }`}
                                placeholder="0.00"
                              />
                            </div>
                            {errors.monthlyAmount && (
                              <p className="mt-1 text-sm text-red-500">{errors.monthlyAmount.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Billing Frequency
                            </label>
                            <select
                              {...register('billingFrequency')}
                              className="input-primary pr-10 w-full"
                            >
                              {Object.values(BILLING_FREQUENCY).map((freq) => (
                                <option key={freq} value={freq}>
                                  {getBillingFrequencyLabel(freq)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Revenue Type
                            </label>
                            <select
                              {...register('revenueType')}
                              className="input-primary pr-10 w-full"
                            >
                              {Object.values(REVENUE_TYPE).map((type) => (
                                <option key={type} value={type}>
                                  {getRevenueTypeLabel(type)}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Choose whether revenue is fixed or based on hours worked
                            </p>
                          </div>
                        </>
                      )}

                      {projectType === PROJECT_TYPES.HOURLY && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Hourly Rate *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              {...register('hourlyRate', { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              min="0"
                              className={`input-primary pl-10 w-full ${
                                errors.hourlyRate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                              }`}
                              placeholder="0.00"
                            />
                          </div>
                          {errors.hourlyRate && (
                            <p className="mt-1 text-sm text-red-500">{errors.hourlyRate.message}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-white border-b border-dark-700 pb-2">
                        Timeline {projectType === PROJECT_TYPES.RETAINER ? '(Optional for retainers)' : '(Optional)'}
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date {projectType === PROJECT_TYPES.RETAINER ? '(Contract Start)' : ''}
                        </label>
                        <input
                          {...register('startDate')}
                          type="date"
                          className="input-primary w-full"
                          placeholder={projectType === PROJECT_TYPES.RETAINER ? 'When does the retainer start?' : ''}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date {projectType === PROJECT_TYPES.RETAINER ? '(Contract End - Optional)' : ''}
                        </label>
                        <input
                          {...register('endDate')}
                          type="date"
                          className="input-primary w-full"
                          placeholder={projectType === PROJECT_TYPES.RETAINER ? 'Leave empty for ongoing retainer' : ''}
                        />
                        {projectType === PROJECT_TYPES.RETAINER && (
                          <p className="text-xs text-gray-500 mt-1">
                            Leave empty for ongoing retainers without end date
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description *
                        </label>
                        <textarea
                          {...register('description')}
                          rows={4}
                          className={`input-primary w-full resize-none ${
                            errors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Describe the project..."
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Costs and Hours */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Costs */}
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-white border-b border-dark-700 pb-2">
                        Expected Costs (Optional)
                      </h3>
                      
                      {Object.values(COST_CATEGORIES).map((category) => (
                        <div key={category}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {getCostCategoryLabel(category)} Cost
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              {...register(`costs.${category}`, { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              min="0"
                              className="input-primary pl-10 w-full"
                              placeholder="0.00"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Expected cost for this category</p>
                        </div>
                      ))}
                    </div>

                    {/* Estimated Hours */}
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-white border-b border-dark-700 pb-2">
                        Estimated Hours
                      </h3>
                      
                      {Object.values(COST_CATEGORIES).map((category) => (
                        <div key={category}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {getCostCategoryLabel(category)} Hours
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Clock className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              {...register(`estimatedHours.${category}`, { valueAsNumber: true })}
                              type="number"
                              step="0.1"
                              min="0"
                              className="input-primary pl-10 w-full"
                              placeholder="0.0"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Estimated hours for this category</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Developer Roles Section */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-white border-b border-dark-700 pb-2">
                      Team Assignment
                    </h3>
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-gray-400">Loading team members...</span>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-400 mb-2">No users found</p>
                        <p className="text-sm text-gray-500">Please create some users first in the Users section</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.values(DEVELOPER_ROLES).map((role) => (
                          <div key={role} className="space-y-3">
                            <label className="block text-sm font-medium text-gray-300">
                              {getDeveloperRoleLabel(role)}
                              {role === DEVELOPER_ROLES.TEAM_LEAD && (
                                <span className="text-red-400 ml-1">*</span>
                              )}
                              <span className="text-xs text-gray-500 ml-2">
                                {role === DEVELOPER_ROLES.TEAM_LEAD 
                                  ? '(Select one or more)' 
                                  : '(Select multiple developers)'
                                }
                              </span>
                            </label>
                            
                            {/* Multi-select Dropdown with Chips */}
                            <div className="space-y-3">
                              {/* Selected Developers Chips */}
                              {watch(`developerRoles.${role}`)?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {watch(`developerRoles.${role}`).map((userId) => {
                                    const user = users.find(u => u.id === userId);
                                    if (!user) return null;
                                    return (
                                      <div
                                        key={userId}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-sm"
                                      >
                                        <div className="w-5 h-5 rounded-full bg-primary-500/30 flex items-center justify-center">
                                          <span className="text-xs font-medium text-primary-300">
                                            {(user.name || `${user.firstName || ''} ${user.lastName || ''}`).charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <span className="text-white font-medium">
                                          {user.name || `${user.firstName || ''} ${user.lastName || ''}`}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentValue = watch(`developerRoles.${role}`) || [];
                                            const newValue = currentValue.filter(id => id !== userId);
                                            setValue(`developerRoles.${role}`, newValue);
                                          }}
                                          className="text-primary-300 hover:text-primary-200 transition-colors"
                                        >
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Dropdown */}
                              <div className="relative">
                                <select
                                  className="input-primary pr-10 w-full"
                                  onChange={(e) => {
                                    const selectedUserId = e.target.value;
                                    if (selectedUserId) {
                                      const currentValue = watch(`developerRoles.${role}`) || [];
                                      if (!currentValue.includes(selectedUserId)) {
                                        const newValue = [...currentValue, selectedUserId];
                                        setValue(`developerRoles.${role}`, newValue);
                                      }
                                      e.target.value = ''; // Reset dropdown
                                    }
                                  }}
                                  value=""
                                >
                                  <option value="">
                                    {role === DEVELOPER_ROLES.TEAM_LEAD 
                                      ? 'Select Team Lead' 
                                      : 'Select Developer'
                                    }
                                  </option>
                                  {users
                                    .filter(user => !watch(`developerRoles.${role}`)?.includes(user.id))
                                    .map((user) => (
                                      <option key={user.id} value={user.id}>
                                        {user.name || `${user.firstName || ''} ${user.lastName || ''}`} - {user.email}
                                      </option>
                                    ))
                                  }
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              
                              {/* Clear All Button */}
                              {watch(`developerRoles.${role}`)?.length > 0 && (
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setValue(`developerRoles.${role}`, [])}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    Clear all selections
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {errors.developerRoles?.[role] && (
                              <p className="text-red-400 text-xs mt-1">
                                {errors.developerRoles[role].message}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t border-dark-700">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1 flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        isEditing ? 'Update Project' : 'Create Project'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ProjectModal;
