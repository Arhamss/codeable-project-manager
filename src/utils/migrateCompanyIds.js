// Migration script to add company IDs to existing users
// Run this script once to update existing users with company IDs

import { collection, getDocs, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const migrateCompanyIds = async () => {
  try {
    console.log('Starting company ID migration...');
    
    // Get all users without company IDs
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('companyId', '==', null),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const usersWithoutCompanyId = querySnapshot.docs;
    
    if (usersWithoutCompanyId.length === 0) {
      console.log('No users found without company IDs');
      return;
    }
    
    console.log(`Found ${usersWithoutCompanyId.length} users without company IDs`);
    
    // Get the highest existing company ID
    const allUsersQuery = query(usersRef, orderBy('companyId', 'desc'));
    const allUsersSnapshot = await getDocs(allUsersQuery);
    const existingIds = allUsersSnapshot.docs
      .map(doc => doc.data().companyId)
      .filter(id => id && id.startsWith('C'));
    
    let nextNumber = 1;
    if (existingIds.length > 0) {
      const numbers = existingIds
        .map(id => parseInt(id.replace('C', '')))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a);
      nextNumber = (numbers[0] || 0) + 1;
    }
    
    // Update each user with a company ID
    for (const userDoc of usersWithoutCompanyId) {
      const companyId = `C${nextNumber.toString().padStart(3, '0')}`;
      
      await updateDoc(doc(db, 'users', userDoc.id), {
        companyId: companyId,
        updatedAt: new Date()
      });
      
      console.log(`Updated user ${userDoc.data().name} with company ID: ${companyId}`);
      nextNumber++;
    }
    
    console.log('Company ID migration completed successfully!');
  } catch (error) {
    console.error('Error during company ID migration:', error);
    throw error;
  }
};

// Function to generate company ID for a single user (for testing)
export const generateCompanyIdForUser = async (userId) => {
  try {
    // Get the highest existing company ID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('companyId', 'desc'));
    const querySnapshot = await getDocs(q);
    const existingIds = querySnapshot.docs
      .map(doc => doc.data().companyId)
      .filter(id => id && id.startsWith('C'));
    
    let nextNumber = 1;
    if (existingIds.length > 0) {
      const numbers = existingIds
        .map(id => parseInt(id.replace('C', '')))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a);
      nextNumber = (numbers[0] || 0) + 1;
    }
    
    const companyId = `C${nextNumber.toString().padStart(3, '0')}`;
    
    await updateDoc(doc(db, 'users', userId), {
      companyId: companyId,
      updatedAt: new Date()
    });
    
    console.log(`Generated company ID ${companyId} for user ${userId}`);
    return companyId;
  } catch (error) {
    console.error('Error generating company ID:', error);
    throw error;
  }
};
