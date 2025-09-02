import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Clock, Calendar, FileText, Briefcase } from 'lucide-react';
import CustomDatePicker from '../ui/DatePicker';
import { WORK_TYPES, getWorkTypeLabel } from '../../types';
import { projectService } from '../../services/projectService';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const timeLogSchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  workType: z.enum(Object.values(WORK_TYPES), { required_error: 'Please select work type' }),
  hours: z.number().min(0.1, 'Hours must be at least 0.1').max(24, 'Hours cannot exceed 24'),
  date: z.date({ required_error: 'Please select a date' }),
  description: z.string().min(5, 'Description must be at least 5 characters')
});

const TimeLogModal = ({ isOpen, onClose, onSuccess, projects = [], preselectedProject = null, timeLog = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData } = useAuthStore();
  
  const isEditing = !!timeLog;

  // Filter projects to only show those where the user is assigned as a developer or admin
  const userAssignedProjects = projects.filter(project => {
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(timeLogSchema),
    defaultValues: {
      projectId: timeLog?.projectId || preselectedProject?.id || '',
      date: timeLog?.date ? new Date(timeLog.date) : new Date(),
      hours: timeLog?.hours || 1,
      workType: timeLog?.workType || WORK_TYPES.OTHER,
      description: timeLog?.description || ''
    }
  });

  // Reset form when timeLog prop changes (for editing)
  useEffect(() => {
    if (timeLog) {
      reset({
        projectId: timeLog.projectId,
        date: new Date(timeLog.date),
        hours: timeLog.hours,
        workType: timeLog.workType,
        description: timeLog.description
      });
    } else if (!isOpen) {
      // Reset to defaults when modal closes
      reset({
        projectId: preselectedProject?.id || '',
        date: new Date(),
        hours: 1,
        workType: WORK_TYPES.OTHER,
        description: ''
      });
    }
  }, [timeLog, isOpen, reset, preselectedProject]);

  const selectedProjectId = watch('projectId');
  const selectedProject = userAssignedProjects.find(p => p.id === selectedProjectId);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const timeLogData = {
        ...data,
        hours: parseFloat(data.hours),
        userId: userData.id,
        userName: userData.name,
        createdBy: userData.id
      };

      if (isEditing) {
        // Update existing time log
        await projectService.updateTimeLog(timeLog.id, timeLogData);
        toast.success('Time log updated successfully!');
      } else {
        // Create new time log
        await projectService.logTime(timeLogData);
        toast.success('Time logged successfully!');
      }
      
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving time log:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'log'} time`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // If editing and form has changes, confirm before closing
      if (isEditing) {
        const formData = watch();
        const hasChanges = 
          formData.projectId !== timeLog?.projectId ||
          formData.hours !== timeLog?.hours ||
          formData.workType !== timeLog?.workType ||
          formData.description !== timeLog?.description ||
          new Date(formData.date).getTime() !== new Date(timeLog?.date).getTime();
          
        if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
          return;
        }
      }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-dark-900 border border-dark-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Dialog.Title className="text-lg font-semibold text-white flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-primary-400" />
                      {isEditing ? 'Edit Time Log' : 'Log Time'}
                    </Dialog.Title>
                    {isEditing && (
                      <span className="ml-3 px-2 py-1 text-xs font-medium bg-yellow-600/20 text-yellow-400 rounded-full">
                        Editing
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Project Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        {...register('projectId')}
                        className={`input-primary pl-10 w-full ${
                          errors.projectId ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                      >
                        <option value="">Select a project</option>
                        {userAssignedProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.projectId && (
                      <p className="mt-1 text-sm text-red-500">{errors.projectId.message}</p>
                    )}
                  </div>

                  {/* Work Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Work Type *
                    </label>
                    <select
                      {...register('workType')}
                      className={`input-primary w-full ${
                        errors.workType ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                    >
                      {Object.values(WORK_TYPES).filter(type => type !== WORK_TYPES.UI_DESIGN).map((type) => (
                        <option key={type} value={type}>
                          {getWorkTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                    {errors.workType && (
                      <p className="mt-1 text-sm text-red-500">{errors.workType.message}</p>
                    )}
                    
                    {/* UI Design Notice */}
                    <div className="mt-2 p-2 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="text-xs text-blue-300 font-medium">UI/UX Design Work</p>
                          <p className="text-xs text-blue-400 mt-0.5">
                            Design work is outsourced to external agencies and not tracked in time logs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date *
                      </label>
                      <CustomDatePicker
                        selected={watch('date')}
                        onChange={(d) => setValue('date', d, { shouldValidate: true })}
                        placeholderText="Select date"
                        className=""
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
                      )}
                    </div>

                    {/* Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Hours *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('hours', { valueAsNumber: true })}
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="24"
                          className={`input-primary pl-10 w-full ${
                            errors.hours ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="1.0"
                        />
                      </div>
                      {errors.hours && (
                        <p className="mt-1 text-sm text-red-500">{errors.hours.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description *
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className={`input-primary pl-10 w-full resize-none ${
                          errors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        placeholder="Describe what you worked on..."
                      />
                    </div>
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Project Info */}
                  {selectedProject && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-dark-800 rounded-lg"
                    >
                      <h4 className="text-sm font-medium text-white mb-1">
                        {selectedProject.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        Status: {selectedProject.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        Total Logged: {selectedProject.totalLoggedHours || 0}h
                      </p>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
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
                        isEditing ? 'Update Time Log' : 'Log Time'
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

export default TimeLogModal;
