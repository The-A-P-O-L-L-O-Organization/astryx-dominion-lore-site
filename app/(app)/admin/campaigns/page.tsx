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
import { Switch } from '@/components/ui/switch';

interface Campaign {
  id: number;
  name: string;
  description: string;
  loreRepoUrl: string;
  theme: string;
  isHidden: boolean | number;
  starMapConfig: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    loreRepoUrl: '',
    theme: 'sci-fi',
    isHidden: false,
    starMapConfig: '{}',
  });
  const router = useRouter();

  async function load() {
    const res = await fetch('/api/campaigns');
    setCampaigns(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const method = editId ? 'PUT' : 'POST';
    const body = editId ? { id: editId, ...form } : form;
    await fetch('/api/campaigns', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setShowNew(false);
    setEditId(null);
    setForm({
      name: '',
      description: '',
      loreRepoUrl: '',
      theme: 'sci-fi',
      isHidden: false,
      starMapConfig: '{}',
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this campaign?')) return;
    await fetch('/api/campaigns', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function startEdit(c: Campaign) {
    setEditId(c.id);
    setForm({
      name: c.name,
      description: c.description,
      loreRepoUrl: c.loreRepoUrl,
      theme: c.theme,
      isHidden: !!c.isHidden,
      starMapConfig: c.starMapConfig,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Manage campaigns, lore repositories, and visibility.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowNew(true);
            setEditId(null);
            setForm({
              name: '',
              description: '',
              loreRepoUrl: '',
              theme: 'sci-fi',
              isHidden: false,
              starMapConfig: '{}',
            });
          }}
        >
          New Campaign
        </Button>
      </div>

      {(showNew || editId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editId ? 'Edit Campaign' : 'New Campaign'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <Input
                placeholder="Lore Repo URL"
                value={form.loreRepoUrl}
                onChange={(e) =>
                  setForm({ ...form, loreRepoUrl: e.target.value })
                }
                required
              />
              <Select
                value={form.theme}
                onValueChange={(v) => setForm({ ...form, theme: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sci-fi">Sci-fi</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.isHidden}
                  onCheckedChange={(v) => setForm({ ...form, isHidden: v })}
                />
                Hidden from character creation
              </label>
              <Input
                placeholder="Star map config (JSON)"
                value={form.starMapConfig}
                onChange={(e) =>
                  setForm({ ...form, starMapConfig: e.target.value })
                }
              />
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

      <div className="grid gap-4">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{c.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge>{c.theme}</Badge>
                  {c.isHidden ? (
                    <Badge variant="secondary">Hidden</Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{c.loreRepoUrl}</p>
              <p className="text-sm mt-1">{c.description}</p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(c)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(c.id)}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/visibility/${c.id}`)}
                >
                  Visibility
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
