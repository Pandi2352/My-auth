import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Fingerprint,
  QrCode,
  Link2,
  Unlink,
  Globe,
  Monitor,
  CheckCircle,
  XCircle,
  Clock,
  KeyRound,
  Activity,
  Copy,
  RefreshCcw,
  Trash2,
  Plus,
  Key,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePagination } from '@/hooks/usePagination';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui';
import api from '@/lib/api/client';
import { AUTH, SESSIONS, SOCIAL } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import { startRegistration } from '@simplewebauthn/browser';

// ── Types ───────────────────────────────────────────────────
interface LinkedAccount {
  _id: string;
  provider: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  linked_at: string;
}

interface LoginAttempt {
  _id: string;
  email: string;
  ip_address: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  success: boolean;
  failure_reason?: string;
  created_at: string;
}

interface SecurityEvent {
  _id: string;
  event_type: string;
  description: string;
  ip_address: string;
  created_at: string;
}

interface Authenticator {
  credentialID: string;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  transports?: string[];
  counter: number;
  name: string;
  last_used_at: string;
}

interface Session {
  _id: string;
  browser: string;
  os: string;
  ip_address: string;
  location: string;
  last_activity: string;
  is_current: boolean;
  user_agent: string;
}

export default function SecurityPage() {
  useDocumentTitle('Security');
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleExportData = async () => {
    try {
      const res = await api.get('/user/data-export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `account-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success('Data exported successfully');
    } catch (error) {
      handleApiError(error, 'Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm');
      return;
    }
    try {
      await api.delete('/user/account', { data: { password: deletePassword } });
      toast.success('Account deleted successfully');
      window.location.href = '/login';
    } catch (error) {
      handleApiError(error, 'Failed to delete account');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Security</h1>
        <p className="text-sm text-muted-foreground">
          Manage passkeys, two-factor authentication, and monitor security activity
        </p>
      </div>

      <Tabs defaultValue="passkeys" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="passkeys" className="gap-2">
            <Fingerprint className="h-4 w-4" /> Passkeys
          </TabsTrigger>
          <TabsTrigger value="2fa" className="gap-2">
            <Smartphone className="h-4 w-4" /> Two-Factor Auth
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Monitor className="h-4 w-4" /> Active Devices
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Link2 className="h-4 w-4" /> Linked Accounts
          </TabsTrigger>
          <TabsTrigger value="logins" className="gap-2">
            <Clock className="h-4 w-4" /> Login History
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Activity className="h-4 w-4" /> Security Events
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="passkeys">
            <PasskeysSection />
          </TabsContent>
          <TabsContent value="2fa">
            <TwoFactorSection />
          </TabsContent>
          <TabsContent value="sessions">
            <SessionsSection />
          </TabsContent>
          <TabsContent value="social">
            <LinkedAccountsSection />
          </TabsContent>
          <TabsContent value="logins">
            <LoginHistorySection />
          </TabsContent>
          <TabsContent value="events">
            <SecurityEventsSection />
          </TabsContent>
        </div>
      </Tabs>

      {/* Danger Zone */}
      <div className="pt-10 border-t border-muted/30">
        <div className="flex items-center gap-2 text-red-500 mb-4 px-1">
          <ShieldOff className="h-5 w-5" />
          <h2 className="text-lg font-bold tracking-tight">Danger Zone</h2>
        </div>
        
        <div className="grid gap-4">
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Export Account Data</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download a JSON file containing all your profile, preference, and security data.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="shrink-0 border-muted-foreground/20"
                onClick={handleExportData}
              >
                <Copy className="h-3.5 w-3.5 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently remove your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="danger" 
                size="sm" 
                className="shrink-0"
                onClick={() => setShowDeleteAccount(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <ConfirmDialog
        open={showDeleteAccount}
        onClose={() => { setShowDeleteAccount(false); setDeletePassword(''); }}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        message={
          <div className="space-y-3 pt-2 text-left">
            <p className="text-sm text-muted-foreground">
              This will permanently delete your account and all data. To confirm, please enter your password.
            </p>
            <Input 
              type="password"
              value={deletePassword} 
              onChange={(e) => setDeletePassword(e.target.value)} 
              placeholder="Your password"
              autoFocus
            />
          </div>
        }
        confirmLabel="Permanently Delete"
        variant="danger"
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 0. Passkeys (WebAuthn)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PasskeysSection() {
  const [authenticators, setAuthenticators] = useState<Authenticator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const fetchAuthenticators = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/auth/webauthn/authenticators');
      setAuthenticators(res.data.data || []);
    } catch (error) {
      handleApiError(error, 'Failed to load passkeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/auth/webauthn/authenticators/${deleteId}`);
      toast.success('Passkey deleted');
      setDeleteId(null);
      fetchAuthenticators();
    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    fetchAuthenticators();
  }, []);

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const optionsRes = await api.get('/auth/webauthn/register/options');
      const options = optionsRes.data.data;
      const attestationResponse = await startRegistration({ optionsJSON: options });
      await api.post('/auth/webauthn/register/verify', attestationResponse);
      toast.success('Passkey registered successfully');
      fetchAuthenticators();
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error('Registration timed out or cancelled');
      } else {
        handleApiError(error, 'Failed to register passkey');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRename = async () => {
    if (!renameId || !newName.trim()) return;
    try {
      await api.post(`/auth/webauthn/authenticators/${renameId}/rename`, { name: newName });
      toast.success('Passkey renamed');
      setRenameId(null);
      setNewName('');
      fetchAuthenticators();
    } catch (error) {
      handleApiError(error);
    }
  };

  const openRename = (auth: Authenticator) => {
    setRenameId(auth.credentialID);
    setNewName(auth.name);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Hardware-backed authentication using biometric sensors or security keys
            </CardDescription>
          </div>
          <Button onClick={handleRegister} isLoading={isRegistering} className="gap-2">
            <Plus className="h-4 w-4" /> Add Passkey
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : authenticators.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Fingerprint className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-medium text-foreground">No passkeys registered</p>
                <p className="text-xs text-muted-foreground">
                  Passkeys provide a more secure and convenient way to sign in without passwords
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {authenticators.map((auth) => (
                <div
                  key={auth.credentialID}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {auth.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Monitor className="h-3.5 w-3.5" /> 
                          {(auth.credentialDeviceType as any) === 'single_device' ? 'Platform Passkey' : 'Roaming Security Key'}
                        </span>
                        <span>•</span>
                        {auth.last_used_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> 
                            Used {new Date(auth.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <RefreshCcw className="h-3.5 w-3.5" /> 
                          {auth.counter} usages
                        </span>
                        <span>•</span>
                        {auth.credentialBackedUp ? (
                          <span className="text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">Backed up</span>
                        ) : (
                          <span className="text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Not backed up</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => openRename(auth)}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-red-600"
                      onClick={() => setDeleteId(auth.credentialID)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Passkey"
        message="Are you sure you want to delete this passkey? You won't be able to use it to sign in anymore."
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        open={!!renameId}
        onClose={() => setRenameId(null)}
        onConfirm={handleRename}
        title="Rename Passkey"
        message={
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Give this passkey a friendly name to identify it easily.</p>
            <Input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              placeholder="e.g. My iPhone, Work Laptop"
              autoFocus
            />
          </div>
        }
        confirmLabel="Save"
      />

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">Phishing Resistant</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Passkeys are resistant to phishing, as they can only be used with the specific website they were created for. 
                Your biometric data never leaves your device.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Two-Factor Authentication
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TwoFactorSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check current 2FA status
  useEffect(() => {
    api.get('/user/profile')
      .then((res) => {
        setIs2faEnabled(res.data.data.is_2fa_enabled ?? false);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const res = await api.post(AUTH.ENABLE_2FA);
      setSetupData(res.data.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyToken || verifyToken.length !== 6) {
      toast.error('Enter a 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      await api.post(AUTH.VERIFY_2FA, { token: verifyToken });
      toast.success('Two-factor authentication enabled');
      setIs2faEnabled(true);
      setSetupData(null);
      setVerifyToken('');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableToken || disableToken.length !== 6) {
      toast.error('Enter a 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      await api.post(AUTH.DISABLE_2FA, { token: disableToken });
      toast.success('Two-factor authentication disabled');
      setIs2faEnabled(false);
      setShowDisable(false);
      setDisableToken('');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      toast.success('Secret copied');
    }
  };

  if (checking) return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${is2faEnabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted'}`}>
                {is2faEnabled
                  ? <ShieldCheck className="h-6 w-6 text-green-600" />
                  : <ShieldOff className="h-6 w-6 text-muted-foreground" />
                }
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Two-Factor Authentication is {is2faEnabled ? 'enabled' : 'disabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {is2faEnabled
                    ? 'Your account is protected with an authenticator app'
                    : 'Add an extra layer of security to your account'
                  }
                </p>
              </div>
            </div>
            {is2faEnabled ? (
              <Button variant="outline" onClick={() => setShowDisable(true)}>
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleEnable} isLoading={isLoading && !setupData}>
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Flow */}
      {setupData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Set up authenticator
            </CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="rounded-xl border border-border bg-white p-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauth_url)}`}
                  alt="2FA QR Code"
                  className="h-[200px] w-[200px]"
                />
              </div>
            </div>

            {/* Manual entry */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Can't scan? Enter this key manually:
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={setupData.secret}
                  className="font-mono text-xs bg-muted"
                />
                <Button variant="outline" size="icon" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Verify */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Enter the 6-digit code from your app
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                  className="max-w-[200px] font-mono text-center text-lg tracking-widest"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
                <Button onClick={handleVerify} isLoading={isLoading}>
                  Verify & Activate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disable Flow */}
      {showDisable && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="text-red-600">Disable Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter a code from your authenticator app to confirm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="000000"
                maxLength={6}
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ''))}
                className="max-w-[200px] font-mono text-center text-lg tracking-widest"
                onKeyDown={(e) => e.key === 'Enter' && handleDisable()}
              />
              <Button variant="danger" onClick={handleDisable} isLoading={isLoading}>
                Disable
              </Button>
              <Button variant="ghost" onClick={() => { setShowDisable(false); setDisableToken(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Active Sessions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(SESSIONS.LIST);
      setSessions(res.data.data || []);
    } catch (error) {
      handleApiError(error, 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (id: string) => {
    try {
      await api.delete(SESSIONS.TERMINATE(id));
      toast.success('Session terminated');
      fetchSessions();
    } catch (error) {
      handleApiError(error);
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      await api.delete(SESSIONS.TERMINATE_ALL);
      toast.success('All other sessions terminated');
      fetchSessions();
    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Active Devices</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Devices currently signed into your account.
          </p>
        </div>
        {sessions.length > 1 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={terminateAllOtherSessions}
          >
            Sign out of all other devices
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            {sessions.map((session) => (
              <Card key={session._id} className="overflow-hidden bg-card/50 backdrop-blur-sm border-muted/20">
                <div className="p-4 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {session.user_agent?.toLowerCase().includes('mobile') || session.user_agent?.toLowerCase().includes('android') || session.user_agent?.toLowerCase().includes('iphone') ? (
                      <Smartphone className="h-6 w-6" />
                    ) : (
                      <Monitor className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}</h3>
                        {session.is_current && (
                          <Badge variant="secondary" className="text-[10px] py-0 h-4 uppercase tracking-wider">Current Device</Badge>
                        )}
                      </div>
                      {!session.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-red-500"
                          onClick={() => terminateSession(session._id)}
                        >
                          Sign out
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {session.ip_address}
                        {session.location && <span className="opacity-60">• {session.location}</span>}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                        Last active {new Date(session.last_activity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl border-muted/20">
                <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center mb-4 text-muted-foreground/40">
                  <Monitor className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-muted-foreground">No active sessions found</h3>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-[250px]">
                  Sign in from another device to see it listed here.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <div className="p-4 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">Session Security</p>
            <p className="text-xs text-muted-foreground mt-1">
              We use individual session tokens for every device. If you don't recognize a device or location, terminate the session immediately and change your password.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Linked Social Accounts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function LinkedAccountsSection() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(SOCIAL.LINKED_ACCOUNTS);
      setAccounts(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      handleApiError(error, 'Failed to load linked accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleUnlink = async () => {
    if (!unlinkProvider) return;
    try {
      await api.delete(SOCIAL.UNLINK(unlinkProvider));
      toast.success(`${unlinkProvider} account unlinked`);
      setUnlinkProvider(null);
      fetchAccounts();
    } catch (error) {
      handleApiError(error);
    }
  };

  const PROVIDER_COLORS: Record<string, string> = {
    google: 'bg-red-50 text-red-600 dark:bg-red-900/20',
    github: 'bg-gray-50 text-gray-700 dark:bg-gray-800',
    microsoft: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    facebook: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20',
    apple: 'bg-gray-50 text-gray-900 dark:bg-gray-800',
    twitter: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20',
    linkedin: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Linked Social Accounts</CardTitle>
          <CardDescription>
            Social accounts connected to your profile for quick sign-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Link2 className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No social accounts linked</p>
              <p className="text-xs text-muted-foreground">
                Sign in with a social provider to automatically link it to your account
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account._id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${PROVIDER_COLORS[account.provider] || 'bg-muted'}`}>
                      {account.avatar_url ? (
                        <img src={account.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                      ) : (
                        <span className="text-xs font-bold uppercase">{account.provider[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{account.provider}</p>
                      <p className="text-xs text-muted-foreground">{account.email || account.display_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Linked {new Date(account.linked_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUnlinkProvider(account.provider)}
                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    Unlink
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!unlinkProvider}
        onClose={() => setUnlinkProvider(null)}
        onConfirm={handleUnlink}
        title={`Unlink ${unlinkProvider}`}
        message={`You won't be able to sign in with ${unlinkProvider} anymore. You can re-link it later by signing in with this provider.`}
        confirmLabel="Unlink"
        variant="danger"
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Login History
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function LoginHistorySection() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { meta, page, limit, goToPage, changeLimit, updateMeta } = usePagination();

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(SESSIONS.LOGIN_HISTORY, { params: { page, limit } });
      const data = res.data.data;
      setAttempts(data.attempts || []);
      if (data.meta_data) updateMeta(data.meta_data);
    } catch (error) {
      handleApiError(error, 'Failed to load login history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, limit]);

  const columns: Column<LoginAttempt>[] = [
    {
      key: 'success',
      header: 'Status',
      render: (a) => (
        <div className="flex items-center gap-2">
          {a.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-xs font-medium ${a.success ? 'text-green-600' : 'text-red-600'}`}>
            {a.success ? 'Success' : 'Failed'}
          </span>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'Device',
      render: (a) => (
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-foreground">{a.browser || 'Unknown'} / {a.os || 'Unknown'}</p>
            <p className="text-[10px] text-muted-foreground">{a.device || 'Unknown device'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP / Location',
      render: (a) => (
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="font-mono text-xs">{a.ip_address}</p>
            {a.location && <p className="text-[10px] text-muted-foreground">{a.location}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Time',
      render: (a) => (
        <span className="text-xs text-muted-foreground">
          {new Date(a.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Recent sign-in attempts on your account</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchHistory}>
          <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={attempts}
          isLoading={isLoading}
          meta={meta}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
          emptyMessage="No login attempts recorded"
          emptyIcon={<Clock className="h-6 w-6 text-muted-foreground/50" />}
        />
      </CardContent>
    </Card>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. Security Events Timeline
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SecurityEventsSection() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { meta, page, limit, goToPage, updateMeta } = usePagination();

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(SESSIONS.SECURITY_EVENTS, { params: { page, limit } });
      const data = res.data.data;
      setEvents(data.events || []);
      if (data.meta_data) updateMeta(data.meta_data);
    } catch (error) {
      handleApiError(error, 'Failed to load security events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, limit]);

  const EVENT_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
    password_reset: { icon: <KeyRound className="h-4 w-4" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
    password_changed: { icon: <KeyRound className="h-4 w-4" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
    '2fa_enabled': { icon: <ShieldCheck className="h-4 w-4" />, color: 'bg-green-50 text-green-600 dark:bg-green-900/20' },
    '2fa_disabled': { icon: <ShieldOff className="h-4 w-4" />, color: 'bg-red-50 text-red-600 dark:bg-red-900/20' },
    account_recovered: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-50 text-green-600 dark:bg-green-900/20' },
    admin_impersonation: { icon: <Activity className="h-4 w-4" />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' },
  };

  const getEventMeta = (type: string) => {
    return EVENT_ICONS[type] || { icon: <Activity className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' };
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>Password changes, 2FA toggles, and other security-related activity</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchEvents}>
          <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Activity className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No security events recorded</p>
          </div>
        ) : (
          <div className="space-y-0">
            {events.map((event, idx) => {
              const eventMeta = getEventMeta(event.event_type);
              return (
                <div key={event._id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline line */}
                  {idx < events.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                  )}

                  {/* Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${eventMeta.color}`}>
                    {eventMeta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium text-foreground">{event.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        {event.event_type}
                      </span>
                      {event.ip_address && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {event.ip_address}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {meta && meta.total_pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-border mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {meta.page} of {meta.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.total_pages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
