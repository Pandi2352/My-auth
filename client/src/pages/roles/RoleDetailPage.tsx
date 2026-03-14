import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  Shield, 
  Check, 
  Search,
  LayoutGrid,
  Info
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/PageLoader';
import api from '@/lib/api/client';
import { ROLES, PERMISSIONS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { Role, Permission } from '@/types';

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== 'create';
  
  useDocumentTitle(isEdit ? 'Edit Role' : 'Create Role');
  const navigate = useNavigate();

  const [role, setRole] = useState<Partial<Role>>({
    name: '',
    slug: '',
    description: '',
    permissions: [],
    is_default: false
  });
  
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [permRes, roleRes] = await Promise.all([
        api.get(PERMISSIONS.LIST),
        isEdit ? api.get(ROLES.GET(id!)) : Promise.resolve({ data: { data: role } })
      ]);
      
      setAllPermissions(permRes.data.data);
      if (isEdit) {
        setRole(roleRes.data.data);
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch data');
      navigate('/roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const togglePermission = (perm: Permission) => {
    const currentPerms = [...(role.permissions || [])];
    const index = currentPerms.findIndex(p => p._id === perm._id);
    
    if (index > -1) {
      currentPerms.splice(index, 1);
    } else {
      currentPerms.push(perm);
    }
    
    setRole({ ...role, permissions: currentPerms });
  };

  const toggleAllInModule = (module: string, checked: boolean) => {
    const currentPerms = [...(role.permissions || [])];
    const modulePerms = allPermissions.filter(p => p.module === module);
    
    modulePerms.forEach(perm => {
      const idx = currentPerms.findIndex(p => p._id === perm._id);
      if (checked && idx === -1) {
        currentPerms.push(perm);
      } else if (!checked && idx > -1) {
        currentPerms.splice(idx, 1);
      }
    });
    
    setRole({ ...role, permissions: currentPerms });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.name || !role.slug) {
      return toast.error('Name and Slug are required');
    }

    setIsSaving(true);
    try {
      const payload = {
        ...role,
        permissions: role.permissions?.map(p => p._id) // Backend usually expects IDs
      };

      if (isEdit) {
        await api.patch(ROLES.UPDATE(id!), payload);
        toast.success('Role updated successfully');
      } else {
        await api.post(ROLES.CREATE, payload);
        toast.success('Role created successfully');
        navigate('/roles');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageLoader />;

  // Group permissions by module
  const groupedPermissions: Record<string, Permission[]> = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const filteredModules = Object.entries(groupedPermissions).filter(([module, perms]) => 
    module.toLowerCase().includes(search.toLowerCase()) ||
    perms.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/roles')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {isEdit ? `Edit Role: ${role.name}` : 'Create New Role'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-3">
        {/* Basic Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Role Details</CardTitle>
              <CardDescription>Define the core identity of this role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input 
                  placeholder="e.g. Moderator" 
                  value={role.name}
                  onChange={e => setRole({ ...role, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input 
                  placeholder="e.g. moderator" 
                  value={role.slug}
                  onChange={e => setRole({ ...role, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="mt-1"
                  disabled={role.is_system}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={role.description}
                  onChange={e => setRole({ ...role, description: e.target.value })}
                  placeholder="What can this role do?"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium pt-2">
                <input 
                  type="checkbox" 
                  checked={role.is_default}
                  onChange={e => setRole({ ...role, is_default: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Set as default role for new users
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Selected Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p className="flex justify-between py-1">
                  <span>Total Modules:</span>
                  <span className="font-bold text-foreground">{Object.keys(groupedPermissions).length}</span>
                </p>
                <p className="flex justify-between py-1 text-primary font-medium">
                  <span>Selected Permissions:</span>
                  <span className="font-bold">{role.permissions?.length || 0} / {allPermissions.length}</span>
                </p>
              </div>
              <Button type="submit" className="w-full mt-6" isLoading={isSaving}>
                {isEdit ? 'Save Changes' : 'Create Role'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Editor */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Permissions Matrix</CardTitle>
                <CardDescription>Assign module-specific actions to this role</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search permissions..." 
                  className="pl-9 h-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {filteredModules.map(([module, perms]) => {
                const selectedInModule = perms.filter(p => role.permissions?.some(rp => rp._id === p._id));
                const allSelected = selectedInModule.length === perms.length;
                
                return (
                  <div key={module} className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-primary" />
                        <span className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                          {module}
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={allSelected}
                          onChange={e => toggleAllInModule(module, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Select All
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
                      {perms.map(perm => {
                        const isChecked = role.permissions?.some(p => p._id === perm._id);
                        return (
                          <label 
                            key={perm._id} 
                            className={`flex items-center gap-3 p-2 rounded-md border transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-primary/5 border-primary/20 text-primary' 
                                : 'bg-background border-border hover:bg-muted font-medium'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => togglePermission(perm)}
                              className="sr-only"
                            />
                            <div className={`h-4 w-4 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-primary border-primary' : 'bg-background border-gray-300'
                            }`}>
                              {isChecked && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-xs capitalize">{perm.action}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredModules.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Info className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">No permissions found matching your search.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
