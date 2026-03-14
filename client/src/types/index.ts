// ── Re-exports ──────────────────────────────────────────
import type { User, AuthState, AuthActions } from './auth';
export type { User, AuthState, AuthActions };

// ── Common ──────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta_data: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  data: T;
  description?: string;
}

// ── Role ────────────────────────────────────────────────
export interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: Permission[];
  is_default: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// ── Permission ──────────────────────────────────────────
export interface Permission {
  _id: string;
  name: string;
  slug: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete';
  description?: string;
}

// ── Group ───────────────────────────────────────────────
export interface UserGroup {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  roles: Role[];
  users: User[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Session ─────────────────────────────────────────────
export interface Session {
  _id: string;
  device: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

// ── Audit Log ───────────────────────────────────────────
export interface AuditLog {
  _id: string;
  user_id: string;
  user_email: string;
  action: string;
  target_type: string;
  target_id?: string;
  method: string;
  endpoint: string;
  status_code: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// ── Invitation ──────────────────────────────────────────
export interface Invitation {
  _id: string;
  email: string;
  role_id?: Role;
  token: string;
  expires_at: string;
  accepted_at?: string;
  invited_by: User;
  is_revoked: boolean;
  created_at: string;
}

// ── API Key ─────────────────────────────────────────────
export interface ApiKey {
  _id: string;
  name: string;
  prefix: string;
  permissions: string[];
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

// ── System Config ───────────────────────────────────────
export interface SystemConfig {
  _id: string;
  key: string;
  value: unknown;
  category: string;
  description?: string;
  updated_at: string;
}

// ── Social Connector ────────────────────────────────────
export interface SocialConnector {
  _id: string;
  provider: string;
  display_name: string;
  client_id: string;
  client_secret_masked: string;
  scopes: string[];
  is_enabled: boolean;
  sort_order: number;
  icon_url?: string;
  authorize_url?: string;
  token_url?: string;
  profile_url?: string;
  callback_url?: string;
  created_at: string;
  updated_at: string;
}

// ── Social Account ──────────────────────────────────────
export interface SocialAccount {
  _id: string;
  provider: string;
  provider_user_id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  linked_at: string;
}

// ── Advertisement ──────────────────────────────────────
export type AdPosition = 'header' | 'sidebar' | 'content_top' | 'content_bottom' | 'footer' | 'popup';
export type AdType = 'image' | 'html' | 'script';

export interface Advertisement {
  _id: string;
  title: string;
  type: AdType;
  position: AdPosition;
  image_url?: string;
  link_url?: string;
  html_content?: string;
  script_content?: string;
  alt_text?: string;
  priority: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  impressions: number;
  clicks: number;
  target_pages: string[];
  created_at: string;
  updated_at: string;
}

// ── Custom Field ───────────────────────────────────────
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'url' | 'email';

export interface CustomField {
  _id: string;
  label: string;
  key: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  is_required: boolean;
  is_active: boolean;
  options: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Sidebar Nav Item ────────────────────────────────────
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  permission?: string;
  children?: NavItem[];
}
