import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Link2,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCcw,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import api from '@/lib/api/client';
import { CONNECTORS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { SocialConnector } from '@/types';

// ── Provider metadata ───────────────────────────────────────
const PROVIDERS = [
  { value: 'google', label: 'Google', color: 'bg-red-100 text-red-700' },
  { value: 'github', label: 'GitHub', color: 'bg-gray-100 text-gray-700' },
  { value: 'microsoft', label: 'Microsoft', color: 'bg-blue-100 text-blue-700' },
  { value: 'facebook', label: 'Facebook', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'apple', label: 'Apple', color: 'bg-gray-100 text-gray-900' },
  { value: 'twitter', label: 'Twitter', color: 'bg-sky-100 text-sky-700' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-100 text-blue-800' },
  { value: 'custom', label: 'Custom', color: 'bg-purple-100 text-purple-700' },
];

function getProviderMeta(provider: string) {
  return PROVIDERS.find((p) => p.value === provider) || PROVIDERS[PROVIDERS.length - 1];
}

// ── Default scopes per provider ─────────────────────────────
const DEFAULT_SCOPES: Record<string, string> = {
  google: 'email, profile',
  github: 'user:email, read:user',
  facebook: 'email, public_profile',
  microsoft: 'openid, email, profile, User.Read',
  linkedin: 'openid, profile, email',
  twitter: 'tweet.read, users.read',
  apple: 'name, email',
};

// ── Form state ──────────────────────────────────────────────
interface ConnectorFormState {
  provider: string;
  display_name: string;
  client_id: string;
  client_secret: string;
  scopes: string;
  is_enabled: boolean;
  sort_order: number;
  icon_url: string;
  authorize_url: string;
  token_url: string;
  profile_url: string;
  callback_url: string;
}

const emptyForm: ConnectorFormState = {
  provider: '',
  display_name: '',
  client_id: '',
  client_secret: '',
  scopes: '',
  is_enabled: true,
  sort_order: 0,
  icon_url: '',
  authorize_url: '',
  token_url: '',
  profile_url: '',
  callback_url: '',
};

export default function ConnectorsListPage() {
  useDocumentTitle('Social Connectors');

  const [connectors, setConnectors] = useState<SocialConnector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ConnectorFormState>(emptyForm);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchConnectors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(CONNECTORS.LIST);
      setConnectors(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      handleApiError(error, 'Failed to fetch connectors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowAdvanced(false);
    setIsModalOpen(true);
  };

  const openEdit = (connector: SocialConnector) => {
    setEditId(connector._id);
    setForm({
      provider: connector.provider,
      display_name: connector.display_name,
      client_id: connector.client_id,
      client_secret: '',
      scopes: connector.scopes?.join(', ') || '',
      is_enabled: connector.is_enabled,
      sort_order: connector.sort_order ?? 0,
      icon_url: connector.icon_url || '',
      authorize_url: connector.authorize_url || '',
      token_url: connector.token_url || '',
      profile_url: connector.profile_url || '',
      callback_url: connector.callback_url || '',
    });
    setShowAdvanced(
      !!(connector.authorize_url || connector.token_url || connector.profile_url || connector.callback_url || connector.icon_url),
    );
    setIsModalOpen(true);
  };

  const handleProviderChange = (provider: string) => {
    const scopes = DEFAULT_SCOPES[provider] || '';
    const label = PROVIDERS.find((p) => p.value === provider)?.label || provider;
    setForm((prev) => ({
      ...prev,
      provider,
      display_name: prev.display_name || label,
      scopes: prev.scopes || scopes,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: Record<string, any> = {
      provider: form.provider,
      display_name: form.display_name,
      client_id: form.client_id,
      scopes: form.scopes.split(',').map((s) => s.trim()).filter(Boolean),
      is_enabled: form.is_enabled,
      sort_order: form.sort_order,
    };

    // client_secret: always send on create, only send on edit if changed
    if (editId) {
      if (form.client_secret) payload.client_secret = form.client_secret;
    } else {
      payload.client_secret = form.client_secret;
    }

    if (form.icon_url) payload.icon_url = form.icon_url;
    if (form.authorize_url) payload.authorize_url = form.authorize_url;
    if (form.token_url) payload.token_url = form.token_url;
    if (form.profile_url) payload.profile_url = form.profile_url;
    if (form.callback_url) payload.callback_url = form.callback_url;

    try {
      if (editId) {
        await api.patch(CONNECTORS.UPDATE(editId), payload);
        toast.success('Connector updated');
      } else {
        await api.post(CONNECTORS.CREATE, payload);
        toast.success('Connector created');
      }
      setIsModalOpen(false);
      fetchConnectors();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(CONNECTORS.TOGGLE(id));
      toast.success('Status toggled');
      fetchConnectors();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(CONNECTORS.DELETE(deleteId));
      toast.success('Connector deleted');
      setDeleteId(null);
      fetchConnectors();
    } catch (error) {
      handleApiError(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const updateField = <K extends keyof ConnectorFormState>(key: K, value: ConnectorFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const enabledCount = connectors.filter((c) => c.is_enabled).length;

  const columns: Column<SocialConnector>[] = [
    {
      key: 'provider',
      header: 'Provider',
      render: (c) => {
        const meta = getProviderMeta(c.provider);
        return (
          <div className="flex items-center gap-3">
            {c.icon_url ? (
              <img src={c.icon_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${meta.color}`}>
                {meta.label[0]}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{c.display_name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit ${meta.color}`}>
                {c.provider}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'client_id',
      header: 'Client ID',
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs truncate max-w-[140px]">
            {c.client_id}
          </code>
          <button
            onClick={() => copyToClipboard(c.client_id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ),
    },
    {
      key: 'scopes',
      header: 'Scopes',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.scopes?.slice(0, 3).map((scope) => (
            <span
              key={scope}
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              {scope}
            </span>
          ))}
          {(c.scopes?.length || 0) > 3 && (
            <span className="text-[10px] text-muted-foreground">+{c.scopes.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      key: 'sort_order',
      header: 'Order',
      render: (c) => <span className="font-mono text-xs text-muted-foreground">{c.sort_order}</span>,
    },
    {
      key: 'is_enabled',
      header: 'Status',
      render: (c) => (
        <StatusBadge
          status={c.is_enabled ? 'success' : 'error'}
          label={c.is_enabled ? 'Enabled' : 'Disabled'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={c.is_enabled ? 'Disable' : 'Enable'}
            onClick={() => handleToggle(c._id)}
          >
            {c.is_enabled ? (
              <ToggleRight className="h-4 w-4 text-green-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setDeleteId(c._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Connectors</h1>
          <p className="text-sm text-muted-foreground">
            Configure OAuth providers for social login
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchConnectors} title="Refresh">
            <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Connector
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Providers</p>
                <p className="text-2xl font-bold">{connectors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <ToggleRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enabled</p>
                <p className="text-2xl font-bold">{enabledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <ToggleLeft className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disabled</p>
                <p className="text-2xl font-bold">{connectors.length - enabledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Providers</CardTitle>
          <CardDescription>OAuth providers available for user authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={connectors}
            isLoading={isLoading}
            emptyMessage="No connectors configured yet."
          />
        </CardContent>
      </Card>

      {/* ── Create / Edit Modal ─────────────────────────────── */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          {editId ? 'Edit Connector' : 'Add Social Connector'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Provider */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Provider</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                disabled={!!editId}
                required
              >
                <option value="">Select a provider...</option>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Display Name</label>
              <Input
                placeholder="e.g., Sign in with Google"
                value={form.display_name}
                onChange={(e) => updateField('display_name', e.target.value)}
                required
              />
            </div>

            {/* Client ID + Secret */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Client ID</label>
                <Input
                  placeholder="OAuth Client ID"
                  value={form.client_id}
                  onChange={(e) => updateField('client_id', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Client Secret
                  {editId && <span className="text-muted-foreground ml-1">(blank = keep current)</span>}
                </label>
                <Input
                  type="password"
                  placeholder="OAuth Client Secret"
                  value={form.client_secret}
                  onChange={(e) => updateField('client_secret', e.target.value)}
                  required={!editId}
                />
              </div>
            </div>

            {/* Scopes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Scopes</label>
              <Input
                placeholder="email, profile"
                value={form.scopes}
                onChange={(e) => updateField('scopes', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground italic">Comma-separated OAuth scopes</p>
            </div>

            {/* Sort Order + Enabled */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sort Order</label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
                />
                <p className="text-[10px] text-muted-foreground">Lower = shown first on login page</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    checked={form.is_enabled}
                    onChange={(e) => updateField('is_enabled', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{form.is_enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Advanced Settings
              {form.provider === 'custom' && <span className="text-red-500 text-xs">(required for custom)</span>}
            </button>

            {showAdvanced && (
              <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Icon URL</label>
                  <Input
                    placeholder="https://img.icons8.com/color/48/google-logo.png"
                    value={form.icon_url}
                    onChange={(e) => updateField('icon_url', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Callback URL
                    {editId && form.callback_url && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(form.callback_url)}
                        className="ml-2 text-primary"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3 inline" />
                      </button>
                    )}
                  </label>
                  <Input
                    placeholder="Auto-generated if left blank"
                    value={form.callback_url}
                    onChange={(e) => updateField('callback_url', e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Add this URL to your OAuth provider's redirect URIs
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-1">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Authorization URL
                      <span className="text-muted-foreground ml-1">
                        {form.provider !== 'custom' && '(auto-filled for known providers)'}
                      </span>
                    </label>
                    <Input
                      placeholder="https://provider.com/oauth/authorize"
                      value={form.authorize_url}
                      onChange={(e) => updateField('authorize_url', e.target.value)}
                      required={form.provider === 'custom'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Token URL</label>
                    <Input
                      placeholder="https://provider.com/oauth/token"
                      value={form.token_url}
                      onChange={(e) => updateField('token_url', e.target.value)}
                      required={form.provider === 'custom'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Profile URL</label>
                    <Input
                      placeholder="https://provider.com/api/userinfo"
                      value={form.profile_url}
                      onChange={(e) => updateField('profile_url', e.target.value)}
                      required={form.provider === 'custom'}
                    />
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editId ? 'Save Changes' : 'Create Connector'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Connector"
        message="Are you sure? Users will no longer be able to sign in with this provider. Existing linked accounts will be orphaned."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
