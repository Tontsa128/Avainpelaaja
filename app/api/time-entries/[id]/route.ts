import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError, jsonError } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const org = await requireOrganization(request);
    const { id } = await params;
    const entry = await prisma.timeEntry.findFirst({
      where: { id, seller: { organizationId: org.id } },
      include: { seller: { select: { id: true, name: true } }, location: { select: { id: true, name: true, city: true } } },
    });
    if (!entry) return jsonError("Time entry not found.", 404);
    if (entry.endedAt) return jsonError("Shift is already closed.", 409);

    const body = await request.json();
    const action = String(body.action ?? "END").toUpperCase();
    if (action !== "END") return jsonError("Use the time-entries collection endpoint for BREAK/RESUME.");

    const breakMin = body.breakMin == null ? entry.breakMin : Number(body.breakMin);
    if (!Number.isInteger(breakMin) || breakMin < 0 || breakMin > 1440) {
      return jsonError("breakMin must be an integer between 0 and 1440.");
    }

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: {
        endedAt: new Date(),
        status: "CLOSED",
        breakMin,
        notes: body.notes == null ? entry.notes : String(body.notes),
      },
      include: { seller: { select: { id: true, name: true } }, location: { select: { id: true, name: true, city: true } } },
    });

    await writeAudit({
      organizationId: org.id,
      action: "END",
      entityType: "TIME_ENTRY",
      entityId: id,
      oldValue: entry,
      newValue: updated,
    });

    return Response.json({ ok: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
