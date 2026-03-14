import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Eye,
  User,
  Activity,
  Calendar,
  Layers,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import api from '@/lib/api/client';
import { AUDIT } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { AuditLog } from '@/types';

export default function AuditLogsPage() {
  useDocumentTitle('Audit Logs');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { meta, page, limit, goToPage, changeLimit, updateMeta } = usePagination();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
      };
      const res = await api.get(AUDIT.LIST, { params });
      const resData = res.data.data;
      setLogs(resData.items || []);
      if (resData.meta_data) {
        updateMeta(resData.meta_data);
      }
    } catch (error) {
      handleApiError(error, 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, debouncedSearch]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const endpoint = format === 'json' ? AUDIT.EXPORT_JSON : AUDIT.EXPORT_CSV;
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString()}.${format}`);
      document.body.appendChild(link);
      link.click();
      toast.success(`Audit logs exported as ${format.toUpperCase()}`);
    } catch (error) {
      handleApiError(error, 'Export failed');
    }
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-600 bg-green-50';
    if (code >= 400 && code < 500) return 'text-amber-600 bg-amber-50';
    if (code >= 500) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'user_email',
      header: 'User',
      render: (log) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{log.user_email}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{log.user_id}</span>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <span className="text-sm font-semibold capitalize text-primary">
          {log.action.replace(/:/g, ' ')}
        </span>
      )
    },
    {
      key: 'method',
      header: 'Activity',
      render: (log) => (
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(log.status_code)}`}>
              {log.method}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={log.endpoint}>
              {log.endpoint}
            </span>
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (log) => (
        <span className="text-xs text-muted-foreground">
          {new Date(log.created_at).toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (log) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedLog(log);
            setIsModalOpen(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Detailed record of system activities and security events</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
           </Button>
           <Button variant="outline" onClick={() => handleExport('json')}>
              <Download className="mr-2 h-4 w-4" /> Export JSON
           </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle>System Activity</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 w-[250px]"
                placeholder="Search by email or action..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
            isLoading={isLoading}
            emptyMessage="No activity logs found."
            meta={meta}
            onPageChange={goToPage}
            onLimitChange={changeLimit}
          />
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <ModalHeader onClose={() => setIsModalOpen(false)}>Activity Details</ModalHeader>
        <ModalBody className="space-y-6">
          {selectedLog && (
            <>
              <div className="grid grid-cols-2 gap-4">
                 <DetailItem icon={<User className="h-4 w-4" />} label="User Email" value={selectedLog.user_email} />
                 <DetailItem icon={<Calendar className="h-4 w-4" />} label="Timestamp" value={new Date(selectedLog.created_at).toLocaleString()} />
                 <DetailItem icon={<Activity className="h-4 w-4" />} label="Action" value={selectedLog.action} />
                 <DetailItem icon={<Layers className="h-4 w-4" />} label="Target Type" value={selectedLog.target_type} />
                 <DetailItem icon={<Globe className="h-4 w-4" />} label="IP Address" value={selectedLog.ip_address} />
                 <DetailItem icon={<Activity className="h-4 w-4" />} label="Status" value={`${selectedLog.status_code} - ${selectedLog.method}`} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Endpoint</label>
                 <code className="block p-3 rounded-md bg-muted font-mono text-xs break-all">
                    {selectedLog.endpoint}
                 </code>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">User Agent</label>
                 <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{selectedLog.user_agent}</p>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
