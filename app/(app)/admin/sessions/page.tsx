'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { apiFetch, apiJson, errorMessage } from '@/lib/api-client';

interface SessionNote {
  id: number;
  campaignId: number;
  slug: string;
  title: string;
  contentMd: string;
  source: string;
  isDmOnly: boolean | number;
  createdAt: string;
}
interface Campaign {
  id: number;
  name: string;
}

export default function AdminSessionsPage() {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    slug: '',
    title: '',
    contentMd: '',
    isDmOnly: false,
  });
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    apiJson<Campaign[]>('/api/campaigns')
      .then((data) => {
        if (!ignore) setCampaigns(data);
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err, 'Failed to load campaigns'));
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function fetchNotes(campaignId: string) {
    if (!campaignId) return [];
    return apiJson<SessionNote[]>(`/api/sessions?campaignId=${campaignId}`);
  }

  async function loadNotes(campaignId: string) {
    try {
      setNotes(await fetchNotes(campaignId));
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load session notes'));
    }
  }

  useEffect(() => {
    let ignore = false;
    fetchNotes(selectedCampaign)
      .then((data) => {
        if (!ignore) setNotes(data);
      })
      .catch((err) => {
        if (!ignore)
          setError(errorMessage(err, 'Failed to load session notes'));
      });
    return () => {
      ignore = true;
    };
  }, [selectedCampaign]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = editId
      ? { id: editId, ...form, campaignId: Number(selectedCampaign) }
      : { ...form, campaignId: Number(selectedCampaign) };
    try {
      await apiFetch('/api/sessions', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      setError(errorMessage(err, 'Failed to save session note'));
      return;
    }
    setShowNew(false);
    setEditId(null);
    setForm({ slug: '', title: '', contentMd: '', isDmOnly: false });
    loadNotes(selectedCampaign);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this note?')) return;
    try {
      await apiFetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete session note'));
      return;
    }
    loadNotes(selectedCampaign);
  }

  function startEdit(n: SessionNote) {
    setEditId(n.id);
    setForm({
      slug: n.slug,
      title: n.title,
      contentMd: n.contentMd,
      isDmOnly: !!n.isDmOnly,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Session Notes</h1>
        <p className="text-sm text-muted-foreground">
          Author session logs and DM-only notes for a campaign.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Select
        value={selectedCampaign}
        onValueChange={(v) => {
          setSelectedCampaign(v);
          setShowNew(false);
          setEditId(null);
        }}
      >
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select campaign..." />
        </SelectTrigger>
        <SelectContent>
          {campaigns.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCampaign && (
        <>
          <Button
            onClick={() => {
              setShowNew(true);
              setEditId(null);
              setForm({ slug: '', title: '', contentMd: '', isDmOnly: false });
            }}
          >
            New Note
          </Button>

          {(showNew || editId) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editId ? 'Edit Note' : 'New Note'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Slug (url-friendly)"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required={!editId}
                  />
                  <Input
                    placeholder="Title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                  <Textarea
                    placeholder="Content (markdown)"
                    value={form.contentMd}
                    onChange={(e) =>
                      setForm({ ...form, contentMd: e.target.value })
                    }
                    className="min-h-[200px]"
                    required
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={form.isDmOnly}
                      onCheckedChange={(v) => setForm({ ...form, isDmOnly: v })}
                    />
                    DM Only (not visible to players)
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit">{editId ? 'Save' : 'Create'}</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNew(false);
                        setEditId(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {notes.map((n) => (
              <Card key={n.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{n.title}</CardTitle>
                    <div className="flex gap-2">
                      {n.isDmOnly ? (
                        <Badge variant="secondary">DM Only</Badge>
                      ) : (
                        <Badge>Shared</Badge>
                      )}
                      {n.source === 'git' && (
                        <Badge variant="outline">From Repo</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    /{n.slug}
                  </p>
                  {n.source !== 'git' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(n)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(n.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
