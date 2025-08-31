import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  Building, 
  Shield,
  AlertTriangle,
  Key
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import { USER_ROLES, DEPARTMENTS, getDepartmentLabel } from '../../types';

const adminUserCreationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm the password'),
  role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]),
  department: z.string().optional(),
  phone: z.string().optional(),
  parentPin: z.string().min(4, 'Parent PIN is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

const AdminUserCreationModal = ({ isOpen, onClose, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showParentPin, setShowParentPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(adminUserCreationSchema),
    defaultValues: {
      role: USER_ROLES.USER,
      department: '',
      phone: ''
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Verify parent PIN (you can store this in environment variables or secure config)
      const validParentPin = import.meta.env.VITE_PARENT_PIN || '1234'; // Default for development
      
      if (data.parentPin !== validParentPin) {
        toast.error('Invalid parent PIN');
        return;
      }

      const { confirmPassword, parentPin, ...userData } = data;
      
      const result = await createUser(data.email, data.password, userData);
      
      if (result.success) {
        toast.success('User account created successfully!');
        reset();
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to create user account');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user account');
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
                      <User className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-white">
                        Create User Account
                      </Dialog.Title>
                      <p className="text-sm text-gray-400">Add a new team member</p>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="mb-6 p-3 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-300 font-medium">Admin Only</p>
                        <p className="text-xs text-blue-400 mt-1">
                          Only administrators can create new user accounts. The user will receive an email to set up their account.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
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
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Temporary Password *
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
                          placeholder="Enter temporary password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`input-primary pl-10 pr-10 w-full ${
                            errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
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
                          className="input-primary pl-10 w-full"
                        >
                          <option value={USER_ROLES.USER}>Team Member</option>
                          <option value={USER_ROLES.ADMIN}>Administrator</option>
                        </select>
                      </div>
                    </div>

                    {/* Department Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          {...register('department')}
                          className="input-primary pl-10 w-full"
                        >
                          <option value="">Select Department</option>
                          {Object.values(DEPARTMENTS).map((dept) => (
                            <option key={dept} value={dept}>
                              {getDepartmentLabel(dept)}
                            </option>
                          ))}
                        </select>
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

                    {/* Parent PIN Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Parent PIN *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('parentPin')}
                          type={showParentPin ? 'text' : 'password'}
                          className={`input-primary pl-10 pr-10 w-full ${
                            errors.parentPin ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Enter parent PIN"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowParentPin(!showParentPin)}
                        >
                          {showParentPin ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                          )}
                        </button>
                      </div>
                      {errors.parentPin && (
                        <p className="mt-1 text-sm text-red-500">{errors.parentPin.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Required to verify admin authorization
                      </p>
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
                          'Create User'
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

export default AdminUserCreationModal;
