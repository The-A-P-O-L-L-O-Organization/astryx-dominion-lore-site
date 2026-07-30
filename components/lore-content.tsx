'use client';

import { useMemo } from 'react';

interface LoreContentProps {
  html: string;
  hiddenSectionIds: string[];
}

export function LoreContent({ html, hiddenSectionIds }: LoreContentProps) {
  const processedHtml = useMemo(() => {
    if (hiddenSectionIds.length === 0) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    for (const sectionId of hiddenSectionIds) {
      const el = doc.getElementById(sectionId);
      if (el) {
        el.innerHTML = `
          <div class="relative overflow-hidden" style="filter: blur(8px); user-select: none;">
            ${el.innerHTML}
          </div>
          <div class="text-center py-8 text-muted-foreground italic">
            Continue on your journey to unlock this
          </div>
        `;
      }
    }
    return doc.body.innerHTML;
  }, [html, hiddenSectionIds]);

  return (
    <div
      className="prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
