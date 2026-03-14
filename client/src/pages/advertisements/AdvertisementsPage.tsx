import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCcw,
  Megaphone,
  Eye,
  MousePointerClick,
  Image,
  Code,
  FileCode2,
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
import { ADS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { Advertisement, AdPosition, AdType } from '@/types';

const POSITIONS: { value: AdPosition; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'content_top', label: 'Content Top' },
  { value: 'content_bottom', label: 'Content Bottom' },
  { value: 'footer', label: 'Footer' },
  { value: 'popup', label: 'Popup' },
];

const AD_TYPES: { value: AdType; label: string; icon: React.ReactNode }[] = [
  { value: 'image', label: 'Image Banner', icon: <Image className="h-4 w-4" /> },
  { value: 'html', label: 'HTML Content', icon: <Code className="h-4 w-4" /> },
  { value: 'script', label: 'Ad Script', icon: <FileCode2 className="h-4 w-4" /> },
];

interface FormState {
  title: string;
  type: AdType;
  position: AdPosition;
  image_url: string;
  link_url: string;
  html_content: string;
  script_content: string;
  alt_text: string;
  priority: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  target_pages: string;
}

const emptyForm: FormState = {
  title: '',
  type: 'image',
  position: 'header',
  image_url: '',
  link_url: '',
  html_content: '',
  script_content: '',
  alt_text: '',
  priority: 0,
  is_active: true,
  start_date: '',
  end_date: '',
  target_pages: '',
};

export default function AdvertisementsPage() {
  useDocumentTitle('Advertisements');

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(ADS.LIST);
      setAds(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      handleApiError(error, 'Failed to fetch advertisements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (ad: Advertisement) => {
    setEditId(ad._id);
    setForm({
      title: ad.title,
      type: ad.type,
      position: ad.position,
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      html_content: ad.html_content || '',
      script_content: ad.script_content || '',
      alt_text: ad.alt_text || '',
      priority: ad.priority,
      is_active: ad.is_active,
      start_date: ad.start_date ? ad.start_date.slice(0, 10) : '',
      end_date: ad.end_date ? ad.end_date.slice(0, 10) : '',
      target_pages: ad.target_pages?.join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = {
      title: form.title,
      type: form.type,
      position: form.position,
      priority: form.priority,
      is_active: form.is_active,
    };

    if (form.image_url) payload.image_url = form.image_url;
    if (form.link_url) payload.link_url = form.link_url;
    if (form.html_content) payload.html_content = form.html_content;
    if (form.script_content) payload.script_content = form.script_content;
    if (form.alt_text) payload.alt_text = form.alt_text;
    if (form.start_date) payload.start_date = form.start_date;
    if (form.end_date) payload.end_date = form.end_date;
    if (form.target_pages.trim()) {
      payload.target_pages = form.target_pages.split(',').map((s) => s.trim()).filter(Boolean);
    }

    try {
      if (editId) {
        await api.patch(ADS.UPDATE(editId), payload);
        toast.success('Advertisement updated');
      } else {
        await api.post(ADS.CREATE, payload);
        toast.success('Advertisement created');
      }
      setIsModalOpen(false);
      fetchAds();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(ADS.TOGGLE(id));
      toast.success('Status toggled');
      fetchAds();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(ADS.DELETE(deleteId));
      toast.success('Advertisement deleted');
      setDeleteId(null);
      fetchAds();
    } catch (error) {
      handleApiError(error);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getCtr = (ad: Advertisement) => {
    if (ad.impressions === 0) return '0%';
    return ((ad.clicks / ad.impressions) * 100).toFixed(1) + '%';
  };

  const columns: Column<Advertisement>[] = [
    {
      key: 'title',
      header: 'Ad',
      render: (ad) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {ad.type === 'image' ? (
              ad.image_url ? (
                <img src={ad.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <Image className="h-4 w-4 text-primary" />
              )
            ) : ad.type === 'html' ? (
              <Code className="h-4 w-4 text-primary" />
            ) : (
              <FileCode2 className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{ad.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                {ad.position.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">{ad.type}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'impressions',
      header: 'Performance',
      render: (ad) => (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground" title="Impressions">
            <Eye className="h-3.5 w-3.5" /> {ad.impressions.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground" title="Clicks">
            <MousePointerClick className="h-3.5 w-3.5" /> {ad.clicks.toLocaleString()}
          </span>
          <span className="font-semibold text-foreground" title="CTR">
            {getCtr(ad)}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (ad) => (
        <span className="font-mono text-sm">{ad.priority}</span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (ad) => (
        <StatusBadge
          status={ad.is_active ? 'success' : 'error'}
          label={ad.is_active ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (ad) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={ad.is_active ? 'Disable' : 'Enable'}
            onClick={() => handleToggle(ad._id)}
          >
            {ad.is_active ? (
              <ToggleRight className="h-4 w-4 text-green-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(ad)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setDeleteId(ad._id)}
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
          <h1 className="text-2xl font-bold text-foreground">Advertisements</h1>
          <p className="text-sm text-muted-foreground">
            Manage ad banners, scripts, and placement across the site
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchAds} title="Refresh">
            <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Ad
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Ads</p>
                <p className="text-2xl font-bold">{ads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{ads.reduce((s, a) => s + a.impressions, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <MousePointerClick className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{ads.reduce((s, a) => s + a.clicks, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Advertisements</CardTitle>
          <CardDescription>Manage banners, HTML snippets, and third-party ad scripts</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={ads}
            isLoading={isLoading}
            emptyMessage="No advertisements configured yet."
          />
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          {editId ? 'Edit Advertisement' : 'Create Advertisement'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                placeholder="e.g., Summer Sale Banner"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
              />
            </div>

            {/* Type + Position */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value as AdType)}
                >
                  {AD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Position</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.position}
                  onChange={(e) => updateField('position', e.target.value as AdPosition)}
                >
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type-specific fields */}
            {form.type === 'image' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Image URL</label>
                  <Input
                    placeholder="https://cdn.example.com/banner.png"
                    value={form.image_url}
                    onChange={(e) => updateField('image_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Link URL</label>
                  <Input
                    placeholder="https://example.com/promo"
                    value={form.link_url}
                    onChange={(e) => updateField('link_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Alt Text</label>
                  <Input
                    placeholder="Descriptive text for accessibility"
                    value={form.alt_text}
                    onChange={(e) => updateField('alt_text', e.target.value)}
                  />
                </div>
              </>
            )}

            {form.type === 'html' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">HTML Content</label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder='<div class="ad">...</div>'
                  value={form.html_content}
                  onChange={(e) => updateField('html_content', e.target.value)}
                />
              </div>
            )}

            {form.type === 'script' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ad Script</label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder='<script async src="https://pagead2.googlesyndication.com/..."></script>'
                  value={form.script_content}
                  onChange={(e) => updateField('script_content', e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Paste your AdSense, Media.net, or other ad network code here
                </p>
              </div>
            )}

            {/* Priority + Active */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.priority}
                  onChange={(e) => updateField('priority', parseInt(e.target.value) || 0)}
                />
                <p className="text-[10px] text-muted-foreground">Higher = shown first</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateField('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{form.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">End Date</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateField('end_date', e.target.value)}
                />
              </div>
            </div>

            {/* Target Pages */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Target Pages</label>
              <Input
                placeholder="/dashboard, /users (leave empty for all pages)"
                value={form.target_pages}
                onChange={(e) => updateField('target_pages', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground italic">
                Comma-separated page paths. Empty = show on all pages.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editId ? 'Save Changes' : 'Create Ad'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Advertisement"
        message="Are you sure you want to delete this ad? All impression and click data will be lost."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
