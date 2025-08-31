// User Types
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// Department Types
export const DEPARTMENTS = {
  MANAGEMENT: 'management',
  MOBILE: 'mobile',
  WEB: 'web',
  BACKEND: 'backend',
  UI: 'ui',
  GRAPHIC_DESIGNING: 'graphic_designing'
};

// Developer Role Types for Projects
export const DEVELOPER_ROLES = {
  FRONTEND_MOBILE: 'frontend_mobile',
  FRONTEND_WEB: 'frontend_web',
  BACKEND: 'backend',
  UI_DESIGNER: 'ui_designer',
  TEAM_LEAD: 'team_lead'
};

// User Position Types
export const USER_POSITIONS = {
  FRONTEND_MOBILE_DEV: 'frontend_mobile_developer',
  FRONTEND_WEB_DEV: 'frontend_web_developer',
  BACKEND_DEV: 'backend_developer',
  UI_DESIGNER: 'ui_designer',
  TEAM_LEAD: 'team_lead',
  PROJECT_MANAGER: 'project_manager',
  OTHER: 'other'
};

// Project Cost Categories
export const COST_CATEGORIES = {
  BACKEND: 'backend',
  FRONTEND_WEB: 'frontend_web',
  FRONTEND_MOBILE: 'frontend_mobile',
  UI_DESIGN: 'ui_design',
  DEPLOYMENT: 'deployment',
  OTHER: 'other'
};

// Time Log Work Types
export const WORK_TYPES = {
  BACKEND: 'backend',
  FRONTEND_WEB: 'frontend_web', 
  FRONTEND_MOBILE: 'frontend_mobile',
  UI_DESIGN: 'ui_design',
  DEPLOYMENT: 'deployment',
  TESTING: 'testing',
  DOCUMENTATION: 'documentation',
  MEETINGS: 'meetings',
  OTHER: 'other'
};

// Project Types
export const PROJECT_TYPES = {
  ONE_TIME: 'one_time',
  RETAINER: 'retainer',
  HOURLY: 'hourly'
};

// Billing Frequency for Retainers
export const BILLING_FREQUENCY = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
};

// Revenue Type for Projects
export const REVENUE_TYPE = {
  FIXED: 'fixed',           // Revenue regardless of hours worked
  HOURS_BASED: 'hours_based' // Revenue based on hours worked
};

// Project Status
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Utility function to get display names
export const getWorkTypeLabel = (workType) => {
  const labels = {
    [WORK_TYPES.BACKEND]: 'Backend Development',
    [WORK_TYPES.FRONTEND_WEB]: 'Frontend Web',
    [WORK_TYPES.FRONTEND_MOBILE]: 'Frontend Mobile',
    [WORK_TYPES.UI_DESIGN]: 'UI/UX Design',
    [WORK_TYPES.DEPLOYMENT]: 'Deployment',
    [WORK_TYPES.TESTING]: 'Testing',
    [WORK_TYPES.DOCUMENTATION]: 'Documentation',
    [WORK_TYPES.MEETINGS]: 'Meetings',
    [WORK_TYPES.OTHER]: 'Other'
  };
  return labels[workType] || workType;
};

export const getProjectStatusLabel = (status) => {
  const labels = {
    [PROJECT_STATUS.PLANNING]: 'Planning',
    [PROJECT_STATUS.IN_PROGRESS]: 'In Progress',
    [PROJECT_STATUS.ON_HOLD]: 'On Hold',
    [PROJECT_STATUS.COMPLETED]: 'Completed',
    [PROJECT_STATUS.CANCELLED]: 'Cancelled'
  };
  return labels[status] || status;
};

export const getCostCategoryLabel = (category) => {
  const labels = {
    [COST_CATEGORIES.BACKEND]: 'Backend Development',
    [COST_CATEGORIES.FRONTEND_WEB]: 'Frontend Web',
    [COST_CATEGORIES.FRONTEND_MOBILE]: 'Frontend Mobile',
    [COST_CATEGORIES.UI_DESIGN]: 'UI/UX Design',
    [COST_CATEGORIES.DEPLOYMENT]: 'Deployment',
    [COST_CATEGORIES.OTHER]: 'Other'
  };
  return labels[category] || category;
};

export const getProjectTypeLabel = (type) => {
  const labels = {
    [PROJECT_TYPES.ONE_TIME]: 'One-time Project',
    [PROJECT_TYPES.RETAINER]: 'Monthly Retainer',
    [PROJECT_TYPES.HOURLY]: 'Hourly Project'
  };
  return labels[type] || type;
};

export const getBillingFrequencyLabel = (frequency) => {
  const labels = {
    [BILLING_FREQUENCY.MONTHLY]: 'Monthly',
    [BILLING_FREQUENCY.QUARTERLY]: 'Quarterly',
    [BILLING_FREQUENCY.YEARLY]: 'Yearly'
  };
  return labels[frequency] || frequency;
};

export const getRevenueTypeLabel = (type) => {
  const labels = {
    [REVENUE_TYPE.FIXED]: 'Fixed Amount (Regardless of Hours)',
    [REVENUE_TYPE.HOURS_BASED]: 'Based on Hours Worked'
  };
  return labels[type] || type;
};

export const getDeveloperRoleLabel = (role) => {
  const labels = {
    [DEVELOPER_ROLES.FRONTEND_MOBILE]: 'Frontend Developer (Mobile)',
    [DEVELOPER_ROLES.FRONTEND_WEB]: 'Frontend Developer (Web)',
    [DEVELOPER_ROLES.BACKEND]: 'Backend Developer',
    [DEVELOPER_ROLES.UI_DESIGNER]: 'UI Designer',
    [DEVELOPER_ROLES.TEAM_LEAD]: 'Team Lead'
  };
  return labels[role] || role;
};

export const getUserPositionLabel = (position) => {
  const labels = {
    [USER_POSITIONS.FRONTEND_MOBILE_DEV]: 'Frontend Developer (Mobile)',
    [USER_POSITIONS.FRONTEND_WEB_DEV]: 'Frontend Developer (Web)',
    [USER_POSITIONS.BACKEND_DEV]: 'Backend Developer',
    [USER_POSITIONS.UI_DESIGNER]: 'UI Designer',
    [USER_POSITIONS.TEAM_LEAD]: 'Team Lead',
    [USER_POSITIONS.PROJECT_MANAGER]: 'Project Manager',
    [USER_POSITIONS.OTHER]: 'Other'
  };
  return labels[position] || position;
};

export const getDepartmentLabel = (department) => {
  const labels = {
    [DEPARTMENTS.MANAGEMENT]: 'Management',
    [DEPARTMENTS.MOBILE]: 'Mobile Development',
    [DEPARTMENTS.WEB]: 'Web Development',
    [DEPARTMENTS.BACKEND]: 'Backend Development',
    [DEPARTMENTS.UI]: 'UI/UX Design',
    [DEPARTMENTS.GRAPHIC_DESIGNING]: 'Graphic Designing'
  };
  return labels[department] || department;
};
