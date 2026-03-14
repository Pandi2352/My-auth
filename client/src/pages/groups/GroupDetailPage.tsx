import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Users,
  Shield,
  Settings,
  Check,
  Plus,
  Trash2,
  Info,
  Search,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { PageLoader } from '@/components/ui/PageLoader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import api from '@/lib/api/client';
import { GROUPS, ROLES, ADMIN_USERS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { Role } from '@/types';

// Raw backend shapes (snake_case)
interface RawGroupUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface RawGroup {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  roles: Array<{ _id: string; name: string; slug: string; permissions?: Array<{ _id: string; name: string; slug: string }> }>;
  users: RawGroupUser[];
  created_at: string;
  updated_at: string;
}

interface RawSearchUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'create';
  useDocumentTitle(isCreate ? 'Create Group' : 'Group Details');
  const navigate = useNavigate();

  // Form state for create mode
  const [form, setForm] = useState({ name: '', slug: '', description: '', is_active: true });
  const [createRoleIds, setCreateRoleIds] = useState<string[]>([]);

  // Edit mode state
  const [group, setGroup] = useState<RawGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  // User search
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 400);
  const [searchResults, setSearchResults] = useState<RawSearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Remove user confirmation
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [api.get(ROLES.LIST)];
      if (!isCreate) {
        promises.push(api.get(GROUPS.GET(id!)));
      }
      const [rolesRes, groupRes] = await Promise.all(promises);
      setAllRoles(Array.isArray(rolesRes.data.data) ? rolesRes.data.data : []);
      if (!isCreate && groupRes) {
        const g = groupRes.data.data;
        setGroup(g);
        setForm({ name: g.name, slug: g.slug, description: g.description || '', is_active: g.is_active });
      }
    } catch (error) {
      handleApiError(error, 'Failed to load group data');
      navigate('/groups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Debounced user search
  useEffect(() => {
    if (debouncedUserSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    api.get(ADMIN_USERS.LIST, { params: { search: debouncedUserSearch, limit: 10 } })
      .then((res) => {
        const users: RawSearchUser[] = res.data.data.users || [];
        const existingIds = group?.users?.map((u) => u._id) || [];
        setSearchResults(users.filter((u) => !existingIds.includes(u._id)));
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [debouncedUserSearch, group?.users]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      ...(isCreate ? { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      toast.error('Name and slug are required');
      return;
    }
    setIsSaving(true);
    try {
      if (isCreate) {
        const payload: any = {
          name: form.name,
          slug: form.slug,
          description: form.description,
          is_active: form.is_active,
        };
        if (createRoleIds.length > 0) payload.role_ids = createRoleIds;
        const res = await api.post(GROUPS.CREATE, payload);
        toast.success('Group created');
        navigate(`/groups/${res.data.data._id}`);
      } else {
        await api.patch(GROUPS.UPDATE(id!), {
          name: form.name,
          description: form.description,
          is_active: form.is_active,
        });
        toast.success('Group updated');
        fetchData();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRole = async (roleId: string) => {
    if (isCreate) {
      setCreateRoleIds((prev) =>
        prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId],
      );
      return;
    }

    try {
      const isAssigned = group?.roles?.some((r) => r._id === roleId);
      if (isAssigned) {
        await api.delete(GROUPS.REMOVE_ROLES(id!), { data: { role_ids: [roleId] } });
      } else {
        await api.post(GROUPS.ASSIGN_ROLES(id!), { role_ids: [roleId] });
      }
      toast.success('Roles updated');
      fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleAddUser = async (userId: string) => {
    if (isCreate) return; // Can't add users before group exists
    try {
      await api.post(GROUPS.ADD_USERS(id!), { user_ids: [userId] });
      toast.success('User added');
      setUserSearch('');
      setSearchResults([]);
      fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleRemoveUser = async () => {
    if (!removeUserId || isCreate) return;
    try {
      await api.delete(GROUPS.REMOVE_USERS(id!), { data: { user_ids: [removeUserId] } });
      toast.success('User removed');
      setRemoveUserId(null);
      fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  if (isLoading) return <PageLoader />;

  const groupRoleIds = isCreate ? createRoleIds : (group?.roles?.map((r) => r._id) || []);
  const groupUsers = group?.users || [];

  // Resolve permissions from assigned roles
  const resolvedPermissions = isCreate
    ? []
    : Array.from(
        new Set(
          group?.roles?.flatMap((r) => r.permissions?.map((p) => p.slug) || []) || [],
        ),
      ).sort();

  const memberColumns: Column<RawGroupUser>[] = [
    {
      key: 'name',
      header: 'Member',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {u.first_name?.[0]}{u.last_name?.[0]}
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{u.first_name} {u.last_name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => <span className="text-sm text-muted-foreground">{u.email}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => setRemoveUserId(u._id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/groups')}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {isCreate ? 'Create New Group' : group?.name || 'Group Details'}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Settings */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Group Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Sales Team"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Slug</label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                    placeholder="e.g., sales-team"
                    className="mt-1 font-mono text-xs"
                    disabled={!isCreate}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Team purpose..."
                  />
                </div>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Active Group
                </label>
                <Button type="submit" className="w-full" isLoading={isSaving}>
                  {isCreate ? 'Create Group' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {!isCreate && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-bold">{groupUsers.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Roles:</span>
                    <span className="font-bold">{groupRoleIds.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Permissions:</span>
                    <span className="font-bold">{resolvedPermissions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={isCreate ? 'roles' : 'members'} className="w-full">
            <Card>
              <CardHeader className="pb-0 border-b border-border">
                <TabsList>
                  {!isCreate && (
                    <TabsTrigger value="members" className="gap-2">
                      <Users className="h-4 w-4" /> Members ({groupUsers.length})
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="roles" className="gap-2">
                    <Shield className="h-4 w-4" /> Roles ({groupRoleIds.length})
                  </TabsTrigger>
                  {!isCreate && (
                    <TabsTrigger value="permissions" className="gap-2">
                      <Settings className="h-4 w-4" /> Permissions ({resolvedPermissions.length})
                    </TabsTrigger>
                  )}
                </TabsList>
              </CardHeader>

              {/* Members Tab */}
              {!isCreate && (
                <TabsContent value="members" className="p-0">
                  <div className="p-4 flex items-center justify-between border-b border-border bg-muted/30">
                    <p className="text-sm font-semibold text-foreground">Group Members</p>
                    <Button size="sm" onClick={() => setShowUserSearch(!showUserSearch)}>
                      <Plus className="h-4 w-4 mr-1" /> Add User
                    </Button>
                  </div>

                  {showUserSearch && (
                    <div className="p-4 border-b border-border bg-primary/5 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users by name or email..."
                          className="pl-9"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
                      {searchResults.length > 0 && (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {searchResults.map((u) => (
                            <div
                              key={u._id}
                              className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleAddUser(u._id)}>
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {debouncedUserSearch.length >= 2 && !searching && searchResults.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No users found</p>
                      )}
                    </div>
                  )}

                  <DataTable
                    columns={memberColumns}
                    data={groupUsers}
                    isLoading={false}
                    emptyMessage="No members in this group yet"
                    emptyIcon={<Users className="h-6 w-6 text-muted-foreground/50" />}
                    emptyAction={
                      <Button size="sm" variant="outline" onClick={() => setShowUserSearch(true)}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add first member
                      </Button>
                    }
                  />
                </TabsContent>
              )}

              {/* Roles Tab */}
              <TabsContent value="roles" className="p-6">
                <CardDescription className="mb-4">
                  {isCreate
                    ? 'Select roles to assign when the group is created.'
                    : 'Roles assigned to this group are automatically granted to all members.'}
                </CardDescription>
                {allRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No roles available</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {allRoles.map((role) => {
                      const isAssigned = groupRoleIds.includes(role._id);
                      return (
                        <button
                          key={role._id}
                          type="button"
                          onClick={() => handleToggleRole(role._id)}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 text-left transition-all ${
                            isAssigned
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-sm text-foreground">{role.name}</p>
                            <p className="text-xs text-muted-foreground">{role.description || `${role.permissions?.length || 0} permissions`}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isAssigned ? 'bg-primary border-primary' : 'border-gray-300'
                          }`}>
                            {isAssigned && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Permissions Tab */}
              {!isCreate && (
                <TabsContent value="permissions" className="p-6">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 flex gap-3 mb-6">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      These permissions are inherited from all roles assigned to this group. Members get these permissions automatically.
                    </p>
                  </div>

                  {resolvedPermissions.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground italic">
                      No roles assigned — no permissions inherited.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {resolvedPermissions.map((slug) => (
                        <div key={slug} className="flex items-center gap-2 text-sm font-mono bg-muted px-3 py-2 rounded-md">
                          <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                          {slug}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Card>
          </Tabs>
        </div>
      </div>

      <ConfirmDialog
        open={!!removeUserId}
        onClose={() => setRemoveUserId(null)}
        onConfirm={handleRemoveUser}
        title="Remove Member"
        message="Remove this user from the group? They will lose all group-inherited roles and permissions."
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
