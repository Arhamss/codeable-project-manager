import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { leaveService } from '../../services/leaveService';
import useAuthStore from '../../stores/authStore';
import { 
  LEAVE_TYPES, 
  getLeaveTypeLabel,
  DEFAULT_LEAVE_ALLOCATION 
} from '../../types';
import CustomDatePicker from '../ui/DatePicker';

const leaveApplicationSchema = z.object({
  leaveType: z.enum([LEAVE_TYPES.SICK, LEAVE_TYPES.CASUAL, LEAVE_TYPES.ANNUAL]),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  duration: z.number().min(0.5, 'Duration must be at least 0.5 days').max(30, 'Duration cannot exceed 30 days'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason cannot exceed 500 characters')
}).refine((data) => {
  return data.endDate >= data.startDate;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

const LeaveApplicationModal = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const { userData } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    setError
  } = useForm({
    resolver: zodResolver(leaveApplicationSchema),
    defaultValues: {
      leaveType: LEAVE_TYPES.CASUAL,
      startDate: null,
      endDate: null,
      duration: 1,
      reason: ''
    }
  });

  const watchedLeaveType = watch('leaveType');
  const watchedDuration = watch('duration');
  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');

  // Load user's leave balance
  useEffect(() => {
    if (isOpen && userData?.id) {
      loadLeaveBalance();
    }
  }, [isOpen, userData]);

  // Calculate duration when dates change
  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      if (watchedEndDate >= watchedStartDate) {
        const diffTime = Math.abs(watchedEndDate - watchedStartDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
        setValue('duration', diffDays);
      }
    }
  }, [watchedStartDate, watchedEndDate, setValue]);

  // Check if leave exceeds balance
  useEffect(() => {
    if (leaveBalance && watchedLeaveType && watchedDuration) {
      const remaining = leaveBalance.remaining[watchedLeaveType];
      const willExceed = watchedDuration > remaining;
      setShowWarning(willExceed);
    }
  }, [leaveBalance, watchedLeaveType, watchedDuration]);

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

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Check if user can apply for this leave
      const canApply = await leaveService.canApplyForLeave(
        userData.id, 
        data.leaveType, 
        data.duration
      );

      if (!canApply) {
        const remaining = leaveBalance.remaining[data.leaveType];
        const excess = data.duration - remaining;
        const deduction = leaveService.calculateSalaryDeduction(
          userData.monthlySalary || 0,
          excess
        );

        const confirmed = window.confirm(
          `You are applying for ${data.duration} days of ${getLeaveTypeLabel(data.leaveType)}, but you only have ${remaining} days remaining.\n\n` +
          `This will result in a salary deduction of ₨${deduction.toLocaleString()} for ${excess} excess days.\n\n` +
          `Do you want to proceed?`
        );

        if (!confirmed) {
          return;
        }
      }

      const leaveData = {
        userId: userData.id,
        userName: userData.name,
        companyId: userData.companyId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration,
        reason: data.reason
      };

      await leaveService.applyForLeave(leaveData);
      
      toast.success('Leave application submitted successfully!');
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error applying for leave:', error);
      toast.error('Failed to submit leave application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setShowWarning(false);
      onClose();
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-dark-800 border border-dark-700 shadow-xl transition-all">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6"
                >
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-primary-600/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-white">
                        Apply for Leave
                      </Dialog.Title>
                      <p className="text-sm text-gray-400">Submit a leave application</p>
                    </div>
                  </div>

                  {/* Leave Balance */}
                  {loadingBalance ? (
                    <div className="mb-6 p-4 bg-dark-700 rounded-lg">
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" color="white" />
                        <span className="ml-2 text-sm text-gray-400">Loading leave balance...</span>
                      </div>
                    </div>
                  ) : leaveBalance && (
                    <div className="mb-6 p-4 bg-dark-700 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-3">Your Leave Balance</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.values(LEAVE_TYPES).map((type) => (
                          <div key={type} className="text-center">
                            <p className="text-xs text-gray-400">{getLeaveTypeLabel(type)}</p>
                            <p className={`text-lg font-semibold ${getLeaveBalanceColor(type)}`}>
                              {leaveBalance.remaining[type]}
                            </p>
                            <p className="text-xs text-gray-500">
                              of {leaveBalance.allocation[type]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning for excess leaves */}
                  {showWarning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg"
                    >
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-yellow-300 font-medium">Leave Balance Exceeded</p>
                          <p className="text-xs text-yellow-400 mt-1">
                            This will result in salary deduction for excess days.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Leave Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Leave Type *
                      </label>
                      <select
                        {...register('leaveType')}
                        className="input-primary w-full"
                      >
                        {Object.values(LEAVE_TYPES).map((type) => (
                          <option key={type} value={type}>
                            {getLeaveTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                      {/* Past Date Notice */}
                      <div className="p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm text-blue-300 font-medium">Past Date Leaves</p>
                            <p className="text-xs text-blue-400 mt-1">
                              You can select past dates if you forgot to log your leave earlier. This is useful for retroactive leave applications.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Start Date *
                          </label>
                          <CustomDatePicker
                            selected={watchedStartDate}
                            onChange={(date) => setValue('startDate', date)}
                            placeholderText="Select start date"
                            className={errors.startDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                          />
                          {errors.startDate && (
                            <p className="mt-1 text-sm text-red-500">{errors.startDate.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            End Date *
                          </label>
                          <CustomDatePicker
                            selected={watchedEndDate}
                            onChange={(date) => setValue('endDate', date)}
                            minDate={watchedStartDate}
                            placeholderText="Select end date"
                            className={errors.endDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                          />
                          {errors.endDate && (
                            <p className="mt-1 text-sm text-red-500">{errors.endDate.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Duration (Days) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('duration', { valueAsNumber: true })}
                          type="number"
                          min="0.5"
                          max="30"
                          step="0.5"
                          className={`input-primary pl-10 w-full ${
                            errors.duration ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Enter duration in days"
                        />
                      </div>
                      {errors.duration && (
                        <p className="mt-1 text-sm text-red-500">{errors.duration.message}</p>
                      )}
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Reason *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                          <FileText className="h-4 w-4 text-gray-400" />
                        </div>
                        <textarea
                          {...register('reason')}
                          rows={3}
                          className={`input-primary pl-10 w-full resize-none ${
                            errors.reason ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Please provide a detailed reason for your leave request..."
                        />
                      </div>
                      {errors.reason && (
                        <p className="mt-1 text-sm text-red-500">{errors.reason.message}</p>
                      )}
                    </div>

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
                          'Submit Application'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LeaveApplicationModal;
