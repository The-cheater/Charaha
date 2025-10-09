export const APP_NAME = 'TeamMemory';

export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  SEARCH: '/search',
  SOURCES: '/sources',
  ANALYTICS: '/analytics',
  HISTORY: '/history',
  SETTINGS: '/settings',
} as const;

export const SOURCE_TYPES = {
  SLACK: 'slack',
  GOOGLE_DRIVE: 'google-drive',
  NOTION: 'notion',
  GITHUB: 'github',
  CONFLUENCE: 'confluence',
  JIRA: 'jira',
} as const;

export const SOURCE_STATUS = {
  ACTIVE: 'active',
  SYNCING: 'syncing',
  ERROR: 'error',
  INACTIVE: 'inactive',
} as const;

export const SEARCH_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
};
