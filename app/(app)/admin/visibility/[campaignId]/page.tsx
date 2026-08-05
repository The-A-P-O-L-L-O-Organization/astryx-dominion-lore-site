'use client';

import { useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson, requestJson } from '@/lib/api-client';
import { useAsyncData } from '@/hooks/use-async-data';
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
  pagePath: string;
  isHidden: boolean | number;
}

interface CampaignRow {
  id: number;
  name: string;
}

interface VisibilityResponse {
  pages: PageRow[];
  sections: SectionRow[];
}

interface VisibilityView {
  name: string;
  pages: PageRow[];
}

export default function AdminVisibilityPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const router = useRouter();

  const fetchData = useCallback(async (): Promise<VisibilityView> => {
    const camps = await fetchJson<CampaignRow[]>('/api/campaigns');
    const camp = camps.find((c) => c.id === Number(campaignId));

    const vis = await fetchJson<VisibilityResponse>(
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

  const {
    data: { name: campaignName, pages },
    reload,
  } = useAsyncData<VisibilityView>(fetchData, { name: '', pages: [] });

  async function togglePage(pagePath: string, currentHidden: boolean | number) {
    await requestJson('/api/visibility', 'PUT', {
      type: 'page',
      campaignId: Number(campaignId),
      pagePath,
      isHidden: !currentHidden,
    });
    reload();
  }

  async function toggleSection(
    pagePath: string,
    sectionId: string,
    currentHidden: boolean | number,
  ) {
    await requestJson('/api/visibility', 'PUT', {
      type: 'section',
      campaignId: Number(campaignId),
      pagePath,
      sectionId,
      isHidden: !currentHidden,
    });
    reload();
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
