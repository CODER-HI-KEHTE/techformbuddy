import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getDb, generateId } from '@/lib/db';

export interface DiscoveredNotice {
  id: string;
  title: string;
  date: string | null;
  link: string | null;
  classification: 'application_open' | 'deadline' | 'result' | 'admit_card' | 'notification' | 'other';
}

function parseOfficialHttpsUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const allowedDomain = ['.gov.in', '.nic.in', '.ac.in', '.edu.in'].some((suffix) => hostname.endsWith(suffix));
    if (parsed.protocol !== 'https:' || !allowedDomain || parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, url } = body;

    const db = getDb();
    let sourceRecord: any = null;

    if (sourceId) {
      sourceRecord = db.prepare('SELECT * FROM watch_sources WHERE id = ?').get(sourceId);
    } else if (url) {
      sourceRecord = db.prepare('SELECT * FROM watch_sources WHERE url = ?').get(url);
    }

    const targetUrl = sourceRecord?.url;
    const targetName = sourceRecord?.name || 'Selected Portal';

    if (!sourceRecord || !targetUrl) {
      return NextResponse.json(
        { error: 'A registered portal source is required for discovery' },
        { status: 404 }
      );
    }

    const parsedTarget = parseOfficialHttpsUrl(targetUrl);
    if (!parsedTarget) {
      return NextResponse.json(
        { error: 'Unsupported portal URL', message: 'Discovery is limited to HTTPS government and education portals.' },
        { status: 400 }
      );
    }

    // Check if we have recent notices in watch_notices table
    let discovered: DiscoveredNotice[] = [];

    // If stored notices are generic nav links, filter them
    const isGenericNav = (t: string) => /skip to|hyperlink policy|structure|chairman|member|login|back to home/i.test(t);

    if (sourceRecord?.id) {
      const storedNotices = db.prepare(
        'SELECT id, title, notice_date, link, classification FROM watch_notices WHERE source_id = ? ORDER BY created_at DESC LIMIT 20'
      ).all(sourceRecord.id) as Array<any>;

      const validNotices = storedNotices.filter(n => !isGenericNav(n.title) && n.link && parseOfficialHttpsUrl(n.link));
      if (validNotices.length > 0) {
        discovered = validNotices.map(n => ({
          id: n.id,
          title: n.title,
          date: n.notice_date || null,
          link: parseOfficialHttpsUrl(n.link)?.toString() || null,
          classification: n.classification || 'notification',
        }));
      }
    }

    // Try fetching live page once
    if (discovered.length === 0) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        let res: Response;
        try {
          res = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TechFormBuddy-Discover/1.0' },
            signal: controller.signal,
            redirect: 'manual',
          });
        } finally {
          clearTimeout(timer);
        }

        const contentLength = Number(res.headers.get('content-length') || 0);
        if (res.ok && contentLength <= 2 * 1024 * 1024 && res.headers.get('content-type')?.toLowerCase().includes('text/html')) {
          const html = await res.text();
          // Extract anchor links with notice titles
          const regex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
          let match;
          const seen = new Set<string>();
          while ((match = regex.exec(html)) !== null && discovered.length < 10) {
            const linkHref = match[1];
            const cleanText = match[2].replace(/<[^>]+>/g, '').trim();
            if (
              cleanText.length >= 15 &&
              cleanText.length <= 160 &&
              !seen.has(cleanText) &&
              /(exam|admit|result|recruit|notif|apply|service|calendar|202)/i.test(cleanText)
            ) {
              seen.add(cleanText);
              let safeLink: URL | null = null;
              try {
                safeLink = parseOfficialHttpsUrl(new URL(linkHref, parsedTarget).toString());
              } catch {}
              if (!safeLink) continue;
              discovered.push({
                id: `live-${generateId()}`,
                title: cleanText,
                date: null,
                link: safeLink.toString(),
                classification: /result/i.test(cleanText) ? 'result' : /admit/i.test(cleanText) ? 'admit_card' : /apply/i.test(cleanText) ? 'application_open' : 'notification',
              });
            }
          }
        }
      } catch (fetchErr) {
        console.warn('[Discovery Fetch Warning]:', fetchErr);
      }
    }

    return NextResponse.json({
      source: {
        id: sourceRecord?.id || 'custom-source',
        name: targetName,
        url: targetUrl,
        isVerified: Boolean(sourceRecord?.is_verified ?? 1),
      },
      notices: discovered,
      unavailable: discovered.length === 0,
    });
  } catch (err: any) {
    console.error('[Discover Error]:', err);
    return NextResponse.json(
      { error: 'Failed to discover notices', message: err.message },
      { status: 500 }
    );
  }
}
