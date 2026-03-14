import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCcw,
  LayoutGrid,
  Zap
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/lib/api/client';
import { PERMISSIONS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { Permission } from '@/types';

export default function PermissionsListPage() {
  useDocumentTitle('System Permissions');
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(PERMISSIONS.LIST);
      setPermissions(res.data.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filteredPermissions = permissions.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase()) ||
    p.module.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Permission>[] = [
    { 
      key: 'module', 
      header: 'Module',
      render: (p) => (
        <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {p.module}
        </span>
      )
    },
    { 
      key: 'name', 
      header: 'Permission Name',
      className: 'font-medium text-foreground' 
    },
    { 
      key: 'slug', 
      header: 'Slug', 
      className: 'font-mono text-xs text-primary' 
    },
    { 
      key: 'action', 
      header: 'Action',
      render: (p) => (
        <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded-full ${
          p.action === 'read' ? 'bg-blue-100 text-blue-700' :
          p.action === 'create' ? 'bg-green-100 text-green-700' :
          p.action === 'update' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {p.action}
        </span>
      )
    },
    { key: 'description' as any, header: 'Description', className: 'text-muted-foreground' }
  ];

  // Group by module for stats
  const moduleStats = permissions.reduce((acc, p) => {
    acc[p.module] = (acc[p.module] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Permissions Inventory</h1>
        </div>
        <div className="flex gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border">
          <span className="font-bold text-foreground">{permissions.length}</span> System Permissions
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Modules</p>
                <p className="text-2xl font-bold">{Object.keys(moduleStats).length}</p>
              </div>
              <LayoutGrid className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Active Gates</p>
                <p className="text-2xl font-bold text-green-600">Enabled</p>
              </div>
              <Zap className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search permissions by name, slug or module..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchPermissions} title="Refresh">
          <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredPermissions}
        isLoading={isLoading}
        emptyMessage={search ? `No permissions matching "${search}"` : 'No permissions found'}
        emptyIcon={<ShieldCheck className="h-6 w-6 text-muted-foreground/50" />}
      />
    </div>
  );
}
