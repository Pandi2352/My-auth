import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Lock,
  Star,
  RefreshCcw 
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import api from '@/lib/api/client';
import { ROLES } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { Role } from '@/types';

export default function RolesListPage() {
  useDocumentTitle('Role Management');
  const navigate = useNavigate();

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(ROLES.LIST);
      // Assuming res.data.data is the array of roles
      setRoles(res.data.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(ROLES.DELETE(deleteId));
      toast.success('Role deleted successfully');
      setDeleteId(null);
      fetchRoles();
    } catch (error) {
      handleApiError(error);
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    role.slug.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Role>[] = [
    { 
      key: 'name', 
      header: 'Role Name',
      render: (role) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{role.name}</span>
          {role.is_system && <Lock className="h-3 w-3 text-muted-foreground" />}
          {role.is_default && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
        </div>
      )
    },
    { key: 'slug', header: 'Slug', className: 'font-mono text-xs' },
    { 
      key: 'permissions', 
      header: 'Permissions',
      render: (role) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {role.permissions?.length || 0} Permissions
        </span>
      )
    },
    { 
      key: 'created_at', 
      header: 'Created On',
      render: (role) => new Date(role.created_at).toLocaleDateString()
    },
    {
      key: '_id',
      header: 'Actions',
      className: 'text-right',
      render: (role) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/roles/${role._id}`)}
            title="Edit Role"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          {!role.is_system && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setDeleteId(role._id)}
              title="Delete Role"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
        </div>
        <Button onClick={() => navigate('/roles/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search roles by name or slug..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchRoles} title="Refresh">
          <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredRoles}
        isLoading={isLoading}
        emptyMessage={search ? `No roles matching "${search}"` : 'No roles created yet'}
        emptyIcon={<Shield className="h-6 w-6 text-muted-foreground/50" />}
        emptyAction={
          !search ? (
            <Button size="sm" variant="outline" onClick={() => navigate('/roles/create')}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Create your first role
            </Button>
          ) : undefined
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role? This will remove permissions from all users assigned to this role."
        confirmLabel="Delete Role"
        variant="danger"
      />
    </div>
  );
}
