'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { themeLabel } from '@/lib/themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch, errorMessage } from '@/lib/api-client';

type Character = {
  id: number;
  name: string;
  campaignId: number;
  isApproved: boolean | number;
};
type Campaign = {
  id: number;
  name: string;
  description: string;
  theme: string;
  isHidden: boolean | number;
};

export function CharacterList({
  characters,
  campaigns,
  userId,
}: {
  characters: Character[];
  campaigns: Campaign[];
  userId: number;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [info, setInfo] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const visibleCampaigns = campaigns.filter((c) => !c.isHidden);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, info, campaignId: Number(campaignId) }),
      });
      setShowCreate(false);
    } catch (err) {
      return setError(errorMessage(err, 'Failed to create character'));
    }
    setName('');
    setInfo('');
    setCampaignId('');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Characters</h1>
          <p className="text-sm text-muted-foreground">
            Select a character to explore its lore, sessions, and star map.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={visibleCampaigns.length === 0}
        >
          New Character
        </Button>
      </div>

      {characters.length === 0 && !showCreate && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              You have no characters yet. Create one to begin your journey in
              the Astryx Dominion.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {characters.map((c) => {
          const campaign = campaigns.find((ca) => ca.id === c.campaignId);
          return (
            <Card
              key={c.id}
              className="transition-colors hover:border-accent/50 hover:bg-accent/5"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  {c.isApproved ? (
                    <Badge>Approved</Badge>
                  ) : (
                    <Badge variant="secondary">Pending Approval</Badge>
                  )}
                </div>
                <CardDescription>
                  {campaign?.name || 'Unknown campaign'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {c.isApproved ? (
                  <Button onClick={() => router.push(`/ch/${c.id}/lore`)}>
                    Enter
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Waiting for admin approval
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New Character</CardTitle>
            <CardDescription>
              Choose a campaign to join and provide a little background.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select campaign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleCampaigns.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({themeLabel(c.theme)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Character name</Label>
                <Input
                  id="name"
                  placeholder="Captain Vale"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="info">Background info</Label>
                <Input
                  id="info"
                  placeholder="Optional — a short backstory for the DM"
                  value={info}
                  onChange={(e) => setInfo(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
