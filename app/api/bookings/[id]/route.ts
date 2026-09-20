import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireOrganization } from "@/lib/tenant";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const organization = await requireOrganization(request);
    const { id } = await context.params;
    const existing = await prisma.booking.findFirst({ where: { id, organizationId: organization.id } });
    if (!existing) return jsonError("Booking not found.", 404);

    const body = await request.json();
    const startsAt = body.startsAt === undefined ? existing.startsAt : new Date(String(body.startsAt));
    const endsAt = body.endsAt === undefined ? existing.endsAt : new Date(String(body.endsAt));
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return jsonError("Valid startsAt and endsAt are required.");
    }

    const sellerId = body.sellerId === undefined ? existing.sellerId : (body.sellerId ? String(body.sellerId) : null);
    const locationId = body.locationId === undefined ? existing.locationId : (body.locationId ? String(body.locationId) : null);

    if (sellerId) {
      const seller = await prisma.seller.findFirst({ where: { id: sellerId, organizationId: organization.id } });
      if (!seller) return jsonError("Seller does not belong to this organization.", 422);
    }
    if (locationId) {
      const location = await prisma.location.findFirst({ where: { id: locationId, organizationId: organization.id } });
      if (!location) return jsonError("Location does not belong to this organization.", 422);
    }

    const conflicts = await prisma.booking.findMany({
      where: {
        organizationId: organization.id,
        id: { not: id },
        status: { not: "CANCELLED" },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        OR: [
          ...(sellerId ? [{ sellerId }] : []),
          ...(locationId ? [{ locationId }] : []),
        ],
      },
      select: { id: true, sellerId: true, locationId: true, startsAt: true, endsAt: true },
    });
    if (conflicts.length) return jsonError("Booking conflicts with an existing seller or location booking.", 409, conflicts);

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        sellerId,
        locationId,
        startsAt,
        endsAt,
        standSpot: body.standSpot === undefined ? undefined : (body.standSpot ? String(body.standSpot).trim() : null),
        notes: body.notes === undefined ? undefined : (body.notes ? String(body.notes).trim() : null),
        status: body.status === undefined ? undefined : body.status,
      },
      include: { seller: true, location: true },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "UPDATE",
      entityType: "BOOKING",
      entityId: booking.id,
      oldValue: existing,
      newValue: booking,
    });

    return Response.json({ ok: true, data: booking });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const organization = await requireOrganization(request);
    const { id } = await context.params;
    const existing = await prisma.booking.findFirst({ where: { id, organizationId: organization.id } });
    if (!existing) return jsonError("Booking not found.", 404);

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "CANCEL",
      entityType: "BOOKING",
      entityId: booking.id,
      oldValue: existing,
      newValue: booking,
    });

    return Response.json({ ok: true, data: booking });
  } catch (error) {
    return handleApiError(error);
  }
}
