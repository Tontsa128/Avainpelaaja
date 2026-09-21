import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError, jsonError } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const org = await requireOrganization(request);
    const { id } = await params;
    const entry = await prisma.timeEntry.findFirst({ where: { id, seller: { organizationId: org.id } } });
    if (!entry) return jsonError("Time entry not found.", 404);
    if (entry.endedAt) return jsonError("Shift is already closed.", 409);
    const body = await request.json();
    if (body.action !== "END") return jsonError("Only END is supported for now.");
    const updated = await prisma.timeEntry.update({
      where: { id },
      data: { endedAt: new Date(), breakMin: body.breakMin == null ? entry.breakMin : Math.max(0, Number(body.breakMin)), notes: body.notes ? String(body.notes) : entry.notes },
    });
    await writeAudit({ organizationId: org.id, action: "END", entityType: "TIME_ENTRY", entityId: id, oldValue: entry, newValue: updated });
    return Response.json({ ok: true, data: updated });
  } catch (error) { return handleApiError(error); }
}
