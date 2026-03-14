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

  // Dialog states
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    } catch (error) {
      handleApiError(error, 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, debouncedSearch, status]);

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

  const columns: Column<User>[] = [
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
            <div className="text-xs text-muted-foreground">{user.id}</div>
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
          <div className="text-foreground">{user.email}</div>
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
             <span key={r} className="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground border border-border capitalize">
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
          className="capitalize"
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (user) => (
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/users/${user.id}`)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDeleteId(user.id)}
            title="Delete User"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
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

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
        confirmLabel="Delete User"
        variant="danger"
      />
    </div>
  );
}
