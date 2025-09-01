// Utility script to populate policies collection with existing PDF files
// This should be run once to migrate existing PDF files to the database

import { policiesService } from '../services/policiesService';

const existingPolicies = [
  {
    title: 'Remote Work Policy & Guidelines',
    description: 'Comprehensive guidelines for remote work arrangements, including expectations, communication protocols, and best practices for maintaining productivity while working remotely.',
    category: 'remote-work',
    fileName: 'Remote Work Policy & Guidelines.pdf',
    fileUrl: '/src/assets/policies/Remote Work Policy & Guidelines.pdf',
    isActive: true
  },
  {
    title: 'Leave Policy',
    description: 'Complete leave management policy covering sick leave, casual leave, annual leave, and other time-off arrangements with detailed procedures and requirements.',
    category: 'leave',
    fileName: 'Leave Policy.pdf',
    fileUrl: '/src/assets/policies/Leave Policy.pdf',
    isActive: true
  },
  {
    title: 'Laptop Policy',
    description: 'Equipment and IT policy for company-issued laptops, including usage guidelines, security requirements, and maintenance procedures.',
    category: 'equipment',
    fileName: 'Laptop Policy.pdf',
    fileUrl: '/src/assets/policies/Laptop Policy.pdf',
    isActive: true
  },
  {
    title: 'Employment Policy',
    description: 'Core employment policies covering terms of employment, workplace conduct, and general employment guidelines for all employees.',
    category: 'employment',
    fileName: 'Employment Policy.pdf',
    fileUrl: '/src/assets/policies/Employment Policy.pdf',
    isActive: true
  },
  {
    title: 'Extra Work Day Allowance',
    description: 'Policy for compensation and allowances when working additional days beyond regular schedule, including overtime and weekend work.',
    category: 'compensation',
    fileName: 'Extra Work Day Allowance.pdf',
    fileUrl: '/src/assets/policies/Extra Work Day Allowance.pdf',
    isActive: true
  },
  {
    title: 'Compensatory Leave Policy',
    description: 'Guidelines for compensatory leave arrangements, including when and how compensatory time off is granted and utilized.',
    category: 'leave',
    fileName: 'Compensatory Leave Policy.pdf',
    fileUrl: '/src/assets/policies/Compensatory Leave Policy.pdf',
    isActive: true
  }
];

export const populatePolicies = async () => {
  try {
    console.log('Starting policy population...');
    
    for (const policy of existingPolicies) {
      try {
        await policiesService.addPolicy(policy);
        console.log(`✓ Added policy: ${policy.title}`);
      } catch (error) {
        console.error(`✗ Failed to add policy: ${policy.title}`, error);
      }
    }
    
    console.log('Policy population completed!');
  } catch (error) {
    console.error('Error populating policies:', error);
  }
};

// Usage: Call this function once to populate the database
// await populatePolicies();
