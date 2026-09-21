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
    if (!sellerId) return jsonError("sellerId is required.");
    const seller = await prisma.seller.findFirst({ where: { id: sellerId, organizationId: org.id, active: true } });
    if (!seller) return jsonError("Seller not found.", 404);
    const open = await prisma.timeEntry.findFirst({ where: { sellerId, endedAt: null }, orderBy: { startedAt: "desc" } });
    if (open) return jsonError("Seller already has an open shift.", 409);
    const entry = await prisma.timeEntry.create({ data: { sellerId, startedAt: new Date(), notes: body.notes ? String(body.notes) : null } });
    await writeAudit({ organizationId: org.id, action: "START", entityType: "TIME_ENTRY", entityId: entry.id, newValue: entry });
    return Response.json({ ok: true, data: entry }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
