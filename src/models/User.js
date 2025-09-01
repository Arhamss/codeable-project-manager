/**
 * User Model Definition
 * 
 * This file defines the user data structure for Firestore.
 * Collection: 'users'
 * Document ID: Firebase Auth UID
 */

import { USER_ROLES, DEPARTMENTS } from '../types';

/**
 * User Document Structure
 * @typedef {Object} User
 * @property {string} id - Firebase Auth UID (document ID)
 * @property {string} email - User's email address (from Firebase Auth)
 * @property {string} name - User's full name
 * @property {string} role - User role ('admin' | 'user')
 * @property {string} department - User's department (optional)
 * @property {string} phone - User's phone number (optional)
 * @property {string} companyId - Employee ID (e.g., C001) (optional)
 * @property {number} hourlyRate - User's hourly rate (optional, default: 0)
 * @property {boolean} isActive - Whether the user account is active
 * @property {string} profilePicture - URL to profile picture (optional)
 * @property {string} createdAt - ISO timestamp when user was created
 * @property {string} updatedAt - ISO timestamp when user was last updated
 */

/**
 * Default user data structure
 */
export const defaultUserData = {
  email: '',
  name: '',
  role: USER_ROLES.USER,
  department: '',
  phone: '',
  companyId: '',
  hourlyRate: 0,
  isActive: true,
  profilePicture: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Creates a new user document data object
 * @param {Object} userData - User data from registration form
 * @param {string} email - User's email from Firebase Auth
 * @returns {Object} Formatted user document for Firestore
 */
export const createUserDocument = (userData, email) => {
  return {
    email: email,
    name: userData.name || '',
    role: userData.role || USER_ROLES.USER,
    department: userData.department || '',
    phone: userData.phone || '',
    companyId: userData.companyId || '',
    hourlyRate: userData.hourlyRate || 0,
    isActive: true,
    profilePicture: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Updates user document data
 * @param {Object} existingData - Current user data
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated user document
 */
export const updateUserDocument = (existingData, updates) => {
  return {
    ...existingData,
    ...updates,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Validates user data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result { isValid: boolean, errors: string[] }
 */
export const validateUserData = (userData) => {
  const errors = [];

  if (!userData.email || !userData.email.includes('@')) {
    errors.push('Valid email is required');
  }

  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!Object.values(USER_ROLES).includes(userData.role)) {
    errors.push('Invalid user role');
  }

  if (userData.department && !Object.values(DEPARTMENTS).includes(userData.department)) {
    errors.push('Invalid department');
  }

  if (userData.hourlyRate && (isNaN(userData.hourlyRate) || userData.hourlyRate < 0)) {
    errors.push('Hourly rate must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Example user document structure for reference:
 * 
 * users/{userId} = {
 *   email: "john.doe@example.com",
 *   name: "John Doe",
 *   role: "user",
 *   department: "web",
 *   phone: "+1234567890",
 *   companyId: "C001",
 *   hourlyRate: 75,
 *   isActive: true,
 *   profilePicture: null,
 *   createdAt: "2024-01-15T10:30:00.000Z",
 *   updatedAt: "2024-01-15T10:30:00.000Z"
 * }
 */
