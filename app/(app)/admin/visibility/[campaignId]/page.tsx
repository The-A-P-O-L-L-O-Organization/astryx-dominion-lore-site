'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { apiFetch, apiJson, errorMessage } from '@/lib/api-client';

interface PageRow {
  pagePath: string;
  isHidden: boolean | number;
  sections: SectionRow[];
}

interface SectionRow {
  sectionId: string;
  pagePath: string;
  isHidden: boolean | number;
}

interface CampaignRow {
  id: number;
  name: string;
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
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const camps = await apiJson<CampaignRow[]>('/api/campaigns');
    const camp = camps.find((c) => c.id === Number(campaignId));

    const vis = await apiJson<{ pages: PageRow[]; sections: SectionRow[] }>(
      `/api/visibility?campaignId=${campaignId}`,
    );

    const pageMap = new Map<string, PageRow>();
    for (const p of vis.pages) {
      pageMap.set(p.pagePath, { ...p, sections: [] });
    }
    for (const s of vis.sections || []) {
      const page = pageMap.get(s.pagePath);
      if (page) page.sections.push(s);
    }
    return { name: camp?.name || '', pages: Array.from(pageMap.values()) };
  }, [campaignId]);

  async function load() {
    try {
      const { name, pages } = await fetchData();
      setCampaignName(name);
      setPages(pages);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load visibility settings'));
    }
  }

  useEffect(() => {
    let ignore = false;
    fetchData()
      .then(({ name, pages }) => {
        if (!ignore) {
          setCampaignName(name);
          setPages(pages);
        }
      })
      .catch((err) => {
        if (!ignore)
          setError(errorMessage(err, 'Failed to load visibility settings'));
      });
    return () => {
      ignore = true;
    };
  }, [fetchData]);

  async function togglePage(pagePath: string, currentHidden: boolean | number) {
    try {
      await apiFetch('/api/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'page',
          campaignId: Number(campaignId),
          pagePath,
          isHidden: !currentHidden,
        }),
      });
    } catch (err) {
      setError(errorMessage(err, 'Failed to update page visibility'));
      return;
    }
    load();
  }

  async function toggleSection(
    pagePath: string,
    sectionId: string,
    currentHidden: boolean | number,
  ) {
    try {
      await apiFetch('/api/visibility', {
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
    } catch (err) {
      setError(errorMessage(err, 'Failed to update section visibility'));
      return;
    }
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/admin/campaigns')}>
          &larr; Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Visibility: {campaignName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Toggle which pages and sections are visible to players. Default:
            hidden.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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
