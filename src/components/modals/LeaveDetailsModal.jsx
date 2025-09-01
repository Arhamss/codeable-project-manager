import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Clock, 
  FileText, 
  CheckCircle,
  X,
  AlertTriangle,
  MessageSquare,
  CalendarDays,
  UserCheck,
  UserX
} from 'lucide-react';
import { 
  LEAVE_STATUS, 
  LEAVE_TYPES,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  getLeaveStatusColor
} from '../../types';
import { formatDateWithOrdinal, formatTableDate } from '../../utils/dateUtils';

const LeaveDetailsModal = ({ isOpen, onClose, leave }) => {
  if (!leave) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case LEAVE_STATUS.PENDING:
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case LEAVE_STATUS.APPROVED:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case LEAVE_STATUS.REJECTED:
        return <X className="w-5 h-5 text-red-400" />;
      case LEAVE_STATUS.CANCELLED:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case LEAVE_STATUS.PENDING:
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case LEAVE_STATUS.APPROVED:
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case LEAVE_STATUS.REJECTED:
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case LEAVE_STATUS.CANCELLED:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-dark-800 border border-dark-700 shadow-xl transition-all">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-600/20 rounded-lg">
                        <Calendar className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-white">
                          Leave Details
                        </Dialog.Title>
                        <p className="text-sm text-gray-400">Complete information about this leave application</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusColor(leave.status)}`}>
                      {getStatusIcon(leave.status)}
                      <span className="font-medium">{getLeaveStatusLabel(leave.status)}</span>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Employee Information */}
                      <div className="p-4 bg-dark-700 rounded-lg border border-dark-600">
                        <div className="flex items-center space-x-3 mb-3">
                          <User className="w-4 h-4 text-primary-400" />
                          <h3 className="text-sm font-medium text-white">Employee Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Name:</span>
                            <span className="text-sm text-white font-medium">{leave.userName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Company ID:</span>
                            <span className="text-sm text-white font-medium font-mono">{leave.companyId || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Leave Type */}
                      <div className="p-4 bg-dark-700 rounded-lg border border-dark-600">
                        <div className="flex items-center space-x-3 mb-3">
                          <CalendarDays className="w-4 h-4 text-primary-400" />
                          <h3 className="text-sm font-medium text-white">Leave Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Type:</span>
                            <span className="text-sm text-white font-medium">{getLeaveTypeLabel(leave.leaveType)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Duration:</span>
                            <span className="text-sm text-white font-medium">{leave.duration} days</span>
                          </div>
                        </div>
                      </div>

                      {/* Date Information */}
                      <div className="p-4 bg-dark-700 rounded-lg border border-dark-600">
                        <div className="flex items-center space-x-3 mb-3">
                          <Clock className="w-4 h-4 text-primary-400" />
                          <h3 className="text-sm font-medium text-white">Date Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Start Date:</span>
                            <span className="text-sm text-white font-medium">{formatDateWithOrdinal(leave.startDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">End Date:</span>
                            <span className="text-sm text-white font-medium">{formatDateWithOrdinal(leave.endDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Applied On:</span>
                            <span className="text-sm text-white font-medium">{formatTableDate(leave.createdAt)}</span>
                          </div>
                          {leave.updatedAt && leave.status !== LEAVE_STATUS.PENDING && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Processed On:</span>
                              <span className="text-sm text-white font-medium">{formatTableDate(leave.updatedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Reason */}
                      <div className="p-4 bg-dark-700 rounded-lg border border-dark-600">
                        <div className="flex items-center space-x-3 mb-3">
                          <FileText className="w-4 h-4 text-primary-400" />
                          <h3 className="text-sm font-medium text-white">Reason for Leave</h3>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {leave.reason || 'No reason provided'}
                        </p>
                      </div>

                      {/* Admin Decision */}
                      {(leave.status === LEAVE_STATUS.APPROVED || leave.status === LEAVE_STATUS.REJECTED) && (
                        <div className="p-4 bg-dark-700 rounded-lg border border-dark-600">
                          <div className="flex items-center space-x-3 mb-3">
                            {leave.status === LEAVE_STATUS.APPROVED ? (
                              <UserCheck className="w-4 h-4 text-green-400" />
                            ) : (
                              <UserX className="w-4 h-4 text-red-400" />
                            )}
                            <h3 className="text-sm font-medium text-white">
                              {leave.status === LEAVE_STATUS.APPROVED ? 'Approval Details' : 'Rejection Details'}
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {leave.adminName && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-400">Processed By:</span>
                                <span className="text-sm text-white font-medium">{leave.adminName}</span>
                              </div>
                            )}
                            {leave.remarks && (
                              <div>
                                <span className="text-sm text-gray-400 block mb-2">Admin Remarks:</span>
                                <div className="p-3 bg-dark-600 rounded-lg border-l-4 border-primary-500">
                                  <p className="text-sm text-gray-300 leading-relaxed">
                                    {leave.remarks}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Additional Information */}
                      <div className="p-4 bg-dark-700 rounded-lg border border-dark-600">
                        <div className="flex items-center space-x-3 mb-3">
                          <MessageSquare className="w-4 h-4 text-primary-400" />
                          <h3 className="text-sm font-medium text-white">Additional Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Application ID:</span>
                            <span className="text-sm text-white font-mono">{leave.id}</span>
                          </div>
                          {leave.status === LEAVE_STATUS.CANCELLED && (
                            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                              <p className="text-sm text-yellow-400">
                                This leave application was cancelled by the employee.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-dark-700">
                    <button
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LeaveDetailsModal;
