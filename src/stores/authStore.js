import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      userData: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      setAuth: (authData) => set({
        user: authData.user,
        userData: authData.userData,
        isAuthenticated: !!authData.user,
        isLoading: false,
        error: null
      }),

      clearAuth: () => set({
        user: null,
        userData: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }),

      // Initialize auth listener
      initAuth: () => {
        set({ isLoading: true });
        
        // Add timeout for auth initialization
        const authTimeout = setTimeout(() => {
          console.warn('Auth initialization timed out');
          set({
            user: null,
            userData: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Authentication timeout. Please refresh the page.'
          });
        }, 15000); // 15 second timeout
        
        const unsubscribe = authService.initAuthListener(({ user, userData }) => {
          clearTimeout(authTimeout); // Clear timeout when auth resolves
          
          if (user && userData) {
            console.log('Auth state: User authenticated');
            set({
              user,
              userData,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            console.log('Auth state: User not authenticated');
            set({
              user: null,
              userData: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          }
        });
        
        // Return cleanup function that clears both timeout and unsubscribe
        return () => {
          clearTimeout(authTimeout);
          if (unsubscribe) unsubscribe();
        };
      },

      // Login action
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const { user, userData } = await authService.login(email, password);
          set({
            user,
            userData,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      // Register action
      register: async (email, password, userData) => {
        try {
          set({ isLoading: true, error: null });
          
          // Add timeout to registration
          const registerPromise = authService.register(email, password, userData);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Registration timed out. Please try again.')), 20000)
          );
          
          const result = await Promise.race([registerPromise, timeoutPromise]);
          
          set({
            user: result.user,
            userData: result.userData,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return { success: true };
        } catch (error) {
          console.error('Registration failed:', error);
          set({
            isLoading: false,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      // Logout action
      logout: async () => {
        try {
          set({ isLoading: true });
          await authService.logout();
          set({
            user: null,
            userData: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
        }
      },

      // Reset password action
      resetPassword: async (email) => {
        try {
          set({ isLoading: true, error: null });
          await authService.resetPassword(email);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      // Update profile action
      updateProfile: async (updateData) => {
        try {
          const { userData: currentUserData } = get();
          if (!currentUserData) throw new Error('No user data found');

          set({ isLoading: true, error: null });
          const updatedUserData = await authService.updateUserProfile(currentUserData.id, updateData);
          set({
            userData: updatedUserData,
            isLoading: false
          });
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      // Change password action
      changePassword: async (currentPassword, newPassword) => {
        try {
          set({ isLoading: true, error: null });
          await authService.changePassword(currentPassword, newPassword);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      // Create user action (admin only)
      createUser: async (email, password, userData) => {
        try {
          const { userData: currentUserData } = get();
          if (!currentUserData || currentUserData.role !== 'admin') {
            throw new Error('Only administrators can create user accounts');
          }

          set({ isLoading: true, error: null });
          const result = await authService.createUser(email, password, userData);
          set({ isLoading: false });
          return { success: true, user: result };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      // Helper getters
      isAdmin: () => {
        const { userData } = get();
        return userData?.role === 'admin';
      },

      getCurrentUser: () => {
        const { user, userData } = get();
        return { user, userData };
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        userData: state.userData,
        isAuthenticated: state.isAuthenticated
      }),
      // Improve session storage options
      storage: {
        getItem: (name) => {
          try {
            const item = localStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error writing to localStorage:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing from localStorage:', error);
          }
        }
      }
    }
  )
);

export default useAuthStore;
