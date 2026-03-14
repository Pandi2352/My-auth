import { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  ShieldCheck,
  Database,
  Save,
  RefreshCcw,
  AlertTriangle,
  Plus,
  X,
  ShieldBan,
  ShieldCheck as ShieldAllow,
  KeyRound,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { PageLoader } from '@/components/ui/PageLoader';
import api from '@/lib/api/client';
import { SETTINGS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { SystemConfig } from '@/types';

// ── Helper: extract value map from settings array ───────────
function toValueMap(settings: SystemConfig[]): Record<string, any> {
  return settings.reduce<Record<string, any>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}

export default function SettingsPage() {
  useDocumentTitle('System Settings');

  const [settings, setSettings] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(SETTINGS.LIST);
      setSettings(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      handleApiError(error, 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = useCallback(async (category: string, values: Record<string, any>) => {
    setSavingCategory(category);
    try {
      await api.patch(SETTINGS.BULK_UPDATE(category), values);
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved`);
      fetchSettings();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingCategory(null);
    }
  }, []);

  const handleUpdateSingleKey = useCallback(async (key: string, value: any) => {
    try {
      await api.patch(SETTINGS.UPDATE(key), { value });
      toast.success('Setting updated');
      fetchSettings();
    } catch (error) {
      handleApiError(error);
    }
  }, []);

  if (isLoading) return <PageLoader />;

  const byCategory = (cat: string) => settings.filter((s) => s.category === cat);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground">Configure global application behavior and security</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="app" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="app" className="gap-2">
            <Globe className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="auth" className="gap-2">
            <KeyRound className="h-4 w-4" /> Auth
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Database className="h-4 w-4" /> Advanced
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="app">
            <AppSettings
              settings={byCategory('app')}
              onSave={(v) => handleSave('app', v)}
              isSaving={savingCategory === 'app'}
            />
          </TabsContent>

          <TabsContent value="auth">
            <AuthSettings
              settings={byCategory('auth')}
              onSave={(v) => handleSave('auth', v)}
              isSaving={savingCategory === 'auth'}
            />
          </TabsContent>

          <TabsContent value="email">
            <EmailSettings
              settings={byCategory('email')}
              onSave={(v) => handleSave('email', v)}
              isSaving={savingCategory === 'email'}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings
              settings={byCategory('security')}
              onSave={(v) => handleSave('security', v)}
              isSaving={savingCategory === 'security'}
            />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedSettings
              settings={settings}
              onUpdateKey={handleUpdateSingleKey}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ── Shared Props ─────────────────────────────────────────────
interface SectionProps {
  settings: SystemConfig[];
  onSave: (values: Record<string, any>) => void;
  isSaving: boolean;
}

// ── Hook: build controlled state from settings ──────────────
function useSettingsValues(settings: SystemConfig[]) {
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    setValues(toValueMap(settings));
  }, [settings]);

  const set = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return { values, set, setValues };
}

// ── Toggle Row ──────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="relative shrink-0 ml-4">
        <input
          type="checkbox"
          checked={checked ?? false}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-primary transition-colors dark:bg-gray-700" />
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </div>
    </label>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// App (General) Settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AppSettings({ settings, onSave, isSaving }: SectionProps) {
  const { values, set } = useSettingsValues(settings);

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Application identity and public metadata</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldItem label="Site Name" desc="Displayed in the browser tab and emails">
            <Input
              value={values['app.site_name'] ?? ''}
              onChange={(e) => set('app.site_name', e.target.value)}
            />
          </FieldItem>
          <FieldItem label="Support Email" desc="Public contact address for help requests">
            <Input
              type="email"
              value={values['app.support_email'] ?? ''}
              onChange={(e) => set('app.support_email', e.target.value)}
            />
          </FieldItem>
        </div>

        <FieldItem label="Logo URL" desc="Full URL to the application logo image">
          <Input
            placeholder="https://cdn.example.com/logo.png"
            value={values['app.logo_url'] ?? ''}
            onChange={(e) => set('app.logo_url', e.target.value)}
          />
        </FieldItem>

        <ToggleRow
          label="Maintenance Mode"
          description="Show a maintenance page to all users. Admins can still access the dashboard."
          checked={values['app.maintenance_mode'] ?? false}
          onChange={(v) => set('app.maintenance_mode', v)}
        />

        {/* Announcement Banner */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <ToggleRow
            label="Announcement Banner"
            description="Show a site-wide message bar at the top of the dashboard"
            checked={values['app.announcement_enabled'] ?? false}
            onChange={(v) => set('app.announcement_enabled', v)}
          />
          {values['app.announcement_enabled'] && (
            <div className="space-y-4 pl-2">
              <FieldItem label="Message" desc="Text displayed in the banner">
                <Input
                  placeholder="We're performing scheduled maintenance tonight..."
                  value={values['app.announcement_message'] ?? ''}
                  onChange={(e) => set('app.announcement_message', e.target.value)}
                />
              </FieldItem>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldItem label="Type" desc="Banner color style">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={values['app.announcement_type'] ?? 'info'}
                    onChange={(e) => set('app.announcement_type', e.target.value)}
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="success">Success (Green)</option>
                    <option value="error">Error (Red)</option>
                  </select>
                </FieldItem>
                <div className="flex items-end pb-1">
                  <ToggleRow
                    label="Dismissible"
                    description="Users can close the banner"
                    checked={values['app.announcement_dismissible'] ?? true}
                    onChange={(v) => set('app.announcement_dismissible', v)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <SaveButton onClick={() => onSave(values)} isSaving={isSaving} />
      </CardContent>
    </Card>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth Settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AuthSettings({ settings, onSave, isSaving }: SectionProps) {
  const { values, set } = useSettingsValues(settings);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>Token lifetimes, password policies, and login rules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldItem label="Access Token TTL" desc="e.g., 15m, 1h, 30s">
            <Input
              value={values['auth.access_token_ttl'] ?? ''}
              onChange={(e) => set('auth.access_token_ttl', e.target.value)}
            />
          </FieldItem>
          <FieldItem label="Refresh Token TTL" desc="e.g., 7d, 30d">
            <Input
              value={values['auth.refresh_token_ttl'] ?? ''}
              onChange={(e) => set('auth.refresh_token_ttl', e.target.value)}
            />
          </FieldItem>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FieldItem label="Min Password Length" desc="Minimum characters">
            <Input
              type="number"
              min={6}
              value={values['auth.password_min_length'] ?? 8}
              onChange={(e) => set('auth.password_min_length', parseInt(e.target.value) || 8)}
            />
          </FieldItem>
          <FieldItem label="Max Login Attempts" desc="Before account lock">
            <Input
              type="number"
              min={1}
              value={values['auth.max_login_attempts'] ?? 5}
              onChange={(e) => set('auth.max_login_attempts', parseInt(e.target.value) || 5)}
            />
          </FieldItem>
          <FieldItem label="Lock Duration (min)" desc="After max attempts">
            <Input
              type="number"
              min={1}
              value={values['auth.lock_duration_minutes'] ?? 30}
              onChange={(e) => set('auth.lock_duration_minutes', parseInt(e.target.value) || 30)}
            />
          </FieldItem>
        </div>

        <ToggleRow
          label="Require Email Verification"
          description="Users must verify their email before they can log in"
          checked={values['auth.require_email_verification'] ?? true}
          onChange={(v) => set('auth.require_email_verification', v)}
        />

        <SaveButton onClick={() => onSave(values)} isSaving={isSaving} />
      </CardContent>
    </Card>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Email Settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function EmailSettings({ settings, onSave, isSaving }: SectionProps) {
  const { values, set } = useSettingsValues(settings);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email / SMTP</CardTitle>
        <CardDescription>Outbound email configuration for notifications and alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldItem label="SMTP Host" desc="e.g., smtp.gmail.com">
            <Input
              value={values['email.smtp_host'] ?? ''}
              onChange={(e) => set('email.smtp_host', e.target.value)}
            />
          </FieldItem>
          <FieldItem label="SMTP Port" desc="Usually 587 (TLS) or 465 (SSL)">
            <Input
              type="number"
              value={values['email.smtp_port'] ?? 587}
              onChange={(e) => set('email.smtp_port', parseInt(e.target.value) || 587)}
            />
          </FieldItem>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldItem label="From Address" desc="Sender email shown to recipients">
            <Input
              type="email"
              value={values['email.from_address'] ?? ''}
              onChange={(e) => set('email.from_address', e.target.value)}
            />
          </FieldItem>
          <FieldItem label="From Name" desc="Sender display name">
            <Input
              value={values['email.from_name'] ?? ''}
              onChange={(e) => set('email.from_name', e.target.value)}
            />
          </FieldItem>
        </div>

        <SaveButton onClick={() => onSave(values)} isSaving={isSaving} />
      </CardContent>
    </Card>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Security Settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SecuritySettings({ settings, onSave, isSaving }: SectionProps) {
  const { values, set } = useSettingsValues(settings);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting & Sessions</CardTitle>
          <CardDescription>Control request throttling and session lifetimes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldItem label="Rate Limit Window (ms)" desc="Time window for throttling">
              <Input
                type="number"
                value={values['security.rate_limit_ttl'] ?? 60000}
                onChange={(e) => set('security.rate_limit_ttl', parseInt(e.target.value) || 60000)}
              />
            </FieldItem>
            <FieldItem label="Max Requests / Window" desc="Requests allowed per window">
              <Input
                type="number"
                value={values['security.rate_limit_max'] ?? 10}
                onChange={(e) => set('security.rate_limit_max', parseInt(e.target.value) || 10)}
              />
            </FieldItem>
            <FieldItem label="Session Timeout (min)" desc="Idle session expiry">
              <Input
                type="number"
                value={values['security.session_timeout_minutes'] ?? 1440}
                onChange={(e) => set('security.session_timeout_minutes', parseInt(e.target.value) || 1440)}
              />
            </FieldItem>
          </div>

          <SaveButton onClick={() => onSave(values)} isSaving={isSaving} />
        </CardContent>
      </Card>

      {/* IP Whitelist */}
      <IpListManager
        label="IP Whitelist"
        description="Only these IPs will be allowed access. Leave empty to allow all."
        icon={<ShieldAllow className="h-5 w-5 text-green-600" />}
        items={Array.isArray(values['security.ip_whitelist']) ? values['security.ip_whitelist'] : []}
        onUpdate={(list) => set('security.ip_whitelist', list)}
        onSave={() => onSave(values)}
        isSaving={isSaving}
        variant="success"
      />

      {/* IP Blacklist */}
      <IpListManager
        label="IP Blacklist"
        description="These IPs will be blocked from accessing the platform."
        icon={<ShieldBan className="h-5 w-5 text-red-500" />}
        items={Array.isArray(values['security.ip_blacklist']) ? values['security.ip_blacklist'] : []}
        onUpdate={(list) => set('security.ip_blacklist', list)}
        onSave={() => onSave(values)}
        isSaving={isSaving}
        variant="danger"
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Advanced Settings (raw key-value editor)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AdvancedSettings({
  settings,
  onUpdateKey,
}: {
  settings: SystemConfig[];
  onUpdateKey: (key: string, value: any) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (config: SystemConfig) => {
    setEditingKey(config.key);
    setEditValue(typeof config.value === 'string' ? config.value : JSON.stringify(config.value));
  };

  const saveEdit = (key: string) => {
    let parsed: any = editValue;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      // keep as string
    }
    onUpdateKey(key, parsed);
    setEditingKey(null);
  };

  return (
    <Card className="border-red-200 dark:border-red-900/50">
      <CardHeader>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <CardTitle>Advanced — Raw Configuration</CardTitle>
        </div>
        <CardDescription>
          Direct key-value editor for all settings. Incorrect values can break the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settings.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">No settings found.</p>
        ) : (
          <div className="divide-y divide-border">
            {settings.map((config) => (
              <div key={config.key} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-muted-foreground truncate">{config.key}</p>
                  <p className="text-[10px] text-muted-foreground/70">{config.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {editingKey === config.key ? (
                    <>
                      <Input
                        className="w-48 font-mono text-xs"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(config.key)}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => saveEdit(config.key)}>
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <code className="max-w-[200px] truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                        {typeof config.value === 'string'
                          ? config.value || '""'
                          : JSON.stringify(config.value)}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => startEdit(config)}>
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared UI Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FieldItem({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {desc && <p className="text-[10px] text-muted-foreground">{desc}</p>}
      {children}
    </div>
  );
}

function SaveButton({ onClick, isSaving }: { onClick: () => void; isSaving: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onClick} isLoading={isSaving}>
        <Save className="h-4 w-4 mr-2" /> Save Changes
      </Button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IP List Manager
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function IpListManager({
  label,
  description,
  icon,
  items,
  onUpdate,
  onSave,
  isSaving,
  variant,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  items: string[];
  onUpdate: (list: string[]) => void;
  onSave: () => void;
  isSaving: boolean;
  variant: 'success' | 'danger';
}) {
  const [newIp, setNewIp] = useState('');

  const handleAdd = () => {
    const trimmed = newIp.trim();
    if (!trimmed) return;
    const ipRegex = /^(\d{1,3}\.){1,3}(\d{1,3}|\*)$/;
    if (!ipRegex.test(trimmed)) {
      toast.error('Invalid IP format. Use 192.168.1.100 or 192.168.1.*');
      return;
    }
    if (items.includes(trimmed)) {
      toast.error('IP already in the list');
      return;
    }
    onUpdate([...items, trimmed]);
    setNewIp('');
  };

  const borderColor =
    variant === 'success'
      ? 'border-green-200 dark:border-green-900/50'
      : 'border-red-200 dark:border-red-900/50';

  return (
    <Card className={borderColor}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{label}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 192.168.1.100 or 10.0.0.*"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="flex-1"
          />
          <Button variant="outline" onClick={handleAdd} className="shrink-0 gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground italic">No IPs configured</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((ip) => (
              <span
                key={ip}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-xs"
              >
                {ip}
                <button
                  onClick={() => onUpdate(items.filter((i) => i !== ip))}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onSave} isLoading={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" /> Save {label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
