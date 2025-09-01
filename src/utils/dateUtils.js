// Utility functions for date handling and formatting

/**
 * Safely convert a Firestore timestamp or date to a Date object
 * @param {any} timestamp - Firestore timestamp, Date object, or date string
 * @returns {Date|null} - Date object or null if invalid
 */
export const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    // If it's a Firestore timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // If it's a string or number, try to create a Date
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return null;
  }
};

/**
 * Format a date with ordinal suffix
 * @param {Date|string|any} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateWithOrdinal = (date) => {
  const convertedDate = convertTimestamp(date);
  if (!convertedDate) return 'Invalid Date';
  
  const day = convertedDate.getDate();
  const month = convertedDate.toLocaleDateString('en-US', { month: 'long' });
  const year = convertedDate.getFullYear();
  const dayOfWeek = convertedDate.toLocaleDateString('en-US', { weekday: 'long' });
  
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `${dayOfWeek}, ${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};

/**
 * Format a date range
 * @param {Date|string|any} startDate - Start date
 * @param {Date|string|any} endDate - End date
 * @returns {string} - Formatted date range string
 */
export const formatDateRange = (startDate, endDate) => {
  const start = convertTimestamp(startDate);
  const end = convertTimestamp(endDate);
  
  if (!start || !end) return 'Invalid Date';
  
  if (start.toDateString() === end.toDateString()) {
    return formatDateWithOrdinal(start);
  }
  
  return `${formatDateWithOrdinal(start)} - ${formatDateWithOrdinal(end)}`;
};

/**
 * Format a date for display in tables
 * @param {Date|string|any} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatTableDate = (date) => {
  const convertedDate = convertTimestamp(date);
  if (!convertedDate) return 'Invalid Date';
  
  return convertedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a date for input fields (YYYY-MM-DD)
 * @param {Date|string|any} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatInputDate = (date) => {
  const convertedDate = convertTimestamp(date);
  if (!convertedDate) return '';
  
  return convertedDate.toISOString().split('T')[0];
};
