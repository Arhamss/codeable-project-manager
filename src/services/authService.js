import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { USER_ROLES } from '../types';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userData = null;
  }

  // Initialize auth state listener
  initAuthListener(callback) {
    try {
      return onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            this.currentUser = user;
            this.userData = await this.getUserData(user.uid);
            callback({ user, userData: this.userData });
          } else {
            this.currentUser = null;
            this.userData = null;
            callback({ user: null, userData: null });
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          // Still call callback with null values to continue app flow
          this.currentUser = null;
          this.userData = null;
          callback({ user: null, userData: null });
        }
      });
    } catch (error) {
      console.error('Auth listener initialization error:', error);
      // Return a no-op function and call callback immediately with null values
      setTimeout(() => callback({ user: null, userData: null }), 100);
      return () => {};
    }
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      console.log('Fetching user data for:', uid);
      
      // Add timeout to Firestore read operation
      const firestorePromise = getDoc(doc(db, 'users', uid));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore read timed out')), 8000)
      );
      
      const userDoc = await Promise.race([firestorePromise, timeoutPromise]);
      
      if (userDoc.exists()) {
        console.log('User data fetched successfully');
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      console.warn('User document does not exist in Firestore');
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // If Firestore fails, try to get basic info from Firebase Auth
      const authUser = auth.currentUser;
      if (authUser) {
        console.warn('Using Firebase Auth data as fallback');
        return {
          id: authUser.uid,
          email: authUser.email || 'No email',
          name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          phone: '',
          department: ''
        };
      }
      
      // Last resort fallback
      console.error('No user data available from Auth or Firestore');
      return null;
    }
  }

  // Register new user
  async register(email, password, userData) {
    try {
      console.log('Starting registration process...');
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created in Auth:', user.uid);
      
      // Update display name
      if (userData.name) {
        await updateProfile(user, { displayName: userData.name });
        console.log('Display name updated');
      }

      // Create user document in Firestore with timeout
      const userDocData = {
        email: user.email,
        name: userData.name || '',
        role: userData.role || USER_ROLES.USER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        profilePicture: null,
        phone: userData.phone || '',
        department: userData.department || '',
        hourlyRate: userData.hourlyRate || 0
      };

      console.log('Creating Firestore document...', {
        collection: 'users',
        docId: user.uid,
        data: userDocData
      });
      
      // Add timeout to Firestore operation
      const firestorePromise = setDoc(doc(db, 'users', user.uid), userDocData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore operation timed out')), 10000)
      );
      
      try {
        await Promise.race([firestorePromise, timeoutPromise]);
        console.log('✅ Firestore document created successfully for user:', user.uid);
      } catch (firestoreError) {
        console.error('❌ Firestore error details:', {
          error: firestoreError,
          message: firestoreError.message,
          code: firestoreError.code
        });
        // Continue with minimal user data if Firestore fails
        userDocData.id = user.uid;
        throw new Error(`Failed to save user data: ${firestoreError.message}`);
      }
      
      this.userData = { id: user.uid, ...userDocData };
      return { user, userData: this.userData };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      this.userData = await this.getUserData(user.uid);
      
      // Check if user is active
      if (!this.userData?.isActive) {
        await this.logout();
        throw new Error('Your account has been deactivated. Please contact an administrator.');
      }

      return { user, userData: this.userData };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.userData = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const userRef = doc(db, 'users', userId);
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, dataToUpdate);
      
      // Update local userData
      if (this.userData && this.userData.id === userId) {
        this.userData = { ...this.userData, ...dataToUpdate };
      }
      
      return this.userData;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Check if current user is admin
  isAdmin() {
    return this.userData?.role === USER_ROLES.ADMIN;
  }

  // Check if current user is authenticated
  isAuthenticated() {
    return !!this.currentUser && !!this.userData;
  }

  // Get current user info
  getCurrentUser() {
    return {
      user: this.currentUser,
      userData: this.userData
    };
  }
}

export const authService = new AuthService();
export default authService;
