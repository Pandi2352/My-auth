import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCcw,
  UserPlus
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import api from '@/lib/api/client';
import { GROUPS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { UserGroup } from '@/types';

export default function GroupsListPage() {
  useDocumentTitle('Group Management');
  const navigate = useNavigate();

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { meta, page, limit, goToPage, changeLimit, updateMeta } = usePagination();

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit, search: debouncedSearch || undefined };
      const res = await api.get(GROUPS.LIST, { params });
      setGroups(res.data.data.groups || []);
      if (res.data.data.meta_data) {
        updateMeta(res.data.data.meta_data);
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [page, limit, debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(GROUPS.DELETE(deleteId));
      toast.success('Group deleted successfully');
      setDeleteId(null);
      fetchGroups();
    } catch (error) {
      handleApiError(error);
    }
  };

  const columns: Column<UserGroup>[] = [
    { 
      key: 'name', 
      header: 'Group Name',
      render: (group) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{group.name}</span>
        </div>
      )
    },
    { key: 'slug', header: 'Slug', className: 'font-mono text-xs' },
    { 
      key: 'users', 
      header: 'Members',
      render: (group) => (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Users className="h-3.5 w-3.5" />
          {group.users?.length || 0} Members
        </span>
      )
    },
    { 
      key: 'roles', 
      header: 'Roles',
      render: (group) => (
        <div className="flex flex-wrap gap-1">
          {group.roles?.map(role => (
            <span key={role._id} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
              {role.name}
            </span>
          )) || <span className="text-xs text-muted-foreground italic">No roles</span>}
        </div>
      )
    },
    { 
      key: 'is_active', 
      header: 'Status',
      render: (group) => (
        <StatusBadge status={group.is_active ? 'success' : 'error'} label={group.is_active ? 'Active' : 'Inactive'} />
      )
    },
    {
      key: '_id',
      header: 'Actions',
      className: 'text-right',
      render: (group) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/groups/${group._id}`)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setDeleteId(group._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">User Groups</h1>
        </div>
        <Button onClick={() => navigate('/groups/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search groups by name or slug..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchGroups} title="Refresh">
          <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={groups}
        isLoading={isLoading}
        meta={meta}
        onPageChange={goToPage}
        onLimitChange={changeLimit}
        emptyMessage={search ? `No groups matching "${search}"` : 'No groups created yet'}
        emptyIcon={<UserPlus className="h-6 w-6 text-muted-foreground/50" />}
        emptyAction={
          !search ? (
            <Button size="sm" variant="outline" onClick={() => navigate('/groups/create')}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Create your first group
            </Button>
          ) : undefined
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Group"
        message="Are you sure you want to delete this group? This will remove all group-assigned roles from its members."
        confirmLabel="Delete Group"
        variant="danger"
      />
    </div>
  );
}
