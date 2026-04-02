// ── Auth ────────────────────────────────────────────────
export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  RECOVER_ACCOUNT: '/auth/recover-account',
  RECOVER_ACCOUNT_CONFIRM: '/auth/recover-account/confirm',
  IMPERSONATE: (id: string) => `/auth/impersonate/${id}`,
  ENABLE_2FA: '/auth/2fa/enable',
  VERIFY_2FA: '/auth/2fa/verify',
  DISABLE_2FA: '/auth/2fa/disable',
} as const;

// ── User Profile ────────────────────────────────────────
export const USER = {
  PROFILE: '/user/profile',
  UPDATE_EMAIL: '/user/email',
  UPDATE_PHONE: '/user/phone',
  UPDATE_PASSWORD: '/user/password',
  UPLOAD_AVATAR: '/user/profile/avatar',
  REMOVE_AVATAR: '/user/profile/avatar',
  NOTIFICATIONS: '/user/notifications',
  DATA_EXPORT: '/user/data-export',
  DELETE_ACCOUNT: '/user/account',
} as const;

// ── Admin Users ─────────────────────────────────────────
export const ADMIN_USERS = {
  LIST: '/admin/users',
  EXPORT: '/admin/users/export',
  GET: (id: string) => `/admin/users/${id}`,
  CREATE: '/admin/users',
  UPDATE: (id: string) => `/admin/users/${id}`,
  UPDATE_STATUS: (id: string) => `/admin/users/${id}/status`,
  SUSPEND: (id: string) => `/admin/users/${id}/suspend`,
  RESET_PASSWORD: (id: string) => `/admin/users/${id}/reset-password`,
  ASSIGN_ROLES: (id: string) => `/admin/users/${id}/roles`,
  REMOVE_ROLES: (id: string) => `/admin/users/${id}/roles`,
  SOFT_DELETE: (id: string) => `/admin/users/${id}/soft`,
  HARD_DELETE: (id: string) => `/admin/users/${id}`,
  RESTORE: (id: string) => `/admin/users/restore/${id}`,
  BULK_STATUS: '/admin/users/bulk/status',
  BULK_ROLES: '/admin/users/bulk/roles',
  BULK_DELETE: '/admin/users/bulk',
} as const;

// ── Sessions & Security ─────────────────────────────────
export const SESSIONS = {
  LIST: '/sessions',
  TERMINATE: (id: string) => `/sessions/${id}`,
  TERMINATE_ALL: '/sessions',
  LOGIN_HISTORY: '/security/login-history',
  SECURITY_EVENTS: '/security/events',
} as const;

// ── Groups ──────────────────────────────────────────────
export const GROUPS = {
  LIST: '/admin/groups',
  GET: (id: string) => `/admin/groups/${id}`,
  CREATE: '/admin/groups',
  UPDATE: (id: string) => `/admin/groups/${id}`,
  DELETE: (id: string) => `/admin/groups/${id}`,
  ADD_USERS: (id: string) => `/admin/groups/${id}/users`,
  REMOVE_USERS: (id: string) => `/admin/groups/${id}/users`,
  ASSIGN_ROLES: (id: string) => `/admin/groups/${id}/roles`,
  REMOVE_ROLES: (id: string) => `/admin/groups/${id}/roles`,
  PERMISSIONS: (id: string) => `/admin/groups/${id}/permissions`,
} as const;

// ── System Config ───────────────────────────────────────
export const SETTINGS = {
  PUBLIC_CONFIG: '/public/config',
  LIST: '/admin/settings',
  BY_CATEGORY: (cat: string) => `/admin/settings/category/${cat}`,
  BY_KEY: (key: string) => `/admin/settings/key/${key}`,
  CREATE: '/admin/settings',
  UPDATE: (key: string) => `/admin/settings/key/${key}`,
  BULK_UPDATE: (cat: string) => `/admin/settings/category/${cat}`,
  DELETE: (key: string) => `/admin/settings/key/${key}`,
} as const;

// ── Invitations ─────────────────────────────────────────
export const INVITATIONS = {
  LIST: '/admin/invitations',
  GET: (id: string) => `/admin/invitations/${id}`,
  CREATE: '/admin/invitations',
  RESEND: (id: string) => `/admin/invitations/${id}/resend`,
  REVOKE: (id: string) => `/admin/invitations/${id}`,
  VALIDATE: (token: string) => `/invitations/validate/${token}`,
} as const;

// ── API Keys ────────────────────────────────────────────
export const API_KEYS = {
  LIST: '/user/api-keys',
  GET: (id: string) => `/user/api-keys/${id}`,
  CREATE: '/user/api-keys',
  REVOKE: (id: string) => `/user/api-keys/${id}/revoke`,
  DELETE: (id: string) => `/user/api-keys/${id}`,
} as const;

// ── Audit Logs ──────────────────────────────────────────
export const AUDIT = {
  LIST: '/admin/audit-logs',
  GET: (id: string) => `/admin/audit-logs/${id}`,
  SUMMARY: '/admin/audit-logs/summary',
  EXPORT_JSON: '/admin/audit-logs/export/json',
  EXPORT_CSV: '/admin/audit-logs/export/csv',
} as const;

// ── Analytics ───────────────────────────────────────────
export const ANALYTICS = {
  OVERVIEW: '/admin/analytics/overview',
  USERS_TOTAL: '/admin/analytics/users/total',
  USERS_ACTIVE: '/admin/analytics/users/active',
  USERS_STATUS: '/admin/analytics/users/status',
  USERS_GROWTH: '/admin/analytics/users/growth',
  USERS_CHART: '/admin/analytics/users/chart',
  LOGINS: '/admin/analytics/logins',
  ROLES: '/admin/analytics/roles',
  HISTORY: '/admin/analytics/history',
  CHURN_PREDICTION: '/admin/analytics/churn-prediction',
} as const;

// ── Social Auth ─────────────────────────────────────────
export const SOCIAL = {
  PROVIDERS: '/auth/social/providers',
  AUTHORIZE: (provider: string) => `/auth/social/${provider}`,
  LINKED_ACCOUNTS: '/auth/social/accounts/linked',
  UNLINK: (provider: string) => `/auth/social/${provider}/unlink`,
  LINK: (provider: string) => `/auth/social/${provider}/link`,
} as const;

// ── Social Connectors (Admin) ───────────────────────────
export const CONNECTORS = {
  LIST: '/admin/social-connectors',
  GET: (id: string) => `/admin/social-connectors/${id}`,
  CREATE: '/admin/social-connectors',
  UPDATE: (id: string) => `/admin/social-connectors/${id}`,
  TOGGLE: (id: string) => `/admin/social-connectors/${id}/toggle`,
  DELETE: (id: string) => `/admin/social-connectors/${id}`,
} as const;

// ── Roles ───────────────────────────────────────────────
export const ROLES = {
  LIST: '/roles',
  GET: (id: string) => `/roles/${id}`,
  CREATE: '/roles',
  UPDATE: (id: string) => `/roles/${id}`,
  DELETE: (id: string) => `/roles/${id}`,
  PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
  MATRIX: '/roles/matrix',
  SYNC_MATRIX: '/roles/matrix/sync',
  ASSIGN_PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
  REMOVE_PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
} as const;

// ── Permissions ─────────────────────────────────────────
export const PERMISSIONS = {
  LIST: '/permissions',
  GET: (id: string) => `/permissions/${id}`,
  CREATE: '/permissions',
  UPDATE: (id: string) => `/permissions/${id}`,
  DELETE: (id: string) => `/permissions/${id}`,
} as const;

// ── Advertisements (Admin) ──────────────────────────────
export const ADS = {
  LIST: '/admin/advertisements',
  GET: (id: string) => `/admin/advertisements/${id}`,
  CREATE: '/admin/advertisements',
  UPDATE: (id: string) => `/admin/advertisements/${id}`,
  TOGGLE: (id: string) => `/admin/advertisements/${id}/toggle`,
  DELETE: (id: string) => `/admin/advertisements/${id}`,
  // Public
  ACTIVE: '/ads',
  IMPRESSION: (id: string) => `/ads/${id}/impression`,
  CLICK: (id: string) => `/ads/${id}/click`,
} as const;

// ── In-App Notifications ────────────────────────────────
export const NOTIFICATIONS = {
  LIST: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/read-all',
  PERFORM_ACTION: (id: string) => `/notifications/${id}/action`,
  DELETE: (id: string) => `/notifications/${id}`,
  DELETE_ALL: '/notifications',
} as const;

// ── System Logs (Admin) ────────────────────────────────
export const LOGS = {
  LIST: '/admin/logs',
  FILES: '/admin/logs/files',
} as const;

// ── Custom Fields (Admin) ───────────────────────────────
export const CUSTOM_FIELDS = {
  LIST: '/admin/custom-fields',
  ACTIVE: '/admin/custom-fields/active',
  GET: (id: string) => `/admin/custom-fields/${id}`,
  CREATE: '/admin/custom-fields',
  UPDATE: (id: string) => `/admin/custom-fields/${id}`,
  DELETE: (id: string) => `/admin/custom-fields/${id}`,
} as const;

// ── Health ──────────────────────────────────────────────
export const HEALTH = {
  LIVENESS: '/health',
  READINESS: '/health/ready',
} as const;
