import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft,
  User as UserIcon,
  Shield,
  Clock,
  Activity,
  Calendar,
  Mail,
  Phone,
  UserCog,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageLoader } from '@/components/ui/PageLoader';
import { UserForm, type UserFormValues } from '@/components/forms/UserForm';
import { DataTable, type Column } from '@/components/ui/DataTable';
import api from '@/lib/api/client';
import { ADMIN_USERS, AUTH } from '@/lib/api/endpoints';
import { CustomFieldsForm } from '@/components/forms/CustomFieldsForm';
import { handleApiError } from '@/lib/api/handleError';
import type { AuditLog, Session } from '@/types';

// Raw backend user shape (snake_case, roles populated with _id/name/slug)
interface RawUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: string;
  avatar_url?: string;
  avatar?: string;
  is_verified: boolean;
  roles: Array<{ _id: string; name: string; slug: string }>;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle('User Details');
  const navigate = useNavigate();

  const [raw, setRaw] = useState<RawUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Tab-specific data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const fetchUser = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(ADMIN_USERS.GET(id));
      setRaw(res.data.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch user details');
      navigate('/users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!id) return;
    setIsDataLoading(true);
    try {
      const res = await api.get('/admin/audit-logs', { params: { user_id: id, limit: 10 } });
      const items = res.data.data.items || res.data.data || [];
      setAuditLogs(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Audit logs error:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchSessions = async () => {
    if (!id) return;
    setIsDataLoading(true);
    try {
      const res = await api.get(`/admin/users/${id}/sessions`);
      const data = res.data.data;
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Sessions error:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleUpdate = async (values: UserFormValues) => {
    if (!id || !raw) return;
    setIsUpdating(true);
    try {
      // 1. Update user profile fields
      const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
        status: values.status,
      };
      await api.patch(ADMIN_USERS.UPDATE(id), payload);

      // 2. Update roles if changed
      const currentRoleIds = raw.roles.map((r) => r._id).sort();
      const newRoleIds = [...values.roleIds].sort();
      const rolesChanged =
        currentRoleIds.length !== newRoleIds.length ||
        currentRoleIds.some((id, i) => id !== newRoleIds[i]);

      if (rolesChanged) {
        await api.post(ADMIN_USERS.ASSIGN_ROLES(id), { role_ids: values.roleIds });
      }

      // 3. Re-fetch to get updated data
      const res = await api.get(ADMIN_USERS.GET(id));
      setRaw(res.data.data);
      toast.success('User updated successfully');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImpersonate = async () => {
    if (!id) return;
    setIsImpersonating(true);
    try {
      const res = await api.post(AUTH.IMPERSONATE(id));
      const data = res.data.data;

      // Save original admin tokens
      const originalAccess = localStorage.getItem('access_token');
      const originalRefresh = localStorage.getItem('refresh_token');
      localStorage.setItem('impersonate_original_access', originalAccess || '');
      localStorage.setItem('impersonate_original_refresh', originalRefresh || '');
      localStorage.setItem('impersonating_user', JSON.stringify(data.impersonating));

      // Set impersonation token
      localStorage.setItem('access_token', data.access_token);
      localStorage.removeItem('refresh_token'); // Impersonation has no refresh

      toast.success(`Now impersonating ${data.impersonating.first_name} ${data.impersonating.last_name}`);
      window.location.href = '/dashboard';
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsImpersonating(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (!raw) return null;

  // Derived display values
  const displayName = `${raw.first_name} ${raw.last_name || ''}`.trim();
  const initials = `${raw.first_name?.[0] || ''}${raw.last_name?.[0] || ''}`.toUpperCase();
  const avatar = raw.avatar_url || raw.avatar;
  const roleNames = raw.roles?.map((r) => r.name) || [];
  const roleIds = raw.roles?.map((r) => r._id) || [];

  // Form initial data (camelCase for the form)
  const formInitialData = {
    firstName: raw.first_name,
    lastName: raw.last_name || '',
    email: raw.email,
    phone: raw.phone || '',
    status: raw.status,
    roleIds,
  };

  const auditColumns: Column<AuditLog>[] = [
    { key: 'action', header: 'Action', sortable: true },
    { key: 'target_type', header: 'Target', sortable: true },
    { key: 'method', header: 'Method', className: 'uppercase font-mono text-xs' },
    { key: 'status_code', header: 'Status' },
    {
      key: 'created_at',
      header: 'Time',
      render: (log) => new Date(log.created_at).toLocaleString()
    }
  ];

  const sessionColumns: Column<Session>[] = [
    { key: 'device', header: 'Device' },
    { key: 'browser', header: 'Browser' },
    { key: 'ip_address', header: 'IP Address' },
    {
      key: 'is_active',
      header: 'Status',
      render: (s) => (
        <StatusBadge status={s.is_active ? 'success' : 'warning'} label={s.is_active ? 'Active' : 'Expired'} />
      )
    },
    {
      key: 'last_activity',
      header: 'Last Active',
      render: (s) => new Date(s.last_activity).toLocaleString()
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">User Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={raw.status === 'active' ? 'success' : 'error'}
            label={raw.status}
            className="text-sm px-3 py-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleImpersonate}
            isLoading={isImpersonating}
            className="gap-1.5"
          >
            <UserCog className="h-4 w-4" />
            Impersonate
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compact Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col items-center pb-2 text-center">
            {avatar ? (
              <img src={avatar} className="mb-4 h-24 w-24 rounded-full border-4 border-background" />
            ) : (
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary border-4 border-background">
                {initials}
              </div>
            )}
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>{raw.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span>{raw.email}</span>
                  <span className={`ml-2 text-[10px] font-medium ${raw.is_verified ? 'text-green-500' : 'text-orange-500'}`}>
                    {raw.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{raw.phone || 'No phone number'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(raw.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm border-t border-border pt-4 mt-4">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {roleNames.length > 0 ? (
                    roleNames.map((r) => (
                      <span key={r} className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No roles assigned</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <div className="px-6 pt-6 border-b border-border">
              <TabsList className="mb-4">
                <TabsTrigger value="profile" className="gap-2">
                  <UserIcon className="h-4 w-4" /> Profile
                </TabsTrigger>
                <TabsTrigger value="sessions" className="gap-2" onClick={fetchSessions}>
                  <Clock className="h-4 w-4" /> Sessions
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2" onClick={fetchAuditLogs}>
                  <Activity className="h-4 w-4" /> Activity
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-2">
                  <UserIcon className="h-4 w-4" /> Custom Fields
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="p-6">
              <UserForm
                initialData={formInitialData}
                onSubmit={handleUpdate}
                isLoading={isUpdating}
                isEdit
              />
            </TabsContent>

            <TabsContent value="sessions" className="p-6">
              <DataTable
                columns={sessionColumns}
                data={sessions}
                isLoading={isDataLoading}
                emptyMessage="No active sessions found for this user."
              />
            </TabsContent>

            <TabsContent value="activity" className="p-6">
              <DataTable
                columns={auditColumns}
                data={auditLogs}
                isLoading={isDataLoading}
                emptyMessage="No audit logs found for this user."
              />
            </TabsContent>

            <TabsContent value="custom" className="p-6">
              <CustomFieldsForm
                values={raw.custom_fields || {}}
                onSave={async (customFields) => {
                  await api.patch(ADMIN_USERS.UPDATE(id!), { custom_fields: customFields });
                  toast.success('Custom fields saved');
                  fetchUser();
                }}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
