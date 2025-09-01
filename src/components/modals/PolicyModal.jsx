import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, FileText, Upload, AlertCircle } from 'lucide-react';
import { policiesService } from '../../services/policiesService';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const policySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['employment', 'leave', 'remote-work', 'equipment', 'compensation', 'other'], {
    required_error: 'Please select a category'
  }),
  isActive: z.boolean().default(true)
});

const PolicyModal = ({ isOpen, onClose, onSuccess, editingPolicy = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const { userData } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(policySchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'employment',
      isActive: true
    }
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (editingPolicy) {
      setValue('title', editingPolicy.title);
      setValue('description', editingPolicy.description);
      setValue('category', editingPolicy.category);
      setValue('isActive', editingPolicy.isActive);
      setSelectedFile(null);
    } else {
      reset();
      setSelectedFile(null);
    }
    setFileError('');
  }, [editingPolicy, setValue, reset]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setFileError('Only PDF files are allowed');
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File size must be less than 10MB');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setFileError('');
    }
  };

  const onSubmit = async (data) => {
    // For new policies, require file upload
    if (!editingPolicy && !selectedFile) {
      setFileError('Please select a PDF file');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingPolicy) {
        // Update existing policy
        const updateData = { ...data };
        
        // If a new file is selected, handle file upload
        if (selectedFile) {
          // TODO: Implement file upload to storage service
          // For now, we'll just update the metadata
          updateData.fileName = selectedFile.name;
          updateData.fileSize = selectedFile.size;
          updateData.updatedBy = userData.id;
        }

        await policiesService.updatePolicy(editingPolicy.id, updateData);
      } else {
        // Create new policy
        const policyData = {
          ...data,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          uploadedBy: userData.id,
          // TODO: fileUrl will be set after file upload to storage
          fileUrl: '', // This should be set after successful file upload
        };

        await policiesService.addPolicy(policyData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error('Failed to save policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSelectedFile(null);
      setFileError('');
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-dark-900 border border-dark-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-white flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-primary-400" />
                    {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
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
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Policy Title *
                    </label>
                    <input
                      {...register('title')}
                      type="text"
                      className={`input-primary w-full ${
                        errors.title ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="Enter policy title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className={`input-primary w-full resize-none ${
                        errors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="Describe the policy content and purpose..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      {...register('category')}
                      className={`input-primary w-full ${
                        errors.category ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                    >
                      <option value="employment">Employment</option>
                      <option value="leave">Leave & Time Off</option>
                      <option value="remote-work">Remote Work</option>
                      <option value="equipment">Equipment & IT</option>
                      <option value="compensation">Compensation</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
                    )}
                  </div>

                  {/* File Upload (only for new policies) */}
                  {!editingPolicy && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Policy Document (PDF) *
                      </label>
                      <div className="border-2 border-dashed border-dark-700 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="policy-file"
                        />
                        <label
                          htmlFor="policy-file"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-gray-400">
                            {selectedFile ? selectedFile.name : 'Click to upload PDF file'}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            Max size: 10MB
                          </span>
                        </label>
                      </div>
                      {fileError && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {fileError}
                        </p>
                      )}
                      {selectedFile && (
                        <p className="mt-2 text-sm text-green-400">
                          ✓ {selectedFile.name} selected
                        </p>
                      )}
                    </div>
                  )}

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      {...register('isActive')}
                      type="checkbox"
                      id="isActive"
                      className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
                      Policy is active and visible to users
                    </label>
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
                        editingPolicy ? 'Update Policy' : 'Add Policy'
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

export default PolicyModal;
