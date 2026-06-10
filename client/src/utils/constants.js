export const QUERY_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const QUERY_STATUS_LABELS = {
  [QUERY_STATUS.OPEN]: 'Open',
  [QUERY_STATUS.IN_PROGRESS]: 'In Progress',
  [QUERY_STATUS.RESOLVED]: 'Resolved',
  [QUERY_STATUS.CLOSED]: 'Closed',
};

export const QUERY_STATUS_COLORS = {
  [QUERY_STATUS.OPEN]: '#3b82f6',       // Blue
  [QUERY_STATUS.IN_PROGRESS]: '#f59e0b', // Amber
  [QUERY_STATUS.RESOLVED]: '#10b981',    // Emerald
  [QUERY_STATUS.CLOSED]: '#64748b',      // Slate
};

export const QUERY_CATEGORY = {
  TECHNICAL: 'technical',
  BILLING: 'billing',
  ACCOUNT: 'account',
  OTHER: 'other',
};

export const QUERY_CATEGORY_LABELS = {
  [QUERY_CATEGORY.TECHNICAL]: 'Technical',
  [QUERY_CATEGORY.BILLING]: 'Billing',
  [QUERY_CATEGORY.ACCOUNT]: 'Account Management',
  [QUERY_CATEGORY.OTHER]: 'Other',
};

export const QUERY_CATEGORY_COLORS = {
  [QUERY_CATEGORY.TECHNICAL]: '#8b5cf6', // Violet
  [QUERY_CATEGORY.BILLING]: '#ec4899',   // Pink
  [QUERY_CATEGORY.ACCOUNT]: '#06b6d4',   // Cyan
  [QUERY_CATEGORY.OTHER]: '#64748b',     // Slate
};

export const MISTAKE_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const MISTAKE_SEVERITY_LABELS = {
  [MISTAKE_SEVERITY.LOW]: 'Low',
  [MISTAKE_SEVERITY.MEDIUM]: 'Medium',
  [MISTAKE_SEVERITY.HIGH]: 'High',
};

export const MISTAKE_SEVERITY_COLORS = {
  [MISTAKE_SEVERITY.LOW]: '#10b981',    // Emerald
  [MISTAKE_SEVERITY.MEDIUM]: '#f59e0b', // Amber
  [MISTAKE_SEVERITY.HIGH]: '#ef4444',   // Rose
};

export const CLIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const CLIENT_STATUS_LABELS = {
  [CLIENT_STATUS.ACTIVE]: 'Active',
  [CLIENT_STATUS.INACTIVE]: 'Inactive',
};

export const ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.RECRUITER]: 'Recruiter',
  [ROLES.VIEWER]: 'Viewer',
};
