import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

class ProfileService {
  constructor() {
    this.storageRef = 'profile-pictures';
  }

  // Upload profile picture
  async uploadProfilePicture(file, userId) {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}-${timestamp}.${fileExtension}`;
      const storagePath = `${this.storageRef}/${fileName}`;
      
      // Create storage reference
      const storageRef = ref(storage, storagePath);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        fileUrl: downloadURL,
        storagePath,
        fileName
      };
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  // Delete profile picture
  async deleteProfilePicture(storagePath) {
    try {
      if (!storagePath) return { success: true };
      
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      // Don't throw error for deletion failures
      return { success: false, error: error.message };
    }
  }

  // Get profile picture URL (with fallback)
  getProfilePictureUrl(userData) {
    if (userData?.profilePictureUrl) {
      return userData.profilePictureUrl;
    }
    
    // Return null for fallback to initials
    return null;
  }
}

export const profileService = new ProfileService();
export default profileService;
