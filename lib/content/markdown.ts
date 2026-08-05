import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';

const processor = remark()
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize)
  .use(rehypeSlug)
  .use(rehypeStringify);

export function renderMarkdown(markdown: string): string {
  return String(processor.processSync(markdown));
}

export function extractHeadingIds(html: string): string[] {
  const headingRegex = /<h([1-6])[^>]*id="([^"]+)"[^>]*>/gi;
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    ids.push(match[2]);
  }
  return ids;
}
