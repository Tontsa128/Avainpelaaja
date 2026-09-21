import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireOrganization } from "@/lib/tenant";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const organization = await requireOrganization(request);
    const { id } = await context.params;
    const existing = await prisma.location.findFirst({ where: { id, organizationId: organization.id } });
    if (!existing) return jsonError("Location not found.", 404);

    const body = await request.json();
    const location = await prisma.location.update({
      where: { id },
      data: {
        name: body.name === undefined ? undefined : String(body.name).trim(),
        city: body.city === undefined ? undefined : String(body.city).trim(),
        address: body.address === undefined ? undefined : (body.address ? String(body.address).trim() : null),
        postalCode: body.postalCode === undefined ? undefined : (body.postalCode ? String(body.postalCode).trim() : null),
        status: body.status === undefined ? undefined : body.status,
        pricePerDay: body.pricePerDay === undefined ? undefined : Number(body.pricePerDay),
        visitorCount: body.visitorCount === undefined ? undefined : Number(body.visitorCount),
        latitude: body.latitude === undefined ? undefined : Number(body.latitude),
        longitude: body.longitude === undefined ? undefined : Number(body.longitude),
      },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "UPDATE",
      entityType: "LOCATION",
      entityId: location.id,
      oldValue: existing,
      newValue: location,
    });

    return Response.json({ ok: true, data: location });
  } catch (error) {
    return handleApiError(error);
  }
}
