import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Search, 
  Eye,
  Trash2,
  RefreshCcw
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils/cn';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import api from '@/lib/api/client';
import { ADMIN_USERS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import { mapBackendUser } from '@/lib/utils/mapUser';
import type { User } from '@/types/auth';

export default function UsersListPage() {
  useDocumentTitle('User Management');
  const navigate = useNavigate();
  
  // State
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const debouncedSearch = useDebounce(search, 500);
  
  const { meta, page, limit, goToPage, changeLimit, updateMeta } = usePagination();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialog states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkStatusMode, setBulkStatusMode] = useState<'active' | 'suspended' | null>(null);
  const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
        status: status || undefined,
      };
      const res = await api.get(ADMIN_USERS.LIST, { params });
      const raw = res.data.data.users || [];
      setData(raw.map(mapBackendUser));
      updateMeta(res.data.data.meta_data);
      // Clear selection on refresh/page change
      setSelectedIds([]);
    } catch (error) {
      handleApiError(error, 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, debouncedSearch, status]);

  useEffect(() => {
    if (showBulkRoleModal) fetchRoles();
  }, [showBulkRoleModal]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(ADMIN_USERS.HARD_DELETE(deleteId));
      toast.success('User deleted successfully');
      setDeleteId(null);
      fetchUsers();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: 'active' | 'suspended') => {
    try {
      await api.patch(ADMIN_USERS.BULK_STATUS, {
        user_ids: selectedIds,
        status: newStatus
      });
      toast.success(`Successfully updated ${selectedIds.length} users`);
      setBulkStatusMode(null);
      fetchUsers();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleBulkRoleAssign = async () => {
    if (!selectedRoleId) return;
    try {
      await api.post(ADMIN_USERS.BULK_ROLES, {
        user_ids: selectedIds,
        role_ids: [selectedRoleId]
      });
      toast.success(`Successfully assigned roles to ${selectedIds.length} users`);
      setShowBulkRoleModal(false);
      setSelectedRoleId('');
      fetchUsers();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await api.delete(ADMIN_USERS.BULK_DELETE, {
        data: { user_ids: selectedIds, soft: true }
      });
      toast.success(`Successfully deleted ${selectedIds.length} users`);
      setBulkDeleteConfirm(false);
      fetchUsers();
    } catch (error) {
      handleApiError(error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const columns: Column<User>[] = [
    {
      key: 'select',
      header: (
        <input 
          type="checkbox" 
          className="h-4 w-4 rounded border-border bg-background" 
          checked={selectedIds.length > 0 && selectedIds.length === data.length}
          onChange={toggleSelectAll}
        />
      ),
      className: 'w-[40px]',
      render: (user) => (
        <input 
          type="checkbox" 
          className="h-4 w-4 rounded border-border bg-background" 
          checked={selectedIds.includes(user.id)}
          onChange={() => toggleSelect(user.id)}
        />
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} className="h-8 w-8 rounded-full border border-border" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          )}
          <div>
            <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
            <div className="text-[10px] tabular-nums text-muted-foreground">{user.id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (user) => (
        <div>
          <div className="text-foreground max-w-[200px] truncate">{user.email}</div>
          {user.isEmailVerified ? (
            <div className="text-[10px] text-green-500 font-medium">Verified</div>
          ) : (
            <div className="text-[10px] text-orange-500 font-medium">Unverified</div>
          )}
        </div>
      )
    },
    {
      key: 'role',
      header: 'Roles',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.role.map((r) => (
             <span key={r} className="inline-flex items-center rounded-sm bg-secondary/50 px-1.5 py-0 text-[10px] font-medium text-secondary-foreground border border-border/50 capitalize">
               {r}
             </span>
          ))}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user) => (
        <StatusBadge 
          status={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'error' : 'warning'} 
          label={user.status}
          variant="flat"
          className="capitalize text-[10px]"
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (user) => (
        <div className="flex justify-end gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/users/${user.id}`)}
            title="View Details"
            className="h-8 w-8 p-0"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDeleteId(user.id)}
            title="Delete User"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Manage your application users and their roles.</p>
        </div>
        <Button onClick={() => navigate('/users/create')} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email or ID..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <select 
             className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
             value={status}
             onChange={(e) => setStatus(e.target.value)}
           >
             <option value="">All Statuses</option>
             <option value="active">Active</option>
             <option value="pending">Pending</option>
             <option value="suspended">Suspended</option>
             <option value="inactive">Inactive</option>
           </select>
           <Button variant="outline" onClick={fetchUsers} title="Refresh">
             <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
           </Button>
        </div>
      </div>

      <div className="relative">
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          meta={meta}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
          emptyMessage={search ? `No users matching "${search}"` : 'No users found'}
          emptyIcon={<UserPlus className="h-6 w-6 text-muted-foreground/50" />}
          emptyAction={
            !search ? (
              <Button size="sm" variant="outline" onClick={() => navigate('/users/create')}>
                <UserPlus className="mr-2 h-3.5 w-3.5" /> Create your first user
              </Button>
            ) : undefined
          }
        />

        {/* Selection Toolbar */}
        {selectedIds.length > 0 && (
          <div className="sticky bottom-6 mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 p-4 backdrop-blur-md shadow-lg animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-primary">
                {selectedIds.length} users selected
              </span>
              <div className="h-4 w-[1px] bg-primary/20" />
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 gap-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                  onClick={() => setBulkStatusMode('active')}
                >
                  <RefreshCcw className="h-3.5 w-3.5" /> Activate
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 gap-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50"
                  onClick={() => setBulkStatusMode('suspended')}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Suspend
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 gap-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  onClick={() => setShowBulkRoleModal(true)}
                >
                  <Eye className="h-3.5 w-3.5" /> Assign Role
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 text-xs font-medium text-red-600 hover:bg-red-50"
                  onClick={() => setBulkDeleteConfirm(true)}
                >
                  Delete Selected
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs bg-white"
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
        confirmLabel="Delete User"
        variant="danger"
      />

      <ConfirmDialog
        open={!!bulkStatusMode}
        onClose={() => setBulkStatusMode(null)}
        onConfirm={() => bulkStatusMode && handleBulkStatusUpdate(bulkStatusMode)}
        title={bulkStatusMode === 'active' ? 'Activate Users' : 'Suspend Users'}
        message={`Are you sure you want to ${bulkStatusMode} ${selectedIds.length} selected users?`}
        confirmLabel={bulkStatusMode === 'active' ? 'Activate' : 'Suspend'}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Users"
        message={`Are you sure you want to delete ${selectedIds.length} selected users? This will perform a soft-delete.`}
        confirmLabel="Delete Users"
        variant="danger"
      />

      {/* Bulk Role Modal */}
      <ConfirmDialog
        open={showBulkRoleModal}
        onClose={() => setShowBulkRoleModal(false)}
        onConfirm={handleBulkRoleAssign}
        title="Assign Role to Selected Users"
        confirmLabel="Assign Role"
        message={
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Select a role to assign to all {selectedIds.length} selected users. This will add the role to their existing roles.</p>
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              <option value="">Select a role...</option>
              {roles.map((r: any) => (
                <option key={r._id} value={r._id}>{r.name} ({r.slug})</option>
              ))}
            </select>
          </div>
        }
      />
    </div>
  );
}
