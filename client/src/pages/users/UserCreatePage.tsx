import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { UserForm, type UserFormValues } from '@/components/forms/UserForm';
import api from '@/lib/api/client';
import { ADMIN_USERS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import { useState } from 'react';

export default function UserCreatePage() {
  useDocumentTitle('Create User');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: UserFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        status: values.status,
        role_ids: values.roleIds,
        requires_password_change: values.requiresPasswordChange,
      };
      await api.post(ADMIN_USERS.CREATE, payload);
      toast.success('User created successfully');
      navigate('/users');
    } catch (error) {
      handleApiError(error, 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/users')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Create New User</h1>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm onSubmit={onSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
