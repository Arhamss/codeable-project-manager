import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Building, Save, Lock, Hash } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import useAuthStore from '../stores/authStore';
import { DEPARTMENTS, getDepartmentLabel } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PasswordChangeModal from '../components/modals/PasswordChangeModal';
import ProfilePictureUpload from '../components/ui/ProfilePictureUpload';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  companyId: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^C\d{3,}$/i.test(val), {
      message: 'Company ID must look like C001 (optional)'
    })
});

const Profile = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { userData, updateProfile, isAdmin } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      department: '',
      companyId: ''
    }
  });

  // Reset form when userData changes
  useEffect(() => {
    if (userData) {
      console.log('Resetting form with userData:', userData);
      console.log('CompanyId value:', userData.companyId);
      reset({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        department: userData.department || '',
        companyId: userData.companyId || ''
      });
    }
  }, [userData, reset]);

  const handleProfilePictureUpdate = async (imageData) => {
    try {
      const updateData = {
        profilePictureUrl: imageData.profilePictureUrl,
        profilePicturePath: imageData.profilePicturePath
      };
      
      const result = await updateProfile(updateData);
      
      if (result.success) {
        // Profile picture update is handled separately, no need to reset form
        console.log('Profile picture updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture');
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsUpdating(true);
      const result = await updateProfile(data);
      
      if (result.success) {
        toast.success('Profile updated successfully!');
        reset(data); // Reset form with new values to clear isDirty
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading spinner if userData is not available yet
  if (!userData) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <ProfilePictureUpload
              currentImageUrl={userData?.profilePictureUrl}
              onImageUpdate={handleProfilePictureUpdate}
              userId={userData?.id}
              userName={userData?.name}
              size="xlarge"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your account information</p>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white">Personal Information</h3>
            <p className="text-gray-400 text-sm">Update your personal details</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name')}
                  type="text"
                  className={`input-primary pl-10 w-full ${
                    errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address * <span className="text-gray-500 text-xs">(Cannot be changed)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  disabled
                  className={`input-primary pl-10 w-full opacity-60 cursor-not-allowed ${
                    errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input-primary pl-10 w-full"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Company ID (Employee ID) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Employee ID {isAdmin() ? <span className="text-gray-500">(Optional)</span> : <span className="text-gray-500 text-xs">(Cannot be changed)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('companyId')}
                  type="text"
                  disabled={!isAdmin()}
                  className={`input-primary pl-10 w-full ${
                    !isAdmin() ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    errors.companyId ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="e.g., C001"
                />
              </div>
              {errors.companyId && (
                <p className="mt-1 text-sm text-red-500">{errors.companyId.message}</p>
              )}
              {!isAdmin() && (
                <p className="text-xs text-gray-500 mt-1">Only administrators can modify employee IDs</p>
              )}
            </div>

            {/* Department Field */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-2">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Building className="h-5 w-5 text-gray-400" />
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

            {/* Submit Button */}
            <div className="pt-4 border-t border-dark-700">
              <motion.button
                type="submit"
                disabled={isUpdating || !isDirty}
                className="btn-primary w-full flex items-center justify-center"
                whileHover={{ scale: isDirty ? 1.02 : 1 }}
                whileTap={{ scale: isDirty ? 0.98 : 1 }}
              >
                {isUpdating ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isDirty ? 'Save Changes' : 'No Changes'}
                  </>
                )}
              </motion.button>
            </div>

            {/* Password Change Button */}
            <div className="pt-4">
              <motion.button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="btn-secondary w-full flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white">Account Information</h3>
            <p className="text-gray-400 text-sm">View your account details</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Role</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                userData?.role === 'admin' 
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'bg-blue-600/20 text-blue-400'
              }`}>
                {userData?.role === 'admin' ? 'Administrator' : 'Team Member'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Account Status</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                userData?.isActive 
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-red-600/20 text-red-400'
              }`}>
                {userData?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white">
                {userData?.createdAt 
                  ? new Date(userData.createdAt).toLocaleDateString()
                  : 'Unknown'
                }
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </DashboardLayout>
  );
};

export default Profile;
