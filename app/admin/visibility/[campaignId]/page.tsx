'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PageRow {
  pagePath: string;
  isHidden: boolean | number;
  sections: SectionRow[];
}

interface SectionRow {
  sectionId: string;
  isHidden: boolean | number;
}

export default function AdminVisibilityPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const [campaignName, setCampaignName] = useState('');
  const [pages, setPages] = useState<PageRow[]>([]);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const router = useRouter();

  async function load() {
    const campRes = await fetch('/api/campaigns');
    const camps = await campRes.json();
    const camp = camps.find((c: any) => c.id === Number(campaignId));
    setCampaignName(camp?.name || '');

    const visRes = await fetch(`/api/visibility?campaignId=${campaignId}`);
    const vis = await visRes.json();

    const pageMap = new Map<string, PageRow>();
    for (const p of vis.pages) {
      pageMap.set(p.pagePath, { ...p, sections: [] });
    }
    for (const s of vis.sections || []) {
      const page = pageMap.get(s.pagePath);
      if (page) page.sections.push(s);
    }
    setPages(Array.from(pageMap.values()));
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePage(pagePath: string, currentHidden: boolean | number) {
    await fetch('/api/visibility', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page',
        campaignId: Number(campaignId),
        pagePath,
        isHidden: !currentHidden,
      }),
    });
    load();
  }

  async function toggleSection(
    pagePath: string,
    sectionId: string,
    currentHidden: boolean | number,
  ) {
    await fetch('/api/visibility', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'section',
        campaignId: Number(campaignId),
        pagePath,
        sectionId,
        isHidden: !currentHidden,
      }),
    });
    load();
  }

  function toggleExpand(pagePath: string) {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pagePath)) next.delete(pagePath);
      else next.add(pagePath);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/campaigns')}>
          &larr; Back
        </Button>
        <h1 className="text-3xl font-bold">Visibility: {campaignName}</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Toggle which pages and sections are visible to players. Default: hidden.
      </p>

      <div className="space-y-2">
        {pages.map((page) => (
          <Card key={page.pagePath}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleExpand(page.pagePath)}
                  className="flex items-center gap-2 text-left"
                >
                  {expandedPages.has(page.pagePath) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">{page.pagePath}</span>
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant={page.isHidden ? 'secondary' : 'default'}>
                    {page.isHidden ? 'Hidden' : 'Visible'}
                  </Badge>
                  <Button
                    size="sm"
                    variant={page.isHidden ? 'default' : 'outline'}
                    onClick={() => togglePage(page.pagePath, page.isHidden)}
                  >
                    {page.isHidden ? 'Show' : 'Hide'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {expandedPages.has(page.pagePath) && page.sections.length > 0 && (
              <CardContent className="pt-0 pb-3">
                <div className="ml-6 space-y-1">
                  {page.sections.map((section) => (
                    <div
                      key={section.sectionId}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-muted-foreground">
                        {section.sectionId}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={section.isHidden ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {section.isHidden ? 'Hidden' : 'Visible'}
                        </Badge>
                        <Button
                          size="sm"
                          variant={section.isHidden ? 'default' : 'outline'}
                          className="h-7 text-xs"
                          onClick={() =>
                            toggleSection(
                              page.pagePath,
                              section.sectionId,
                              section.isHidden,
                            )
                          }
                        >
                          {section.isHidden ? 'Show' : 'Hide'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
