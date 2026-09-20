import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireOrganization } from "@/lib/tenant";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const organization = await requireOrganization(request);
    const { id } = await context.params;
    const existing = await prisma.seller.findFirst({ where: { id, organizationId: organization.id } });
    if (!existing) return jsonError("Seller not found.", 404);

    const body = await request.json();
    const seller = await prisma.seller.update({
      where: { id },
      data: {
        name: body.name === undefined ? undefined : String(body.name).trim(),
        phone: body.phone === undefined ? undefined : (body.phone ? String(body.phone).trim() : null),
        email: body.email === undefined ? undefined : (body.email ? String(body.email).trim().toLowerCase() : null),
        area: body.area === undefined ? undefined : (body.area ? String(body.area).trim() : null),
        active: body.active === undefined ? undefined : Boolean(body.active),
        targetPerShift: body.targetPerShift === undefined ? undefined : Number(body.targetPerShift),
      },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "UPDATE",
      entityType: "SELLER",
      entityId: seller.id,
      oldValue: existing,
      newValue: seller,
    });

    return Response.json({ ok: true, data: seller });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const organization = await requireOrganization(request);
    const { id } = await context.params;
    const existing = await prisma.seller.findFirst({ where: { id, organizationId: organization.id } });
    if (!existing) return jsonError("Seller not found.", 404);

    const seller = await prisma.seller.update({
      where: { id },
      data: { active: false },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "DEACTIVATE",
      entityType: "SELLER",
      entityId: seller.id,
      oldValue: existing,
      newValue: seller,
    });

    return Response.json({ ok: true, data: seller });
  } catch (error) {
    return handleApiError(error);
  }
}
