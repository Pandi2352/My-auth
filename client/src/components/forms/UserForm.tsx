import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/client';
import { ROLES } from '@/lib/api/endpoints';
import type { Role } from '@/types';

const userSchema = z.object({
  firstName: z.string().min(2, 'First name is too short'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']),
  roleIds: z.array(z.string()).min(1, 'Select at least one role'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status?: string;
    roleIds?: string[];
  };
  onSubmit: (values: UserFormValues) => void | Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function UserForm({ initialData, onSubmit, isLoading, isEdit }: UserFormProps) {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    api
      .get(ROLES.LIST)
      .then((res) => {
        const data = res.data.data;
        setAvailableRoles(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: initialData?.firstName ?? '',
      lastName: initialData?.lastName ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      status: (initialData?.status as any) ?? 'active',
      roleIds: initialData?.roleIds ?? [],
      password: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground">First Name</label>
          <Input
            className="mt-1"
            placeholder="John"
            {...register('firstName')}
            error={!!errors.firstName}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Last Name</label>
          <Input
            className="mt-1"
            placeholder="Doe"
            {...register('lastName')}
            error={!!errors.lastName}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">Email</label>
        <Input
          className="mt-1"
          type="email"
          placeholder="john@example.com"
          {...register('email')}
          disabled={isEdit}
          error={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">Phone</label>
        <Input
          className="mt-1"
          type="tel"
          placeholder="+1 (555) 000-0000"
          {...register('phone')}
        />
      </div>

      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-foreground">Password</label>
          <Input
            className="mt-1"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={!!errors.password}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground">Status</label>
          <select
            className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            {...register('status')}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Roles</label>
          {rolesLoading ? (
            <p className="mt-2 text-xs text-muted-foreground">Loading roles...</p>
          ) : availableRoles.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No roles found</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-3">
              {availableRoles.map((role) => (
                <label key={role._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={role._id}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    {...register('roleIds')}
                  />
                  <span className="capitalize">{role.name}</span>
                </label>
              ))}
            </div>
          )}
          {errors.roleIds && (
            <p className="mt-1 text-xs text-red-600">{errors.roleIds.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Save Changes' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
