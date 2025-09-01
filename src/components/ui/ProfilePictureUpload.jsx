import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, User } from 'lucide-react';
import { profileService } from '../../services/profileService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const ProfilePictureUpload = ({ 
  currentImageUrl, 
  onImageUpdate, 
  userId, 
  userName,
  size = 'large',
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef(null);

  const sizes = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-24 h-24',
    xlarge: 'w-32 h-32'
  };

  const iconSizes = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10',
    xlarge: 'w-12 h-12'
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files[0]) return;

    const file = fileInputRef.current.files[0];
    
    try {
      setIsUploading(true);
      
      const result = await profileService.uploadProfilePicture(file, userId);
      
      if (result.success) {
        // Call the parent callback with new image data
        onImageUpdate({
          profilePictureUrl: result.fileUrl,
          profilePicturePath: result.storagePath
        });
        
        setPreviewUrl(null);
        toast.success('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      // Call the parent callback to remove the image
      onImageUpdate({
        profilePictureUrl: null,
        profilePicturePath: null
      });
      
      setPreviewUrl(null);
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast.error('Failed to remove profile picture');
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayUrl = previewUrl || currentImageUrl;
  const showInitials = !displayUrl;

  return (
    <div className={`relative ${className}`}>
      {/* Profile Picture Container */}
      <motion.div
        className={`${sizes[size]} relative rounded-full overflow-hidden cursor-pointer border-2 border-dark-700 hover:border-primary-500 transition-colors duration-200`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Image or Initials */}
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={`${userName}'s profile picture`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && !isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Camera className={`${iconSizes[size]} text-white`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <LoadingSpinner size="sm" color="white" />
          </div>
        )}
      </motion.div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview Actions */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2"
          >
            {/* Upload Button */}
            <motion.button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isUploading ? (
                <LoadingSpinner size="xs" color="white" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </motion.button>

            {/* Cancel Button */}
            <motion.button
              onClick={() => setPreviewUrl(null)}
              disabled={isUploading}
              className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Button (only show when there's a current image and no preview) */}
      {currentImageUrl && !previewUrl && (
        <motion.button
          onClick={handleRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-3 h-3" />
        </motion.button>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
