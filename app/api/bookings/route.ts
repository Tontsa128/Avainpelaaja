import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireOrganization } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const bookings = await prisma.booking.findMany({
      where: { organizationId: organization.id },
      include: { seller: true, location: true },
      orderBy: { startsAt: "asc" },
    });
    return Response.json({ ok: true, data: bookings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const body = await request.json();
    const startsAt = new Date(String(body.startsAt ?? ""));
    const endsAt = new Date(String(body.endsAt ?? ""));

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return jsonError("Valid startsAt and endsAt are required.");
    }

    const sellerId = body.sellerId ? String(body.sellerId) : null;
    const locationId = body.locationId ? String(body.locationId) : null;

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

    if (conflicts.length) {
      return jsonError("Booking conflicts with an existing seller or location booking.", 409, conflicts);
    }

    const booking = await prisma.booking.create({
      data: {
        organizationId: organization.id,
        sellerId,
        locationId,
        startsAt,
        endsAt,
        standSpot: body.standSpot ? String(body.standSpot).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        status: body.status === "DRAFT" ? "DRAFT" : "PENDING",
      },
      include: { seller: true, location: true },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "CREATE",
      entityType: "BOOKING",
      entityId: booking.id,
      newValue: booking,
    });

    return Response.json({ ok: true, data: booking }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
