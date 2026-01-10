// Application configuration - matching PM-Productivity-Tool pattern
// Update these values for your Supabase project

export const APP_CONFIG = {
  // Supabase configuration
  SUPABASE_URL: 'YOUR_SUPABASE_PROJECT_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  SUPABASE_ENABLED: true,

  // Authentication
  AUTH_ENABLED: true,

  // Organization branding
  ORG_NAME: 'Population Matters',
  ORG_DOMAIN: 'populationmatters.org',
  LOGO_URL: 'https://populationmatters.org/wp-content/uploads/2022/03/PM-logo.png',

  // Environment
  IS_PRODUCTION: window.location.protocol !== 'file:',
  DEBUG_MODE: window.location.protocol === 'file:' || window.location.hostname === 'localhost',

  // Feature flags
  FEATURES: {
    CALENDAR: true,
    KANBAN: true,
    APPROVALS: true,
    IDEAS: true,
    LINKEDIN: true,
    TESTING: true,
    COPY_CHECK: true,
    ACTIVITY_LOG: true,
  },
};

// Logger utility respecting DEBUG_MODE
export const Logger = {
  debug: (...args) => {
    if (APP_CONFIG.DEBUG_MODE) console.log('[DEBUG]', ...args);
  },
  info: (...args) => {
    if (APP_CONFIG.DEBUG_MODE) console.info('[INFO]', ...args);
  },
  warn: (...args) => {
    if (APP_CONFIG.DEBUG_MODE) console.warn('[WARN]', ...args);
  },
  error: (error, context = '') => {
    // Always log errors, but with more detail in debug mode
    if (APP_CONFIG.DEBUG_MODE) {
      console.error('[ERROR]', context, error);
    } else {
      console.error('[ERROR]', context, error?.message || error);
    }
  },
};

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  '?': { action: 'showHelp', description: 'Show keyboard shortcuts' },
  Escape: { action: 'closeModal', description: 'Close modal/panel' },
  n: { action: 'newEntry', description: 'New content entry' },
  i: { action: 'newIdea', description: 'New idea' },
  '/': { action: 'focusSearch', description: 'Focus search' },
  c: { action: 'calendarView', description: 'Calendar view' },
  k: { action: 'kanbanView', description: 'Kanban view' },
  a: { action: 'approvalsView', description: 'Approvals view' },
  d: { action: 'ideasView', description: 'Ideas view' },
  b: { action: 'toggleNotifications', description: 'Toggle notifications' },
};
