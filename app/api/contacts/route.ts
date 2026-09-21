import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: organization.id,
        ...(locationId ? { locationId } : {}),
      },
      include: { location: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });

    const locationId = body.locationId ? String(body.locationId) : null;
    if (locationId) {
      const location = await prisma.location.findFirst({
        where: { id: locationId, organizationId: organization.id },
      });
      if (!location) return NextResponse.json({ error: "LOCATION_NOT_FOUND" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        organizationId: organization.id,
        locationId,
        name,
        role: body.role ? String(body.role) : null,
        phone: body.phone ? String(body.phone) : null,
        email: body.email ? String(body.email) : null,
        notes: body.notes ? String(body.notes) : null,
      },
      include: { location: true },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "CREATE",
      entityType: "Contact",
      entityId: contact.id,
      newValue: contact,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
