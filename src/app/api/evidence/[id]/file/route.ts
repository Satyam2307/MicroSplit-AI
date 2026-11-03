import { NextResponse } from "next/server";
import { requireAuthenticatedActor, requireSquadRole } from "@/lib/authorization";
import { getEvidenceStorage } from "@/lib/evidence-storage";
import {
  downloadEvidenceFile,
  EvidenceWorkflowError,
} from "@/lib/evidence-workflow";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  const evidence = await getPrisma().evidence.findUnique({ where: { id } });
  if (!evidence) {
    return NextResponse.json(
      { success: false, error: "Evidence not found" },
      { status: 404 }
    );
  }

  const access = await requireSquadRole(evidence.squadId);
  if (!access.ok) return access.response;
  let bytes: Uint8Array;
  try {
    bytes = await downloadEvidenceFile(evidence, {
      download: (storageKey) => getEvidenceStorage().download(storageKey),
    });
  } catch (error) {
    if (error instanceof EvidenceWorkflowError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Unable to retrieve evidence file", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve evidence file" },
      { status: 502 }
    );
  }

  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  const fileName = encodeURIComponent(evidence.fileName ?? "evidence");
  return new NextResponse(body, {
    headers: {
      "Content-Type": evidence.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
