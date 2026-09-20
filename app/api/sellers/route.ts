import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireOrganization } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const sellers = await prisma.seller.findMany({
      where: { organizationId: organization.id },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
    return Response.json({ ok: true, data: sellers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) return jsonError("Seller name is required.");

    const target = Number(body.targetPerShift ?? 0);
    const seller = await prisma.seller.create({
      data: {
        organizationId: organization.id,
        name,
        phone: body.phone ? String(body.phone).trim() : null,
        email: body.email ? String(body.email).trim().toLowerCase() : null,
        area: body.area ? String(body.area).trim() : null,
        targetPerShift: Number.isFinite(target) ? target : 0,
      },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "CREATE",
      entityType: "SELLER",
      entityId: seller.id,
      newValue: seller,
    });

    return Response.json({ ok: true, data: seller }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
