import { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import api from '@/lib/api/client';
import { ROLES } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import { cn } from '@/lib/utils/cn';

interface Permission {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

interface Role {
  _id: string;
  name: string;
  slug: string;
  permissions: string[];
  is_system: boolean;
}

export default function PermissionMatrixPage() {
  useDocumentTitle('Permission Matrix');

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  // Local state for grid changes
  const [grid, setGrid] = useState<Record<string, Set<string>>>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(ROLES.MATRIX);
      const data = res.data.data;
      setRoles(data.roles);
      setPermissions(data.permissions);

      // Initialize grid state
      const initialGrid: Record<string, Set<string>> = {};
      data.roles.forEach((role: Role) => {
        initialGrid[role._id] = new Set(role.permissions);
      });
      setGrid(initialGrid);
    } catch (error) {
      handleApiError(error, 'Failed to load permission matrix');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group permissions by prefix (e.g. "user:read" -> "user")
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    const filtered = permissions.filter(p => 
      p.slug.toLowerCase().includes(search.toLowerCase()) || 
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    filtered.forEach(p => {
      const prefix = p.slug.split(':')[0] || 'other';
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(p);
    });

    return groups;
  }, [permissions, search]);

  const togglePermission = (roleId: string, permissionId: string) => {
    setGrid(prev => {
      const next = { ...prev };
      const rolePerms = new Set(next[roleId]);
      if (rolePerms.has(permissionId)) {
        rolePerms.delete(permissionId);
      } else {
        rolePerms.add(permissionId);
      }
      next[roleId] = rolePerms;
      return next;
    });
  };

  const hasChanges = useMemo(() => {
    return roles.some(role => {
      const current = grid[role._id];
      if (!current) return false;
      const original = new Set(role.permissions);
      if (current.size !== original.size) return true;
      for (const id of Array.from(current)) {
        if (!original.has(id)) return true;
      }
      return false;
    });
  }, [roles, grid]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const changes = roles.map(role => ({
        role_id: role._id,
        permission_ids: Array.from(grid[role._id] || []),
      }));

      await api.post(ROLES.SYNC_MATRIX, { changes });
      toast.success('Permissions synchronized successfully');
      fetchData(); // Refresh to clear state
    } catch (error) {
      handleApiError(error, 'Synchronization failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
         <Orbit className="h-10 w-10 animate-spin text-primary/40" />
         <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Permission Infrastructure...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-xl font-bold tracking-tight text-slate-900">Permission Matrix</h1>
           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-0.5">High-Precision RBAC Orchestrator</p>
        </div>
        <div className="flex items-center gap-2">
           {hasChanges && (
             <Button variant="ghost" size="sm" onClick={fetchData} className="text-[10px] font-bold uppercase gap-2 h-8 text-slate-500">
                <RotateCcw className="h-3.5 w-3.5" /> Discard
             </Button>
           )}
           <Button 
             onClick={handleSave} 
             disabled={!hasChanges || isSaving}
             size="sm"
             className="h-8 gap-2 text-[10px] font-bold uppercase tracking-widest min-w-[120px]"
           >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Synchronizing...' : 'Commit Changes'}
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-none bg-transparent overflow-hidden">
        <CardHeader className="p-0 pb-4 bg-transparent">
           <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="PROBE PERMISSIONS (e.g. user:read)" 
                className="pl-9 h-9 bg-white border-slate-200 text-[11px] font-bold placeholder:text-slate-300 focus-visible:ring-slate-100"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="bg-slate-50/80 divide-x divide-slate-200">
                       <th className="sticky left-0 z-20 bg-slate-100/90 backdrop-blur-sm p-4 text-left border-b border-slate-200 min-w-[180px]">
                          <div className="flex items-center gap-2">
                             <Shield className="h-4 w-4 text-slate-600" />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Infrastructure Matrix</span>
                          </div>
                       </th>
                       {Object.keys(groupedPermissions).map(group => (
                         <th key={group} colSpan={groupedPermissions[group].length} className="px-4 py-2 text-center border-b border-slate-200 bg-slate-50/50">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-center gap-1.5">
                               <Layers className="h-3 w-3" /> {group}
                            </span>
                         </th>
                       ))}
                    </tr>
                    <tr className="bg-slate-50/50 divide-x divide-slate-100">
                       <th className="sticky left-0 z-10 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 p-3 border-b border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                          System Roles
                       </th>
                       {Object.keys(groupedPermissions).map(group => (
                         groupedPermissions[group].map(p => (
                           <th key={p._id} className="p-2 border-b border-slate-200 min-w-[120px] max-w-[120px] transition-colors hover:bg-slate-100/50 group">
                              <div className="flex flex-col items-center gap-1 group-hover:scale-105 transition-transform">
                                 <span className="text-[9px] font-bold text-slate-700 uppercase leading-none break-all text-center h-4">{p.slug.split(':')[1] || p.slug}</span>
                                 <div className="h-1 w-4 bg-slate-200 rounded-full" title={p.description} />
                              </div>
                           </th>
                         ))
                       ))}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {roles.map((role) => (
                      <tr key={role._id} className="group hover:bg-slate-50/80 transition-colors divide-x divide-slate-100">
                         <td className="sticky left-0 z-10 bg-white p-4 font-bold border-r border-slate-100 group-hover:bg-slate-50 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2">
                               <div className="flex flex-col">
                                  <span className="text-[11px] text-slate-900 uppercase tracking-tight">{role.name}</span>
                                  <span className="text-[9px] text-slate-400 uppercase tracking-widest">{role.slug}</span>
                               </div>
                               {role.is_system && <Lock className="h-3 w-3 text-slate-300" />}
                            </div>
                         </td>
                         {Object.keys(groupedPermissions).map(group => (
                           groupedPermissions[group].map(p => {
                             const isChecked = grid[role._id]?.has(p._id);
                             const isOriginal = role.permissions.includes(p._id);
                             const isModified = isChecked !== isOriginal;
                             
                             return (
                               <td key={`${role._id}-${p._id}`} className={cn(
                                 "p-0 transition-all duration-200",
                                 isModified ? "bg-amber-50/30" : "hover:bg-slate-100/50"
                               )}>
                                  <div 
                                    className="h-12 w-full flex items-center justify-center cursor-pointer group/cell"
                                    onClick={() => togglePermission(role._id, p._id)}
                                  >
                                     <div className={cn(
                                       "h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-300",
                                       isChecked 
                                         ? "bg-primary border-primary shadow-[0_2px_8px_rgba(var(--primary-rgb),0.3)] scale-110" 
                                         : "border-slate-200 bg-white group-hover/cell:border-slate-300",
                                       isModified && "border-amber-400 group-hover/cell:border-amber-500"
                                     )}>
                                        {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-white animate-in zoom-in-50 duration-300" />}
                                     </div>
                                  </div>
                               </td>
                             );
                           })
                         ))}
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Authorized Node</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm border-2 border-amber-400 bg-amber-50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Staged Change</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Core Protected</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-full border border-slate-200">
                 <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                 <span className="text-[10px] font-bold uppercase text-slate-500">Commit changes to persist the ledger state</span>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Orbit({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M3 8a9 9 0 0 0 0 8" />
      <path d="M21 8a9 9 0 0 1 0 8" />
      <path d="M12 3a9 9 0 0 0-8 5" />
      <path d="M12 3a9 9 0 0 1 8 5" />
      <path d="M12 21a9 9 0 0 0-8-5" />
      <path d="M12 21a9 9 0 0 1 8-5" />
    </svg>
  );
}
