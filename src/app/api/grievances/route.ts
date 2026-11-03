import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getDb, generateId } from '@/lib/db';
import { checkAccountPermission } from '@/lib/authGuard';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const db = getDb();

  const grievances = db.prepare(
    'SELECT * FROM grievances WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);

  return Response.json(grievances);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const permission = checkAccountPermission(userId, 'submit_grievance');
  if (!permission.allowed) {
    return Response.json({ error: permission.reason, requiresVerification: true }, { status: 403 });
  }
  const body = await request.json();
  const { title, domain, department, description, language = 'en', priority = 'medium' } = body;

  if (!title || !description) {
    return Response.json({ error: 'Title and description are required' }, { status: 400 });
  }

  const db = getDb();
  const id = generateId();
  const trackingNumber = `TFB-${domain ? domain.toUpperCase().slice(0, 3) : 'GRV'}-${Math.floor(100000 + Math.random() * 900000)}`;

  db.prepare(`
    INSERT INTO grievances (
      id, user_id, tracking_number, title, domain, department, description, language, status, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)
  `).run(id, userId, trackingNumber, title, domain || 'general', department || 'General Services', description, language, priority);

  // Insert a notification
  const notifId = generateId();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    notifId,
    userId,
    `Service Request Filed: ${trackingNumber}`,
    `Your request regarding "${title}" has been submitted. Status: Under Review.`,
    'info',
    '/assistant'
  );

  return Response.json({
    id,
    trackingNumber,
    message: 'Grievance / Service Request created successfully',
  }, { status: 201 });
}
