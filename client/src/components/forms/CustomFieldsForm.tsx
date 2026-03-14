import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Save, ListChecks } from 'lucide-react';
import api from '@/lib/api/client';
import { CUSTOM_FIELDS } from '@/lib/api/endpoints';
import type { CustomField } from '@/types';

interface CustomFieldsFormProps {
  /** Current custom_fields values from user profile */
  values: Record<string, any>;
  /** Called with updated values to save */
  onSave: (customFields: Record<string, any>) => Promise<void>;
  /** Read-only mode */
  readOnly?: boolean;
}

export function CustomFieldsForm({ values, onSave, readOnly }: CustomFieldsFormProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>(values || {});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get(CUSTOM_FIELDS.ACTIVE)
      .then((res) => {
        const data = res.data.data;
        setFields(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFormValues(values || {});
  }, [values]);

  const handleChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of fields) {
      if (field.is_required && !formValues[field.key]) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(formValues);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return null;
  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <CardTitle>Additional Information</CardTitle>
        </div>
        <CardDescription>Custom profile fields defined by your administrator</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <FieldRenderer
                key={field._id}
                field={field}
                value={formValues[field.key]}
                onChange={(v) => handleChange(field.key, v)}
                readOnly={readOnly}
              />
            ))}
          </div>

          {!readOnly && (
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSaving}>
                <Save className="h-4 w-4 mr-2" /> Save Custom Fields
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}) {
  const label = (
    <label className="block text-sm font-medium text-foreground">
      {field.label}
      {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const desc = field.description ? (
    <p className="text-[10px] text-muted-foreground mt-0.5">{field.description}</p>
  ) : null;

  switch (field.type) {
    case 'text':
    case 'url':
    case 'email':
      return (
        <div className="space-y-1">
          {label}
          <Input
            type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder || ''}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
          {desc}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1">
          {label}
          <Input
            type="number"
            placeholder={field.placeholder || ''}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            disabled={readOnly}
          />
          {desc}
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1">
          {label}
          <Input
            type="date"
            value={value ? String(value).slice(0, 10) : ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
          {desc}
        </div>
      );

    case 'boolean':
      return (
        <div className="space-y-1">
          {label}
          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={readOnly}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
          </label>
          {desc}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1">
          {label}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {desc}
        </div>
      );

    case 'multiselect':
      return (
        <div className="space-y-1 sm:col-span-2">
          {label}
          <div className="flex flex-wrap gap-2 mt-1">
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const arr = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) arr.push(opt);
                      else arr.splice(arr.indexOf(opt), 1);
                      onChange(arr);
                    }}
                    disabled={readOnly}
                    className="sr-only"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          {desc}
        </div>
      );

    default:
      return (
        <div className="space-y-1">
          {label}
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
          {desc}
        </div>
      );
  }
}
