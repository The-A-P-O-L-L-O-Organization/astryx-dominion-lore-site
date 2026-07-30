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
import { Badge } from '@/components/ui/badge';

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
    const res = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, info, campaignId: Number(campaignId) }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Failed to create');
    setShowCreate(false);
    setName('');
    setInfo('');
    setCampaignId('');
    router.refresh();
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Astryx Dominion</h1>
      <p className="text-muted-foreground mb-6">Your Characters</p>

      {characters.length === 0 && !showCreate && (
        <p className="text-muted-foreground mb-4">
          You have no characters yet.
        </p>
      )}

      <div className="grid gap-4 mb-8">
        {characters.map((c) => {
          const campaign = campaigns.find((ca) => ca.id === c.campaignId);
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  {c.isApproved ? (
                    <Badge variant="default">Approved</Badge>
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

      {!showCreate && (
        <Button
          onClick={() => setShowCreate(true)}
          disabled={visibleCampaigns.length === 0}
        >
          Create Character
        </Button>
      )}

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Character</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                required
              >
                <option value="">Select campaign...</option>
                {visibleCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.theme})
                  </option>
                ))}
              </select>
              <Input
                placeholder="Character name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                placeholder="Background info (optional)"
                value={info}
                onChange={(e) => setInfo(e.target.value)}
              />
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
