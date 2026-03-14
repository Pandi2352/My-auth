import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Trash2, Eye, EyeOff, Download, AlertTriangle, Bell, Mail, Shield, LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api from '@/lib/api/client';
import { USER } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import { mapBackendUser } from '@/lib/utils/mapUser';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomFieldsForm } from '@/components/forms/CustomFieldsForm';

// ── Profile Info Schema ────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is too short'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

// ── Change Password Schema ─────────────────────────────────
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  useDocumentTitle('Profile');
  const { user, setUser } = useAuthStore();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* Account overview */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <AvatarSection />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-1 flex gap-2">
                <StatusBadge
                  status={user?.isEmailVerified ? 'success' : 'warning'}
                  label={user?.isEmailVerified ? 'Verified' : 'Unverified'}
                />
                <StatusBadge
                  status={user?.status === 'active' ? 'success' : 'error'}
                  label={user?.status ?? 'unknown'}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <ProfileForm user={user} setUser={setUser} />

      {/* Custom Fields */}
      <CustomFieldsFormSection />

      {/* Change email */}
      <ChangeEmailForm />

      {/* Change password */}
      <ChangePasswordForm />

      {/* Notification Preferences */}
      <NotificationPreferences />

      {/* GDPR — Data Export & Account Deletion */}
      <DataPrivacySection />
    </div>
  );
}

// ── Avatar Section ─────────────────────────────────────────
function AvatarSection() {
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await api.patch(USER.UPLOAD_AVATAR, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(mapBackendUser(res.data.data));
      toast.success('Avatar updated');
    } catch (error) {
      handleApiError(error);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    try {
      const res = await api.delete(USER.REMOVE_AVATAR);
      setUser(mapBackendUser(res.data.data));
      toast.success('Avatar removed');
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <div className="relative shrink-0">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt="Avatar"
          className="h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {user?.firstName?.[0]?.toUpperCase() ?? 'U'}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="absolute -bottom-1 -right-1 flex gap-1">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-full bg-primary p-1.5 text-white shadow hover:bg-primary/90"
          title="Upload avatar"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
        {user?.avatar && (
          <button
            onClick={handleRemove}
            className="rounded-full bg-red-600 p-1.5 text-white shadow hover:bg-red-700"
            title="Remove avatar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Profile Form ───────────────────────────────────────────
function ProfileForm({
  user,
  setUser,
}: {
  user: User | null;
  setUser: (user: User | null) => void;
}) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: '',
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    setSaving(true);
    try {
      const res = await api.patch(USER.PROFILE, {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
      });
      setUser(mapBackendUser(res.data.data));
      toast.success('Profile updated');
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Info</CardTitle>
        <CardDescription>Update your name and contact details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">First Name</label>
              <Input className="mt-1" {...register('firstName')} />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Last Name</label>
              <Input className="mt-1" {...register('lastName')} />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Phone</label>
            <Input className="mt-1" type="tel" placeholder="+1 (555) 000-0000" {...register('phone')} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={saving} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Change Password Form ───────────────────────────────────
function ChangePasswordForm() {
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  const newPasswordValue = watch('newPassword', '');

  const onSubmit = async (values: PasswordValues) => {
    setSaving(true);
    try {
      await api.patch(USER.UPDATE_PASSWORD, {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      toast.success('Password changed');
      reset();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Current Password</label>
            <div className="relative mt-1">
              <Input
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('currentPassword')}
                className={errors.currentPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">New Password</label>
            <div className="relative mt-1">
              <Input
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('newPassword')}
                className={errors.newPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
            <PasswordStrengthMeter password={newPasswordValue} />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Confirm New Password</label>
            <Input
              className="mt-1"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={saving}>
              Change Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Notification Preferences ────────────────────────────────
interface NotificationPref {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const NOTIFICATION_PREFS: NotificationPref[] = [
  {
    key: 'email_on_login',
    label: 'New Login Alerts',
    description: 'Get notified when someone logs into your account from a new device',
    icon: <LogIn className="h-4 w-4" />,
  },
  {
    key: 'email_on_password_change',
    label: 'Password Change Alerts',
    description: 'Get notified when your password is changed',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    key: 'email_on_security_alert',
    label: 'Security Alerts',
    description: 'Receive alerts for suspicious activity like failed login attempts',
    icon: <Mail className="h-4 w-4" />,
  },
];

function NotificationPreferences() {
  const [prefs, setPrefs] = useState({
    email_on_login: false,
    email_on_password_change: true,
    email_on_security_alert: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(USER.PROFILE)
      .then((res) => {
        const profile = res.data.data;
        if (profile.notification_preferences) {
          setPrefs(profile.notification_preferences);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      await api.patch(USER.NOTIFICATIONS, { [key]: value });
      toast.success('Notification preference updated');
    } catch (error) {
      // Revert on failure
      setPrefs(prefs);
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Notification Preferences</CardTitle>
        </div>
        <CardDescription>Choose which email notifications you'd like to receive</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading preferences...</div>
        ) : (
          <div className="space-y-1">
            {NOTIFICATION_PREFS.map((pref) => (
              <label
                key={pref.key}
                className="flex items-center justify-between rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">{pref.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                </div>
                <div className="relative shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={(prefs as any)[pref.key]}
                    onChange={(e) => handleToggle(pref.key, e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-primary transition-colors dark:bg-gray-700" />
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Custom Fields Section ────────────────────────────────────
function CustomFieldsFormSection() {
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get(USER.PROFILE)
      .then((res) => {
        setCustomValues(res.data.data.custom_fields || {});
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const handleSave = async (values: Record<string, any>) => {
    await api.patch(USER.PROFILE, { custom_fields: values });
    setCustomValues(values);
    toast.success('Custom fields saved');
  };

  return <CustomFieldsForm values={customValues} onSave={handleSave} />;
}

// ── Change Email Form ────────────────────────────────────────
function ChangeEmailForm() {
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !password) return;
    setSaving(true);
    try {
      await api.patch(USER.UPDATE_EMAIL, {
        new_email: newEmail,
        password,
      });
      setSuccess(true);
      toast.success('Verification email sent to your new address');
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 dark:border-green-900/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Check your new email</p>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a verification link to <span className="font-medium text-foreground">{newEmail}</span>.
                Your email will be updated once you verify it. You may need to log in again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => { setSuccess(false); setNewEmail(''); setPassword(''); }}
              >
                Change to a different email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Email</CardTitle>
        <CardDescription>
          Your current email is <span className="font-medium text-foreground">{user?.email}</span>.
          A verification link will be sent to the new address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">New Email Address</label>
            <Input
              className="mt-1"
              type="email"
              placeholder="newemail@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Current Password</label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Required to confirm this change</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={saving} disabled={!newEmail || !password}>
              Update Email
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Data Privacy / GDPR Section ─────────────────────────────
function DataPrivacySection() {
  const { logout } = useAuthStore();
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get(USER.DATA_EXPORT, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my-data-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Your data has been exported');
    } catch (error) {
      handleApiError(error, 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete(USER.DELETE_ACCOUNT);
      toast.success('Your account has been scheduled for deletion');
      logout();
    } catch (error) {
      handleApiError(error, 'Failed to delete account');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>
            Manage your personal data in compliance with privacy regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Export */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-start gap-3">
              <Download className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Export your data</p>
                <p className="text-xs text-muted-foreground">
                  Download a copy of all your personal data in JSON format
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} isLoading={exporting}>
              Export
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Delete your account
                </p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure? This will permanently delete your account, personal data, sessions, and all related records. You may be able to recover within 30 days by contacting support."
        confirmLabel={deleting ? 'Deleting...' : 'Yes, delete my account'}
        variant="danger"
      />
    </>
  );
}
