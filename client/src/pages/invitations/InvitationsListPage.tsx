import { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import api from '@/lib/api/client';
import { INVITATIONS, ROLES } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { Invitation, Role } from '@/types';

export default function InvitationsListPage() {
  useDocumentTitle('Invitations');
  
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { meta, page, limit, goToPage, changeLimit, updateMeta } = usePagination();

  // Create Invitation State
  const [newInvite, setNewInvite] = useState({
    email: '',
    role_id: ''
  });

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
      };
      const res = await api.get(INVITATIONS.LIST, { params });
      const resData = res.data.data;
      setInvitations(resData.invitations || []);
      if (resData.meta_data) {
        updateMeta(resData.meta_data);
      }

      // Fetch roles for the creation dropdown
      const rolesRes = await api.get(ROLES.LIST);
      setRoles(rolesRes.data.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch invitations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [page, limit, debouncedSearch]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvite.email || !newInvite.role_id) {
      return toast.error('Please fill in all fields');
    }

    setIsSubmitting(true);
    try {
      await api.post(INVITATIONS.CREATE, newInvite);
      toast.success('Invitation sent successfully');
      setIsModalOpen(false);
      setNewInvite({ email: '', role_id: '' });
      fetchInvitations();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await api.post(INVITATIONS.RESEND(id));
      toast.success('Invitation resent');
      fetchInvitations();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      await api.delete(INVITATIONS.REVOKE(id));
      toast.success('Invitation revoked');
      fetchInvitations();
    } catch (error) {
      handleApiError(error);
    }
  };

  const getStatus = (invite: Invitation) => {
    if (invite.is_revoked) return { label: 'Revoked', status: 'error' as const };
    if (invite.accepted_at) return { label: 'Accepted', status: 'success' as const };
    if (new Date(invite.expires_at) < new Date()) return { label: 'Expired', status: 'warning' as const };
    return { label: 'Pending', status: 'info' as const };
  };

  const columns: Column<Invitation>[] = [
    {
      key: 'email',
      header: 'Invitee',
      render: (invite) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{invite.email}</span>
            <span className="text-xs text-muted-foreground">
              Invited by {invite.invited_by?.firstName || 'Admin'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'role_id',
      header: 'Role',
      render: (invite) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
          {invite.role_id?.name || 'User'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Sent Date',
      render: (invite) => (
        <span className="text-sm text-muted-foreground">
          {new Date(invite.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (invite) => {
        const { label, status } = getStatus(invite);
        return <StatusBadge status={status} label={label} />;
      }
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (invite) => (
        <div className="flex justify-end gap-2">
          {!invite.accepted_at && !invite.is_revoked && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Resend Invitation"
                onClick={() => handleResend(invite._id)}
              >
                <RotateCcw className="h-4 w-4 text-blue-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Revoke Invitation"
                onClick={() => handleRevoke(invite._id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invitations</h1>
          <p className="text-sm text-muted-foreground">Manage and send invitations to new users</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Send Invitation
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{invitations.filter(i => !i.accepted_at && !i.is_revoked).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{invitations.filter(i => i.accepted_at).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revoked</p>
                <p className="text-2xl font-bold">{invitations.filter(i => i.is_revoked).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{invitations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-lg">Invitation History</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 w-[250px]"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={invitations}
            isLoading={isLoading}
            emptyMessage="No invitations sent yet."
            meta={meta}
            onPageChange={goToPage}
            onLimitChange={changeLimit}
          />
        </CardContent>
      </Card>

      {/* Send Invitation Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      >
        <ModalHeader onClose={() => setIsModalOpen(false)}>Send New Invitation</ModalHeader>
        <form onSubmit={handleCreateInvite}>
          <ModalBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground outline-none">Email Address</label>
              <Input 
                type="email" 
                placeholder="invitee@example.com"
                value={newInvite.email}
                onChange={e => setNewInvite({ ...newInvite, email: e.target.value })}
                required
              />
              <p className="text-[10px] text-muted-foreground italic">New users will receive an email with a secure registration link.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground outline-none">Assigned Role</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newInvite.role_id}
                onChange={e => setNewInvite({ ...newInvite, role_id: e.target.value })}
                required
              >
                <option value="">Select a role...</option>
                {roles.map(role => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>
              Send Invitation
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
