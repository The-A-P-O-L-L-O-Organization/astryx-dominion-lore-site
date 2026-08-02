import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { sessionNotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const CONTENT_DIR = process.env.CONTENT_DIR || '/data/repos';

export interface SessionNoteFile {
  campaignId: number;
  slug: string;
  title: string;
  contentMd: string;
  isDmOnly: boolean;
}

export function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function listSessionNotes(campaignId: number, canSeeDmOnly: boolean) {
  const where = canSeeDmOnly
    ? eq(sessionNotes.campaignId, campaignId)
    : and(
        eq(sessionNotes.campaignId, campaignId),
        eq(sessionNotes.isDmOnly, false),
      );
  return db.select().from(sessionNotes).where(where).all();
}

export async function writeSessionNoteFile(
  note: SessionNoteFile,
): Promise<boolean> {
  const repoDir = path.join(
    CONTENT_DIR,
    String(note.campaignId),
    'session-notes',
  );
  if (!existsSync(repoDir)) await mkdir(repoDir, { recursive: true });

  const repoDirResolved = path.resolve(repoDir);
  const notePath = path.resolve(
    repoDirResolved,
    `${sanitizeSlug(note.slug)}.md`,
  );
  if (!notePath.startsWith(repoDirResolved + path.sep)) return false;

  await writeFile(
    notePath,
    `---\ntitle: ${note.title}\nis_dm_only: ${note.isDmOnly}\nslug: ${note.slug}\n---\n\n${note.contentMd}`,
  );
  return true;
}
