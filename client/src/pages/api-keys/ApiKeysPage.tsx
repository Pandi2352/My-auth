import { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import api from '@/lib/api/client';
import { API_KEYS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { ApiKey, PaginatedResponse } from '@/types';

export default function ApiKeysPage() {
  useDocumentTitle('API Keys');
  
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // New Key State
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<ApiKey>>(API_KEYS.LIST);
      setKeys(res.data.data);
    } catch (error) {
      handleApiError(error, 'Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(API_KEYS.CREATE, { name: newKeyName });
      setCreatedKey(res.data.key); // The actual secret key usually returned only once
      toast.success('API key generated successfully');
      fetchKeys();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    try {
      await api.patch(API_KEYS.REVOKE(id));
      toast.success('API key revoked');
      fetchKeys();
    } catch (error) {
      handleApiError(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const columns: Column<ApiKey>[] = [
    {
      key: 'name',
      header: 'Key Name',
      render: (key) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
            <KeyRound className="h-4 w-4 text-amber-600" />
          </div>
          <span className="font-medium text-foreground">{key.name}</span>
        </div>
      )
    },
    {
      key: 'key_prefix',
      header: 'Key',
      render: (key) => (
        <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
          {key.prefix}****************
        </code>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (key) => (
        <span className="text-sm text-muted-foreground">
          {new Date(key.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'last_used_at',
      header: 'Last Used',
      render: (key) => (
        <span className="text-sm text-muted-foreground italic">
          {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (key) => (
        <Button 
          variant="ghost" 
          size="icon" 
          title="Revoke Key"
          onClick={() => handleRevoke(key._id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-sm text-muted-foreground">Manage keys for programmatic access to the API</p>
        </div>
        <Button onClick={() => {
          setCreatedKey(null);
          setNewKeyName('');
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Key
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <ShieldAlert className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Security Recommendation</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  Never share your API keys or commit them to version control. If a key is compromised, revoke it immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Keys</CardTitle>
            <CardDescription>Your personal access tokens for API authorization</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={keys}
              isLoading={isLoading}
              emptyMessage="You don't have any API keys yet."
              emptyIcon={<KeyRound className="h-6 w-6 text-muted-foreground/50" />}
              emptyAction={
                <Button size="sm" variant="outline" onClick={() => { setCreatedKey(null); setNewKeyName(''); setIsModalOpen(true); }}>
                  <Plus className="mr-2 h-3.5 w-3.5" /> Generate your first key
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      >
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          {createdKey ? 'API Key Generated' : 'Create New API Key'}
        </ModalHeader>
        
        {createdKey ? (
          <div className="space-y-4">
            <ModalBody>
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 space-y-2">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                  <ShieldAlert className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wider">Warning</p>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Copy this key now. For your security, it will not be shown again.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Secret Key</label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={createdKey} 
                    className="font-mono text-xs bg-muted"
                  />
                  <Button onClick={() => copyToClipboard(createdKey)} className="shrink-0">
                    {copiedKey === createdKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setIsModalOpen(false)}>I have saved the key</Button>
            </ModalFooter>
          </div>
        ) : (
          <form onSubmit={handleCreate}>
            <ModalBody className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Key Name</label>
                <Input 
                  placeholder="e.g., Development environment"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-[10px] text-muted-foreground italic">Use a descriptive name to remember where this key is used.</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={isSubmitting}>
                Generate Key
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </div>
  );
}
