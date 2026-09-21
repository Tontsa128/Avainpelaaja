import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireOrganization } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const locations = await prisma.location.findMany({
      where: { organizationId: organization.id },
      include: { contacts: true },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
    return Response.json({ ok: true, data: locations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const city = String(body.city ?? "").trim();
    if (!name || !city) return jsonError("Location name and city are required.");

    const price = body.pricePerDay == null ? null : Number(body.pricePerDay);
    const location = await prisma.location.create({
      data: {
        organizationId: organization.id,
        name,
        city,
        address: body.address ? String(body.address).trim() : null,
        postalCode: body.postalCode ? String(body.postalCode).trim() : null,
        latitude: body.latitude == null ? null : Number(body.latitude),
        longitude: body.longitude == null ? null : Number(body.longitude),
        pricePerDay: price !== null && Number.isFinite(price) ? price : null,
        visitorCount: body.visitorCount == null ? null : Number(body.visitorCount),
      },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "CREATE",
      entityType: "LOCATION",
      entityId: location.id,
      newValue: location,
    });

    return Response.json({ ok: true, data: location }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
