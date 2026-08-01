'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Character {
  id: number;
  userId: number;
  campaignId: number;
  name: string;
  info: string;
  isApproved: boolean | number;
  createdAt: string;
}

export default function AdminCharactersPage() {
  const [chars, setChars] = useState<Character[]>([]);
  const router = useRouter();

  async function fetchChars() {
    const res = await fetch('/api/characters');
    return res.json();
  }

  async function load() {
    setChars(await fetchChars());
  }

  useEffect(() => {
    let ignore = false;
    fetchChars().then((data) => {
      if (!ignore) setChars(data);
    });
    return () => {
      ignore = true;
    };
  }, []);

  async function approve(id: number, approved: boolean) {
    await fetch('/api/characters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isApproved: approved }),
    });
    load();
  }

  const pending = chars.filter((c) => !c.isApproved);
  const approved = chars.filter((c) => c.isApproved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Characters</h1>
        <p className="text-sm text-muted-foreground">
          Review character applications and approve players.
        </p>
      </div>

      <h2 className="text-lg font-semibold tracking-tight">
        Pending Approval ({pending.length})
      </h2>
      {pending.map((c) => (
        <Card key={c.id} className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{c.name}</CardTitle>
            <CardDescription>Campaign #{c.campaignId}</CardDescription>
          </CardHeader>
          <CardContent>
            {c.info && <p className="text-sm mb-2">{c.info}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => approve(c.id, true)}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => approve(c.id, false)}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-lg font-semibold tracking-tight">
        Approved ({approved.length})
      </h2>
      {approved.map((c) => (
        <Card key={c.id} className="mb-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{c.name}</CardTitle>
              <Badge>Approved</Badge>
            </div>
            <CardDescription>Campaign #{c.campaignId}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
