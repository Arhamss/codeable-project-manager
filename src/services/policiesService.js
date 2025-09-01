import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

class PoliciesService {
  constructor() {
    this.policiesCollection = collection(db, 'policies');
  }

  // Get all policies
  async getAllPolicies() {
    try {
      const querySnapshot = await getDocs(this.policiesCollection);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));
    } catch (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }
  }

  // Add new policy
  async addPolicy(policyData) {
    try {
      const docData = {
        ...policyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const docRef = await addDoc(this.policiesCollection, docData);
      return { id: docRef.id, ...docData };
    } catch (error) {
      console.error('Error adding policy:', error);
      throw error;
    }
  }

  // Update policy
  async updatePolicy(policyId, updateData) {
    try {
      const policyRef = doc(db, 'policies', policyId);
      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(policyRef, dataToUpdate);
      return { id: policyId, ...dataToUpdate };
    } catch (error) {
      console.error('Error updating policy:', error);
      throw error;
    }
  }

  // Delete policy
  async deletePolicy(policyId) {
    try {
      // First get the policy to get the storage path
      const policyDoc = await getDoc(doc(db, 'policies', policyId));
      
      if (policyDoc.exists()) {
        const policyData = policyDoc.data();
        
        // Delete the file from storage if it exists
        if (policyData.storagePath) {
          try {
            const fileRef = ref(storage, policyData.storagePath);
            await deleteObject(fileRef);
          } catch (storageError) {
            console.warn('Could not delete file from storage:', storageError);
            // Continue with policy deletion even if file deletion fails
          }
        }
        
        // Delete the policy document
        await deleteDoc(doc(db, 'policies', policyId));
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw error;
    }
  }

  // Get policy by ID
  async getPolicyById(policyId) {
    try {
      const policyDoc = await getDoc(doc(db, 'policies', policyId));
      
      if (policyDoc.exists()) {
        const data = policyDoc.data();
        return {
          id: policyDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching policy:', error);
      throw error;
    }
  }
}

export const policiesService = new PoliciesService();
export default policiesService;
