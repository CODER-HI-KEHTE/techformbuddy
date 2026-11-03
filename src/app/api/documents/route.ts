import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getDb, generateId } from '@/lib/db';
import { encryptDocument } from '@/lib/encryption';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const db = getDb();

  const documents = db.prepare(
    'SELECT id, file_name, file_type, file_size, extracted_data, uploaded_at FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC'
  ).all(userId);

  return Response.json(documents);
}

// Filename-based classification only. File contents are encrypted and stored, not OCR-processed.
function classifyDocument(fileName: string) {
  const nameLower = fileName.toLowerCase();
  let docType = 'General Document';

  if (nameLower.includes('aadhaar') || nameLower.includes('aadhar') || nameLower.includes('uidai')) {
    docType = 'Aadhaar Card';
  } else if (nameLower.includes('pan') || nameLower.includes('income_tax') || nameLower.includes('nsdl')) {
    docType = 'PAN Card';
  } else if (nameLower.includes('passport')) {
    docType = 'Passport';
  } else if (nameLower.includes('driving') || nameLower.includes('license') || nameLower.includes('dl')) {
    docType = 'Driving License';
  } else if (nameLower.includes('voter') || nameLower.includes('epic') || nameLower.includes('election')) {
    docType = 'Voter ID Card';
  } else if (nameLower.includes('bill') || nameLower.includes('electricity') || nameLower.includes('water') || nameLower.includes('rent')) {
    docType = 'Address / Utility Proof';
  } else if (nameLower.includes('resume') || nameLower.includes('cv') || nameLower.includes('biodata')) {
    docType = 'Resume / Bio-Data';
  } else if (nameLower.includes('certificate') || nameLower.includes('degree') || nameLower.includes('marksheet')) {
    docType = 'Educational Certificate';
  }

  return {
    docType,
    extracted: {
      documentType: docType,
      processingStatus: 'stored_only_contents_not_analyzed',
    },
  };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size === 0) {
      return Response.json({ error: 'The uploaded file is empty' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'Files must be 10 MB or smaller' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Store documents encrypted at rest using AES-256-GCM (Requirement 3)
    const encryptedBuffer = encryptDocument(buffer);
    const db = getDb();
    const docId = generateId();

    // Classification uses only the filename; do not infer identity values or update the profile.
    const { docType, extracted } = classifyDocument(file.name);
    const extractedDataJson = JSON.stringify(extracted);

    // Save document with extracted data (encrypted at rest, owner accessible only)
    db.prepare(
      'INSERT INTO documents (id, user_id, file_name, file_type, file_size, file_data, extracted_data) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(docId, userId, file.name, file.type, file.size, encryptedBuffer, extractedDataJson);

    // Create a real-time notification
    const notifId = generateId();
    db.prepare(
      'INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      notifId,
      userId,
      `Document Processed: ${file.name}`,
      `${docType} was classified from the filename and stored encrypted. File contents were not analyzed and profile data was not changed.`,
      'success',
      '/documents'
    );

    return Response.json({
      id: docId,
      message: 'Document uploaded and stored securely. File contents were not analyzed.',
      docType,
      extracted
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await request.json();
  const db = getDb();

  db.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?').run(id, userId);

  return Response.json({ message: 'Document deleted' });
}
