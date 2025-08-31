import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format a date in a human-readable way
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'h:mm a')}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'h:mm a')}`;
  }
  
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Format a date as a relative time string
 * @param {Date|string} date - The date to format
 * @returns {string} - Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date for form inputs (YYYY-MM-DD)
 * @param {Date|string} date - The date to format
 * @returns {string} - ISO date string
 */
export function formatDateForInput(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Check if a date is in the past
 * @param {Date|string} date - The date to check
 * @returns {boolean} - True if the date is in the past
 */
export function isPastDate(date) {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
}

/**
 * Get the start and end of the current week
 * @returns {Object} - Object with start and end dates
 */
export function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get the start and end of the current month
 * @returns {Object} - Object with start and end dates
 */
export function getCurrentMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  if (typeof amount !== 'number') return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
