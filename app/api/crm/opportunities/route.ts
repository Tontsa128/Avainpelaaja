import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";

const STAGES = new Set([
  "NEW",
  "CALL",
  "NEGOTIATION",
  "OFFER_SENT",
  "AGREED",
  "WAITING",
  "FOLLOW_UP",
  "NOT_NOW",
]);

function parseDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE");
  return date;
}

export async function GET(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");

    if (stage && !STAGES.has(stage)) {
      return NextResponse.json({ error: "INVALID_STAGE" }, { status: 400 });
    }

    const opportunities = await prisma.crmOpportunity.findMany({
      where: {
        organizationId: organization.id,
        ...(stage ? { stage: stage as never } : {}),
      },
      include: {
        location: true,
        contact: true,
        responsibleUser: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: [{ nextActionAt: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ ok: true, data: opportunities });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const nextAction = String(body.nextAction ?? "").trim();
    const stage = String(body.stage ?? "NEW");

    if (!name) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    if (!nextAction) return NextResponse.json({ error: "NEXT_ACTION_REQUIRED" }, { status: 400 });
    if (!STAGES.has(stage)) return NextResponse.json({ error: "INVALID_STAGE" }, { status: 400 });

    const locationId = body.locationId ? String(body.locationId) : null;
    const contactId = body.contactId ? String(body.contactId) : null;
    const responsibleUserId = body.responsibleUserId ? String(body.responsibleUserId) : null;

    if (locationId) {
      const location = await prisma.location.findFirst({ where: { id: locationId, organizationId: organization.id } });
      if (!location) return NextResponse.json({ error: "LOCATION_NOT_FOUND" }, { status: 400 });
    }

    if (contactId) {
      const contact = await prisma.contact.findFirst({ where: { id: contactId, organizationId: organization.id } });
      if (!contact) return NextResponse.json({ error: "CONTACT_NOT_FOUND" }, { status: 400 });
    }

    if (responsibleUserId) {
      const user = await prisma.user.findFirst({ where: { id: responsibleUserId, organizationId: organization.id, active: true } });
      if (!user) return NextResponse.json({ error: "RESPONSIBLE_USER_NOT_FOUND" }, { status: 400 });
    }

    const opportunity = await prisma.crmOpportunity.create({
      data: {
        organizationId: organization.id,
        name,
        city: body.city ? String(body.city).trim() : null,
        stage: stage as never,
        nextAction,
        nextActionAt: parseDate(body.nextActionAt),
        footfall: body.footfall === undefined || body.footfall === "" ? null : Number(body.footfall),
        dailyRate: body.dailyRate === undefined || body.dailyRate === "" ? null : Number(body.dailyRate),
        notes: body.notes ? String(body.notes) : null,
        locationId,
        contactId,
        responsibleUserId,
      },
      include: {
        location: true,
        contact: true,
        responsibleUser: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "CREATE",
      entityType: "CrmOpportunity",
      entityId: opportunity.id,
      newValue: opportunity,
    });

    return NextResponse.json({ ok: true, data: opportunity }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
