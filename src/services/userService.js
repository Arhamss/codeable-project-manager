import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { USER_ROLES } from '../types';

class UserService {
  constructor() {
    this.usersCollection = collection(db, 'users');
  }

  // Create new user (Admin only)
  async createUser(userData) {
    try {
      // Create auth user
      const { user } = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Update display name
      if (userData.name) {
        await updateProfile(user, { displayName: userData.name });
      }

      // Create user document in Firestore
      const userDocData = {
        email: user.email,
        name: userData.name || '',
        role: userData.role || USER_ROLES.USER,
        position: userData.position || '',
        department: userData.department || '',
        phone: userData.phone || '',
        hourlyRate: userData.hourlyRate || 0,
        monthlySalary: userData.monthlySalary || 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: null,
        profilePicture: null
      };

      // Use the auth user's UID as the document ID
      await setDoc(doc(db, 'users', user.uid), userDocData);
      
      return { id: user.uid, ...userDocData };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const q = query(
        this.usersCollection,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        lastLoginAt: doc.data().lastLoginAt?.toDate?.() || doc.data().lastLoginAt
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get users (alias for getAllUsers for consistency)
  async getUsers() {
    return this.getAllUsers();
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          lastLoginAt: data.lastLoginAt?.toDate?.() || data.lastLoginAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId, updateData) {
    try {
      const userRef = doc(db, 'users', userId);
      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, dataToUpdate);
      return { id: userId, ...dataToUpdate };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user status (activate/deactivate)
  async updateUserStatus(userId, isActive) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Delete user (soft delete by deactivating)
  async deleteUser(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      const q = query(
        this.usersCollection,
        where('role', '==', role),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  // Get active users
  async getActiveUsers() {
    try {
      const q = query(
        this.usersCollection,
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error;
    }
  }

  // Update last login time
  async updateLastLogin(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Listen to users in real-time
  subscribeToUsers(callback) {
    const q = query(
      this.usersCollection,
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        lastLoginAt: doc.data().lastLoginAt?.toDate?.() || doc.data().lastLoginAt
      }));
      callback(users);
    }, (error) => {
      console.error('Error listening to users:', error);
      callback([]);
    });
  }

  // Get user analytics
  async getUserAnalytics(userId) {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      // Get user's time logs (you'll need to import projectService)
      const { projectService } = await import('./projectService');
      const timeLogs = await projectService.getUserTimeLogs(userId);
      
      // Calculate analytics
      const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
      const projectsWorkedOn = new Set(timeLogs.map(log => log.projectId)).size;
      
      // This week's hours
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeekHours = timeLogs
        .filter(log => new Date(log.date) >= weekAgo)
        .reduce((sum, log) => sum + log.hours, 0);
      
      // This month's hours
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const thisMonthHours = timeLogs
        .filter(log => new Date(log.date) >= monthAgo)
        .reduce((sum, log) => sum + log.hours, 0);

      // Hours by work type
      const hoursByWorkType = timeLogs.reduce((acc, log) => {
        acc[log.workType] = (acc[log.workType] || 0) + log.hours;
        return acc;
      }, {});

      return {
        user,
        totalHours,
        thisWeekHours,
        thisMonthHours,
        projectsWorkedOn,
        totalLogs: timeLogs.length,
        hoursByWorkType,
        recentLogs: timeLogs.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Get team analytics
  async getTeamAnalytics() {
    try {
      const users = await this.getAllUsers();
      const activeUsers = users.filter(u => u.isActive);
      
      const analytics = {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        adminUsers: users.filter(u => u.role === USER_ROLES.ADMIN).length,
        teamMembers: users.filter(u => u.role === USER_ROLES.USER).length,
        departments: {},
        recentUsers: users.slice(0, 5)
      };

      // Group by department
      users.forEach(user => {
        if (user.department) {
          analytics.departments[user.department] = (analytics.departments[user.department] || 0) + 1;
        }
      });

      return analytics;
    } catch (error) {
      console.error('Error getting team analytics:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
