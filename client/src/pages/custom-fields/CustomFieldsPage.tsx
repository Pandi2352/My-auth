import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCcw,
  ListChecks,
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
import { CUSTOM_FIELDS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { CustomField, FieldType } from '@/types';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown (Single)' },
  { value: 'multiselect', label: 'Dropdown (Multi)' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
];

interface FormState {
  label: string;
  key: string;
  type: FieldType;
  description: string;
  placeholder: string;
  is_required: boolean;
  is_active: boolean;
  options: string;
  sort_order: number;
}

const emptyForm: FormState = {
  label: '',
  key: '',
  type: 'text',
  description: '',
  placeholder: '',
  is_required: false,
  is_active: true,
  options: '',
  sort_order: 0,
};

export default function CustomFieldsPage() {
  useDocumentTitle('Custom Fields');

  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchFields = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(CUSTOM_FIELDS.LIST);
      setFields(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      handleApiError(error, 'Failed to fetch custom fields');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (field: CustomField) => {
    setEditId(field._id);
    setForm({
      label: field.label,
      key: field.key,
      type: field.type,
      description: field.description || '',
      placeholder: field.placeholder || '',
      is_required: field.is_required,
      is_active: field.is_active,
      options: field.options?.join(', ') || '',
      sort_order: field.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = {
      label: form.label,
      key: form.key,
      type: form.type,
      is_required: form.is_required,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    if (form.description) payload.description = form.description;
    if (form.placeholder) payload.placeholder = form.placeholder;
    if (form.type === 'select' || form.type === 'multiselect') {
      payload.options = form.options.split(',').map((s) => s.trim()).filter(Boolean);
    }

    try {
      if (editId) {
        await api.patch(CUSTOM_FIELDS.UPDATE(editId), payload);
        toast.success('Field updated');
      } else {
        await api.post(CUSTOM_FIELDS.CREATE, payload);
        toast.success('Field created');
      }
      setIsModalOpen(false);
      fetchFields();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(CUSTOM_FIELDS.DELETE(deleteId));
      toast.success('Field deleted');
      setDeleteId(null);
      fetchFields();
    } catch (error) {
      handleApiError(error);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Auto-generate key from label
  const handleLabelChange = (label: string) => {
    updateField('label', label);
    if (!editId) {
      updateField('key', label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
    }
  };

  const TYPE_COLORS: Record<string, string> = {
    text: 'bg-blue-100 text-blue-700',
    number: 'bg-purple-100 text-purple-700',
    date: 'bg-green-100 text-green-700',
    select: 'bg-amber-100 text-amber-700',
    multiselect: 'bg-orange-100 text-orange-700',
    boolean: 'bg-pink-100 text-pink-700',
    url: 'bg-cyan-100 text-cyan-700',
    email: 'bg-indigo-100 text-indigo-700',
  };

  const columns: Column<CustomField>[] = [
    {
      key: 'sort_order',
      header: '#',
      render: (f) => <span className="text-xs text-muted-foreground font-mono">{f.sort_order}</span>,
    },
    {
      key: 'label',
      header: 'Field',
      render: (f) => (
        <div>
          <p className="font-medium text-foreground text-sm">{f.label}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{f.key}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (f) => (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${TYPE_COLORS[f.type] || 'bg-muted'}`}>
          {f.type}
        </span>
      ),
    },
    {
      key: 'is_required',
      header: 'Required',
      render: (f) => (
        <StatusBadge
          status={f.is_required ? 'warning' : 'default'}
          label={f.is_required ? 'Required' : 'Optional'}
        />
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (f) => (
        <StatusBadge
          status={f.is_active ? 'success' : 'error'}
          label={f.is_active ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (f) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(f)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setDeleteId(f._id)}
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
          <h1 className="text-2xl font-bold text-foreground">Custom Fields</h1>
          <p className="text-sm text-muted-foreground">
            Define extra profile fields for users (department, team, etc.)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchFields}>
            <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Field
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Definitions</CardTitle>
          <CardDescription>These fields appear on user profile forms and admin user detail pages</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={fields}
            isLoading={isLoading}
            emptyMessage="No custom fields defined yet"
            emptyIcon={<ListChecks className="h-6 w-6 text-muted-foreground/50" />}
            emptyAction={
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus className="mr-2 h-3.5 w-3.5" /> Create your first field
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          {editId ? 'Edit Custom Field' : 'Create Custom Field'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Label</label>
                <Input
                  placeholder="e.g., Department"
                  value={form.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Key</label>
                <Input
                  placeholder="e.g., department"
                  value={form.key}
                  onChange={(e) => updateField('key', e.target.value)}
                  disabled={!!editId}
                  required
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">Unique identifier (auto-generated from label)</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value as FieldType)}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sort Order</label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {(form.type === 'select' || form.type === 'multiselect') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Options</label>
                <Input
                  placeholder="Engineering, Marketing, Sales, HR"
                  value={form.options}
                  onChange={(e) => updateField('options', e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Comma-separated list of allowed values</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input
                placeholder="Help text shown below the field"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Placeholder</label>
              <Input
                placeholder="Placeholder text inside the input"
                value={form.placeholder}
                onChange={(e) => updateField('placeholder', e.target.value)}
              />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_required}
                  onChange={(e) => updateField('is_required', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Required field
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Active
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editId ? 'Save Changes' : 'Create Field'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Custom Field"
        message="Are you sure? Existing user data for this field will not be deleted, but the field will no longer appear in forms."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
