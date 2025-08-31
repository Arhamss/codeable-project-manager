import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, Mail, Phone, Building, DollarSign, Shield, Lock } from 'lucide-react';
import { USER_ROLES, USER_POSITIONS, getUserPositionLabel } from '../../types';
import { userService } from '../../services/userService';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(Object.values(USER_ROLES)),
  position: z.enum(Object.values(USER_POSITIONS)).optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be non-negative').optional(),
  monthlySalary: z.number().min(0, 'Monthly salary must be non-negative').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  isActive: z.boolean().optional()
}).refine((data) => {
  // Password is required for new users, optional for editing
  return true; // We'll handle this in the component
}, {
  message: "Password is required for new users",
  path: ['password']
});

const UserModal = ({ isOpen, onClose, onSuccess, user = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: USER_ROLES.USER,
      department: '',
      phone: '',
      hourlyRate: 0,
      password: '',
      isActive: true
    }
  });

  useEffect(() => {
    if (user) {
      // Set form values when editing
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('role', user.role || USER_ROLES.USER);
      setValue('department', user.department || '');
      setValue('phone', user.phone || '');
      setValue('hourlyRate', user.hourlyRate || 0);
      setValue('isActive', user.isActive !== false);
    } else {
      reset();
    }
  }, [user, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Validate password for new users
      if (!isEditing && (!data.password || data.password.length < 6)) {
        toast.error('Password is required for new users and must be at least 6 characters');
        return;
      }

      // Clean up data
      const userData = {
        ...data,
        hourlyRate: parseFloat(data.hourlyRate) || 0
      };

      if (isEditing) {
        // Remove password from update data if not provided
        if (!userData.password) {
          delete userData.password;
        }
        await userService.updateUser(user.id, userData);
      } else {
        await userService.createUser(userData);
      }
      
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email address is already in use');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else {
        toast.error(`Failed to ${isEditing ? 'update' : 'create'} user`);
      }
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                  <Dialog.Title className="text-lg font-semibold text-white flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary-400" />
                    {isEditing ? 'Edit User' : 'Add New User'}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...register('name')}
                        type="text"
                        className={`input-primary pl-10 w-full ${
                          errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        placeholder="Enter full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...register('email')}
                        type="email"
                        className={`input-primary pl-10 w-full ${
                          errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        placeholder="Enter email address"
                        disabled={isEditing} // Don't allow email changes when editing
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                    {isEditing && (
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed after creation</p>
                    )}
                  </div>

                  {/* Role Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        {...register('role')}
                        className={`input-primary pl-10 w-full ${
                          errors.role ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                      >
                        <option value={USER_ROLES.USER}>Team Member</option>
                        <option value={USER_ROLES.ADMIN}>Administrator</option>
                      </select>
                    </div>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
                    )}
                  </div>

                  {/* Position Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Position
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        {...register('position')}
                        className="input-primary pl-10 w-full"
                      >
                        <option value="">Select Position</option>
                        {Object.values(USER_POSITIONS).map((position) => (
                          <option key={position} value={position}>
                            {getUserPositionLabel(position)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.position && (
                      <p className="mt-1 text-sm text-red-500">{errors.position.message}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password {isEditing ? '(Leave empty to keep current)' : '*'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className={`input-primary pl-10 pr-10 w-full ${
                          errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        placeholder={isEditing ? 'Leave empty to keep current password' : 'Enter password'}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️‍🗨️' : '👁️'}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Department Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('department')}
                          type="text"
                          className="input-primary pl-10 w-full"
                          placeholder="e.g., Development"
                        />
                      </div>
                    </div>

                    {/* Hourly Rate Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Hourly Rate
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
                          className="input-primary pl-10 w-full"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="input-primary pl-10 w-full"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  {/* Active Status (only for editing) */}
                  {isEditing && (
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          {...register('isActive')}
                          type="checkbox"
                          className="w-4 h-4 text-primary-600 border-dark-700 rounded focus:ring-primary-500 focus:ring-offset-dark-900"
                        />
                        <span className="text-sm text-gray-300">Active User</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Inactive users cannot log in to the system
                      </p>
                    </div>
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
                        isEditing ? 'Update User' : 'Create User'
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

export default UserModal;
