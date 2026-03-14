import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Monitor,
  Smartphone,
  Globe,
  Trash2,
  RefreshCcw,
  LogOut,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import api from '@/lib/api/client';
import { SESSIONS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { Session } from '@/types';

export default function SessionsListPage() {
  useDocumentTitle('Sessions');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [terminateId, setTerminateId] = useState<string | null>(null);
  const [terminateAll, setTerminateAll] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(SESSIONS.LIST);
      setSessions(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      handleApiError(error, 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTerminate = async () => {
    if (!terminateId) return;
    try {
      await api.delete(SESSIONS.TERMINATE(terminateId));
      toast.success('Session terminated');
      setTerminateId(null);
      fetchSessions();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleTerminateAll = async () => {
    try {
      await api.delete(SESSIONS.TERMINATE_ALL);
      toast.success('All other sessions terminated');
      setTerminateAll(false);
      fetchSessions();
    } catch (error) {
      handleApiError(error);
    }
  };

  const getDeviceIcon = (device: string) => {
    const d = device?.toLowerCase() || '';
    if (d.includes('mobile') || d.includes('phone') || d.includes('android') || d.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const activeSessions = sessions.filter(s => s.is_active);

  const columns: Column<Session>[] = [
    {
      key: 'device',
      header: 'Device',
      render: (session) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {getDeviceIcon(session.device)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground text-sm">{session.device || 'Unknown Device'}</span>
            <span className="text-xs text-muted-foreground">{session.browser} / {session.os}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (session) => (
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-xs">{session.ip_address}</span>
          {session.location && (
            <span className="text-xs text-muted-foreground">({session.location})</span>
          )}
        </div>
      ),
    },
    {
      key: 'last_activity',
      header: 'Last Active',
      render: (session) => (
        <span className="text-sm text-muted-foreground">
          {new Date(session.last_activity).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (session) => (
        <StatusBadge
          status={session.is_active ? 'success' : 'warning'}
          label={session.is_active ? 'Active' : 'Expired'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (session) =>
        session.is_active ? (
          <Button
            variant="ghost"
            size="icon"
            title="Terminate Session"
            onClick={() => setTerminateId(session._id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Manage your active sessions across devices
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchSessions} title="Refresh">
            <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
          </Button>
          {activeSessions.length > 1 && (
            <Button variant="danger" onClick={() => setTerminateAll(true)}>
              <LogOut className="mr-2 h-4 w-4" />
              Terminate All Others
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center">
                <Globe className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>All sessions associated with your account</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={sessions}
            isLoading={isLoading}
            emptyMessage="No sessions found."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!terminateId}
        onClose={() => setTerminateId(null)}
        onConfirm={handleTerminate}
        title="Terminate Session"
        message="Are you sure you want to terminate this session? The device will be logged out."
        confirmLabel="Terminate"
        variant="danger"
      />

      <ConfirmDialog
        open={terminateAll}
        onClose={() => setTerminateAll(false)}
        onConfirm={handleTerminateAll}
        title="Terminate All Other Sessions"
        message="This will log out all devices except your current one. Continue?"
        confirmLabel="Terminate All"
        variant="danger"
      />
    </div>
  );
}
