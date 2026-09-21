import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError, jsonError } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const org = await requireOrganization(request);
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");
    const entries = await prisma.timeEntry.findMany({
      where: { seller: { organizationId: org.id }, ...(sellerId ? { sellerId } : {}) },
      include: { seller: { select: { id: true, name: true } }, location: { select: { id: true, name: true, city: true } } },
      orderBy: { startedAt: "desc" }, take: 200,
    });
    return Response.json({ ok: true, data: entries });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const org = await requireOrganization(request);
    const body = await request.json();
    const sellerId = String(body.sellerId ?? "");
    const action = String(body.action ?? "START").toUpperCase();
    const locationId = body.locationId ? String(body.locationId) : null;

    if (!sellerId) return jsonError("sellerId is required.");
    if (!["START", "BREAK", "RESUME"].includes(action)) return jsonError("Invalid time-entry action.");

    const seller = await prisma.seller.findFirst({
      where: { id: sellerId, organizationId: org.id, active: true },
    });
    if (!seller) return jsonError("Seller not found.", 404);

    const open = await prisma.timeEntry.findFirst({
      where: { sellerId, endedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (action === "START") {
      if (open) return jsonError("Seller already has an open shift.", 409);
      if (locationId) {
        const location = await prisma.location.findFirst({ where: { id: locationId, organizationId: org.id } });
        if (!location) return jsonError("Location not found.", 404);
      }
      const entry = await prisma.timeEntry.create({
        data: { sellerId, locationId, startedAt: new Date(), status: "OPEN", notes: body.notes ? String(body.notes) : null },
        include: { seller: { select: { id: true, name: true } }, location: { select: { id: true, name: true, city: true } } },
      });
      await writeAudit({ organizationId: org.id, action: "START", entityType: "TIME_ENTRY", entityId: entry.id, newValue: entry });
      return Response.json({ ok: true, data: entry }, { status: 201 });
    }

    if (!open) return jsonError("No open shift found.", 409);
    if (action === "BREAK" && open.status === "BREAK") return jsonError("Shift is already on break.", 409);
    if (action === "RESUME" && open.status !== "BREAK") return jsonError("Shift is not on break.", 409);

    const updated = await prisma.timeEntry.update({
      where: { id: open.id },
      data: { status: action === "BREAK" ? "BREAK" : "OPEN" },
      include: { seller: { select: { id: true, name: true } }, location: { select: { id: true, name: true, city: true } } },
    });
    await writeAudit({ organizationId: org.id, action, entityType: "TIME_ENTRY", entityId: updated.id, oldValue: open, newValue: updated });
    return Response.json({ ok: true, data: updated });
  } catch (error) { return handleApiError(error); }
}
