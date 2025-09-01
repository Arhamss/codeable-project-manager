// Migration script to upload existing PDF files to Firebase Storage
// and populate the policies collection with proper Firebase URLs

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { policiesService } from '../services/policiesService';

const existingPolicies = [
  {
    title: 'Remote Work Policy & Guidelines',
    description: 'Comprehensive guidelines for remote work arrangements, including expectations, communication protocols, and best practices for maintaining productivity while working remotely.',
    category: 'remote-work',
    fileName: 'Remote Work Policy & Guidelines.pdf',
    localPath: '/assets/policies/Remote Work Policy & Guidelines.pdf',
    isActive: true
  },
  {
    title: 'Leave Policy',
    description: 'Complete leave management policy covering sick leave, casual leave, annual leave, and other time-off arrangements with detailed procedures and requirements.',
    category: 'leave',
    fileName: 'Leave Policy.pdf',
    localPath: '/assets/policies/Leave Policy.pdf',
    isActive: true
  },
  {
    title: 'Laptop Policy',
    description: 'Equipment and IT policy for company-issued laptops, including usage guidelines, security requirements, and maintenance procedures.',
    category: 'equipment',
    fileName: 'Laptop Policy.pdf',
    localPath: '/assets/policies/Laptop Policy.pdf',
    isActive: true
  },
  {
    title: 'Employment Policy',
    description: 'Core employment policies covering terms of employment, workplace conduct, and general employment guidelines for all employees.',
    category: 'employment',
    fileName: 'Employment Policy.pdf',
    localPath: '/assets/policies/Employment Policy.pdf',
    isActive: true
  },
  {
    title: 'Extra Work Day Allowance',
    description: 'Policy for compensation and allowances when working additional days beyond regular schedule, including overtime and weekend work.',
    category: 'compensation',
    fileName: 'Extra Work Day Allowance.pdf',
    localPath: '/assets/policies/Extra Work Day Allowance.pdf',
    isActive: true
  },
  {
    title: 'Compensatory Leave Policy',
    description: 'Guidelines for compensatory leave arrangements, including when and how compensatory time off is granted and utilized.',
    category: 'leave',
    fileName: 'Compensatory Leave Policy.pdf',
    localPath: '/assets/policies/Compensatory Leave Policy.pdf',
    isActive: true
  }
];

const uploadFileToFirebase = async (localPath, fileName) => {
  try {
    // Fetch the file from the public directory
    const response = await fetch(localPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `policies/${timestamp}-${cleanFileName}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload file to Firebase Storage
    console.log(`Uploading ${fileName}...`);
    const snapshot = await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      storagePath,
      fileUrl: downloadURL,
      fileSize: blob.size
    };
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  }
};

export const migratePoliciestoFirebase = async () => {
  try {
    console.log('Starting policy migration to Firebase Storage...');
    
    for (const policy of existingPolicies) {
      try {
        console.log(`Processing: ${policy.title}`);
        
        // Upload file to Firebase Storage
        const uploadResult = await uploadFileToFirebase(policy.localPath, policy.fileName);
        
        // Create policy data with Firebase URLs
        const policyData = {
          title: policy.title,
          description: policy.description,
          category: policy.category,
          fileName: policy.fileName,
          fileUrl: uploadResult.fileUrl,
          storagePath: uploadResult.storagePath,
          fileSize: uploadResult.fileSize,
          isActive: policy.isActive,
          uploadedBy: 'migration-script',
        };
        
        // Add to Firestore
        await policiesService.addPolicy(policyData);
        console.log(`✓ Successfully migrated: ${policy.title}`);
        
      } catch (error) {
        console.error(`✗ Failed to migrate ${policy.title}:`, error);
      }
    }
    
    console.log('Policy migration completed!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
};

// Instructions for use:
// 1. Import this script in your component
// 2. Call migratePoliciestoFirebase() once to migrate existing files
// 3. Make sure your Firebase Storage rules allow uploads

export default migratePoliciestoFirebase;
