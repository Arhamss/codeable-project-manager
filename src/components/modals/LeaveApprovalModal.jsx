import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Clock, 
  FileText, 
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { leaveService } from '../../services/leaveService';
import useAuthStore from '../../stores/authStore';
import { 
  LEAVE_STATUS, 
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  getLeaveStatusColor
} from '../../types';
import { formatDateWithOrdinal } from '../../utils/dateUtils';

const leaveApprovalSchema = z.object({
  status: z.enum([LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED]),
  remarks: z.string().min(1, 'Remarks are required').max(500, 'Remarks cannot exceed 500 characters')
});

const LeaveApprovalModal = ({ isOpen, onClose, onSuccess, leave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(leaveApprovalSchema),
    defaultValues: {
      status: LEAVE_STATUS.APPROVED,
      remarks: ''
    }
  });

  const watchedStatus = watch('status');

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      await leaveService.updateLeaveStatus(
        leave.id,
        data.status,
        userData.id,
        userData.name,
        data.remarks
      );

      const statusText = getLeaveStatusLabel(data.status);
      toast.success(`Leave application ${statusText.toLowerCase()} successfully!`);
      
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating leave status:', error);
      toast.error('Failed to update leave status');
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

  if (!leave) return null;



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
                        Review Leave Application
                      </Dialog.Title>
                      <p className="text-sm text-gray-400">Approve or reject the leave request</p>
                    </div>
                  </div>

                  {/* Leave Details */}
                  <div className="mb-6 space-y-4">
                    {/* Employee Info */}
                    <div className="p-4 bg-dark-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {leave.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{leave.userName}</p>
                          <p className="text-sm text-gray-400">Employee</p>
                        </div>
                      </div>
                    </div>

                    {/* Leave Type and Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-dark-700 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Leave Type</p>
                        <p className="text-white font-medium">
                          {getLeaveTypeLabel(leave.leaveType)}
                        </p>
                      </div>
                      <div className="p-3 bg-dark-700 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Current Status</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeaveStatusColor(leave.status)}`}>
                          {getLeaveStatusLabel(leave.status)}
                        </span>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="p-4 bg-dark-700 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-white">Leave Period</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">From:</span>
                          <span className="text-sm text-white">{formatDateWithOrdinal(leave.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">To:</span>
                          <span className="text-sm text-white">{formatDateWithOrdinal(leave.endDate)}</span>
                        </div>
                        <div className="flex justify-between border-t border-dark-600 pt-2">
                          <span className="text-sm text-gray-400">Duration:</span>
                          <span className="text-sm font-medium text-white">{leave.duration} days</span>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="p-4 bg-dark-700 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-white">Reason</p>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {leave.reason}
                      </p>
                    </div>

                    {/* Application Date */}
                    <div className="p-3 bg-dark-700 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Applied On</p>
                      <p className="text-sm text-white">
                        {formatDateWithOrdinal(leave.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Approval Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Status Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Decision *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="relative">
                          <input
                            {...register('status')}
                            type="radio"
                            value={LEAVE_STATUS.APPROVED}
                            className="sr-only"
                          />
                          <div className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            watchedStatus === LEAVE_STATUS.APPROVED
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className={`w-4 h-4 ${
                                watchedStatus === LEAVE_STATUS.APPROVED ? 'text-green-400' : 'text-gray-400'
                              }`} />
                              <span className={`text-sm font-medium ${
                                watchedStatus === LEAVE_STATUS.APPROVED ? 'text-green-400' : 'text-gray-300'
                              }`}>
                                Approve
                              </span>
                            </div>
                          </div>
                        </label>

                        <label className="relative">
                          <input
                            {...register('status')}
                            type="radio"
                            value={LEAVE_STATUS.REJECTED}
                            className="sr-only"
                          />
                          <div className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            watchedStatus === LEAVE_STATUS.REJECTED
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <X className={`w-4 h-4 ${
                                watchedStatus === LEAVE_STATUS.REJECTED ? 'text-red-400' : 'text-gray-400'
                              }`} />
                              <span className={`text-sm font-medium ${
                                watchedStatus === LEAVE_STATUS.REJECTED ? 'text-red-400' : 'text-gray-300'
                              }`}>
                                Reject
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Remarks *
                      </label>
                      <textarea
                        {...register('remarks')}
                        rows={3}
                        className={`input-primary w-full resize-none ${
                          errors.remarks ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        placeholder={`Enter your ${watchedStatus === LEAVE_STATUS.APPROVED ? 'approval' : 'rejection'} remarks...`}
                      />
                      {errors.remarks && (
                        <p className="mt-1 text-sm text-red-500">{errors.remarks.message}</p>
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
                        className={`flex-1 flex items-center justify-center ${
                          watchedStatus === LEAVE_STATUS.APPROVED
                            ? 'btn-success'
                            : 'btn-danger'
                        }`}
                      >
                        {isSubmitting ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : (
                          <>
                            {watchedStatus === LEAVE_STATUS.APPROVED ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Leave
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Reject Leave
                              </>
                            )}
                          </>
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

export default LeaveApprovalModal;
