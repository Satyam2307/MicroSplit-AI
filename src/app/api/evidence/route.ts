// POST /api/evidence – Upload evidence
// POST /api/evidence/:id/extract – Run AI extraction
import { NextRequest, NextResponse } from 'next/server';
import { mockEvidence, mockContributions } from '@/lib/mock-data';
import CryptoJS from 'crypto-js';
import { getPrisma } from '@/lib/prisma';
import { requireAuthenticatedActor, requireSquadRole } from '@/lib/authorization';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'text/plain', 'audio/mpeg', 'audio/wav'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { squadId, kind, fileName, fileUrl, mimeType, sizeBytes } = body;

    if (!squadId || !kind || !fileName) {
      return NextResponse.json(
        { success: false, error: 'squadId, kind, and fileName are required' },
        { status: 400 }
      );
    }

    const access = await requireSquadRole(squadId, ['owner', 'approver', 'contributor']);
    if (!access.ok) return access.response;

    // Validate file type
    if (mimeType && !ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: `File type ${mimeType} not allowed. Accepted: PDF, PNG, JPG, CSV, TXT, MP3, WAV` },
        { status: 400 }
      );
    }

    // Validate file size
    if (sizeBytes && sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File exceeds 10MB limit (${(sizeBytes / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    // Compute hash
    const sha256 = CryptoJS.SHA256(fileName + Date.now().toString()).toString().substring(0, 16);

    const evidence = {
      id: `evi_${Date.now()}`,
      squadId,
      uploaderId: access.value.userId,
      kind,
      fileName,
      fileUrl: fileUrl || `/evidence/${fileName}`,
      sha256,
      mimeType: mimeType || 'application/octet-stream',
      sizeBytes: sizeBytes || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    mockEvidence.push(evidence);
    return NextResponse.json({ success: true, data: evidence }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const memberships = await getPrisma().membership.findMany({
    where: { userId: actor.value.userId },
    select: { squadId: true },
  });
  const squadIds = new Set(memberships.map((membership) => membership.squadId));

  const evidence = mockEvidence.filter((item) => squadIds.has(item.squadId));
  const evidenceIds = new Set(evidence.map((item) => item.id));

  return NextResponse.json({
    success: true,
    data: evidence,
    contributions: mockContributions.filter((item) => evidenceIds.has(item.evidenceId)),
  });
}
