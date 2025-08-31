import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LEAVE_STATUS, LEAVE_TYPES, DEFAULT_LEAVE_ALLOCATION } from '../types';

class LeaveService {
  // Apply for leave
  async applyForLeave(leaveData) {
    try {
      const leaveDoc = {
        ...leaveData,
        status: LEAVE_STATUS.PENDING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'leaves'), leaveDoc);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error applying for leave:', error);
      throw error;
    }
  }

  // Get all leaves (for admin)
  async getAllLeaves() {
    try {
      const q = query(
        collection(db, 'leaves'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all leaves:', error);
      throw error;
    }
  }

  // Get user's leaves
  async getUserLeaves(userId) {
    try {
      const q = query(
        collection(db, 'leaves'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user leaves:', error);
      throw error;
    }
  }

  // Get pending leaves (for admin approval)
  async getPendingLeaves() {
    try {
      const q = query(
        collection(db, 'leaves'),
        where('status', '==', LEAVE_STATUS.PENDING),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting pending leaves:', error);
      throw error;
    }
  }

  // Approve or reject leave
  async updateLeaveStatus(leaveId, status, adminId, adminName, remarks = '') {
    try {
      const leaveRef = doc(db, 'leaves', leaveId);
      await updateDoc(leaveRef, {
        status,
        approvedBy: adminId,
        approvedByName: adminName,
        approvedAt: serverTimestamp(),
        remarks,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating leave status:', error);
      throw error;
    }
  }

  // Cancel leave (user can cancel their own pending leaves)
  async cancelLeave(leaveId, userId) {
    try {
      const leaveRef = doc(db, 'leaves', leaveId);
      const leaveDoc = await getDoc(leaveRef);
      
      if (!leaveDoc.exists()) {
        throw new Error('Leave not found');
      }

      const leaveData = leaveDoc.data();
      if (leaveData.userId !== userId) {
        throw new Error('You can only cancel your own leaves');
      }

      if (leaveData.status !== LEAVE_STATUS.PENDING) {
        throw new Error('You can only cancel pending leaves');
      }

      await updateDoc(leaveRef, {
        status: LEAVE_STATUS.CANCELLED,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling leave:', error);
      throw error;
    }
  }

  // Get user's leave balance
  async getUserLeaveBalance(userId, year = new Date().getFullYear()) {
    try {
      // Get user's leave allocation
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const leaveAllocation = userData.leaveAllocation || DEFAULT_LEAVE_ALLOCATION;

      // Get user's approved leaves for the year
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);

      const q = query(
        collection(db, 'leaves'),
        where('userId', '==', userId),
        where('status', '==', LEAVE_STATUS.APPROVED),
        where('startDate', '>=', startOfYear),
        where('startDate', '<=', endOfYear)
      );
      
      const querySnapshot = await getDocs(q);
      const approvedLeaves = querySnapshot.docs.map(doc => doc.data());

      // Calculate used leaves
      const usedLeaves = {
        [LEAVE_TYPES.SICK]: 0,
        [LEAVE_TYPES.CASUAL]: 0,
        [LEAVE_TYPES.ANNUAL]: 0
      };

      approvedLeaves.forEach(leave => {
        usedLeaves[leave.leaveType] += leave.duration;
      });

      // Calculate remaining leaves
      const remainingLeaves = {
        [LEAVE_TYPES.SICK]: leaveAllocation[LEAVE_TYPES.SICK] - usedLeaves[LEAVE_TYPES.SICK],
        [LEAVE_TYPES.CASUAL]: leaveAllocation[LEAVE_TYPES.CASUAL] - usedLeaves[LEAVE_TYPES.CASUAL],
        [LEAVE_TYPES.ANNUAL]: leaveAllocation[LEAVE_TYPES.ANNUAL] - usedLeaves[LEAVE_TYPES.ANNUAL]
      };

      return {
        allocation: leaveAllocation,
        used: usedLeaves,
        remaining: remainingLeaves
      };
    } catch (error) {
      console.error('Error getting user leave balance:', error);
      throw error;
    }
  }

  // Check if user can apply for leave (has remaining balance)
  async canApplyForLeave(userId, leaveType, duration) {
    try {
      const balance = await this.getUserLeaveBalance(userId);
      return balance.remaining[leaveType] >= duration;
    } catch (error) {
      console.error('Error checking leave eligibility:', error);
      throw error;
    }
  }

  // Calculate salary deduction for excess leaves
  calculateSalaryDeduction(monthlySalary, excessDays, workingDaysInMonth = 22) {
    const dailyRate = monthlySalary / workingDaysInMonth;
    return excessDays * dailyRate;
  }

  // Get leave statistics for admin dashboard
  async getLeaveStatistics() {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31);

      const q = query(
        collection(db, 'leaves'),
        where('startDate', '>=', startOfYear),
        where('startDate', '<=', endOfYear)
      );
      
      const querySnapshot = await getDocs(q);
      const leaves = querySnapshot.docs.map(doc => doc.data());

      const stats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === LEAVE_STATUS.PENDING).length,
        approved: leaves.filter(l => l.status === LEAVE_STATUS.APPROVED).length,
        rejected: leaves.filter(l => l.status === LEAVE_STATUS.REJECTED).length,
        cancelled: leaves.filter(l => l.status === LEAVE_STATUS.CANCELLED).length,
        byType: {
          [LEAVE_TYPES.SICK]: leaves.filter(l => l.leaveType === LEAVE_TYPES.SICK).length,
          [LEAVE_TYPES.CASUAL]: leaves.filter(l => l.leaveType === LEAVE_TYPES.CASUAL).length,
          [LEAVE_TYPES.ANNUAL]: leaves.filter(l => l.leaveType === LEAVE_TYPES.ANNUAL).length
        }
      };

      return stats;
    } catch (error) {
      console.error('Error getting leave statistics:', error);
      throw error;
    }
  }
}

export const leaveService = new LeaveService();
