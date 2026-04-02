import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './app/router';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PageLoader } from './components/ui/PageLoader';
import { CustomCSSInjector } from './components/ui/CustomCSSInjector';
import { CommandPalette } from './components/ui/CommandPalette';
import { useAuthInit } from './hooks/useAuth';

// Auth pages (keep eager — small & critical path)
import LoginPage from './app/login/page';
import RegisterPage from './app/register/page';

// Lazy-loaded auth pages
const VerifyEmailPage = lazy(() => import('./app/verify-email/page'));
const ForgotPasswordPage = lazy(() => import('./app/forgot-password/page'));
const ResetPasswordPage = lazy(() => import('./app/reset-password/page'));
const AuthCallbackPage = lazy(() => import('./app/auth-callback/page'));
const RecoverAccountPage = lazy(() => import('./app/recover-account/page'));
const ForcePasswordPage = lazy(() => import('./app/force-password/page'));

// Lazy-loaded dashboard pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const UsersListPage = lazy(() => import('./pages/users/UsersListPage'));
const UserCreatePage = lazy(() => import('./pages/users/UserCreatePage'));
const UserDetailPage = lazy(() => import('./pages/users/UserDetailPage'));
const RolesListPage = lazy(() => import('./pages/roles/RolesListPage'));
const RoleDetailPage = lazy(() => import('./pages/roles/RoleDetailPage'));
const PermissionsListPage = lazy(() => import('./pages/permissions/PermissionsListPage'));
const GroupsListPage = lazy(() => import('./pages/groups/GroupsListPage'));
const GroupDetailPage = lazy(() => import('./pages/groups/GroupDetailPage'));
const InvitationsListPage = lazy(() => import('./pages/invitations/InvitationsListPage'));
const SessionsListPage = lazy(() => import('./pages/sessions/SessionsListPage'));
const ConnectorsListPage = lazy(() => import('./pages/connectors/ConnectorsListPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const ApiKeysPage = lazy(() => import('./pages/api-keys/ApiKeysPage'));
const AuditLogsPage = lazy(() => import('./pages/audit/AuditLogsPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const SecurityPage = lazy(() => import('./pages/security/SecurityPage'));
const AdvertisementsPage = lazy(() => import('./pages/advertisements/AdvertisementsPage'));
const CustomFieldsPage = lazy(() => import('./pages/custom-fields/CustomFieldsPage'));
const SystemLogsPage = lazy(() => import('./pages/system-logs/SystemLogsPage'));
const PermissionMatrixPage = lazy(() => import('./pages/admin/PermissionMatrixPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));

// Error pages
const NotFound = lazy(() => import('./pages/errors/NotFound'));
const Forbidden = lazy(() => import('./pages/errors/Forbidden'));
const ServerError = lazy(() => import('./pages/errors/ServerError'));
const NetworkError = lazy(() => import('./pages/errors/NetworkError'));

function App() {
  useAuthInit();

  return (
    <Suspense fallback={<PageLoader />}>
      <CustomCSSInjector />
      <CommandPalette />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/recover-account" element={<RecoverAccountPage />} />
          <Route path="/force-password" element={<ForcePasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>

        {/* Protected Routes — wrapped in DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/create" element={<UserCreatePage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/roles" element={<RolesListPage />} />
            <Route path="/roles/create" element={<RoleDetailPage />} />
            <Route path="/roles/:id" element={<RoleDetailPage />} />
            <Route path="/permissions" element={<PermissionsListPage />} />
            <Route path="/groups" element={<GroupsListPage />} />
            <Route path="/groups/create" element={<GroupDetailPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/invitations" element={<InvitationsListPage />} />
            <Route path="/sessions" element={<SessionsListPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/advertisements" element={<AdvertisementsPage />} />
            <Route path="/custom-fields" element={<CustomFieldsPage />} />
            <Route path="/system-logs" element={<SystemLogsPage />} />
            <Route path="/admin/permissions/matrix" element={<PermissionMatrixPage />} />
            <Route path="/connectors" element={<ConnectorsListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Error pages */}
        <Route path="/403" element={<Forbidden />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/network-error" element={<NetworkError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
