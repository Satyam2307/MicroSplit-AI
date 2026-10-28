// POST /api/evidence/:id/extract – Run AI extraction on evidence
import { NextRequest, NextResponse } from 'next/server';
import { mockEvidence, mockContributions } from '@/lib/mock-data';
import {
  mockExtraction,
  validateExtractionOutput,
  detectConflicts,
  needsHumanReview,
  buildExtractionLog,
} from '@/lib/ai-extraction';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const evidence = mockEvidence.find((e) => e.id === id);

  if (!evidence) {
    return NextResponse.json(
      { success: false, error: 'Evidence not found' },
      { status: 404 }
    );
  }

  if (evidence.status === 'extracted') {
    return NextResponse.json(
      { success: false, error: 'Evidence already extracted' },
      { status: 409 }
    );
  }

  try {
    // Run extraction (mock for demo)
    const result = mockExtraction(evidence.fileName, evidence.kind);

    // Validate output
    const validation = validateExtractionOutput(result);
    if (!validation.valid) {
      const log = buildExtractionLog(id, evidence.sha256, null, 'failed');
      return NextResponse.json(
        { success: false, error: 'Extraction failed schema validation', details: validation.errors, log },
        { status: 422 }
      );
    }

    // Detect conflicts
    const existingHashes = mockEvidence.filter((e) => e.id !== id).map((e) => e.sha256);
    const enriched = detectConflicts(result.contributions, existingHashes, evidence.sha256);

    // Create contribution records
    const contributions = enriched.map((c, idx) => ({
      id: `ctr_${Date.now()}_${idx}`,
      evidenceId: id,
      memberId: `usr_match_${idx}`, // Would match by name/email
      memberName: c.member_name,
      activity: c.activity,
      quantity: c.quantity,
      unit: c.unit,
      period: c.period || '',
      confidence: c.confidence,
      flags: c.conflicts || [],
      status: needsHumanReview(c) ? 'pending' : 'confirmed',
    }));

    // Update evidence status
    const evidenceIdx = mockEvidence.findIndex((e) => e.id === id);
    if (evidenceIdx >= 0) {
      mockEvidence[evidenceIdx] = { ...mockEvidence[evidenceIdx], status: 'extracted' };
    }

    // Log extraction
    const log = buildExtractionLog(id, evidence.sha256, result, 'success');

    return NextResponse.json({
      success: true,
      data: {
        contributions,
        summary: result.summary,
        warnings: result.warnings,
        log,
      },
    });
  } catch (err) {
    const log = buildExtractionLog(id, evidence.sha256, null, 'failed');
    return NextResponse.json(
      { success: false, error: 'Extraction failed', log },
      { status: 500 }
    );
  }
}
