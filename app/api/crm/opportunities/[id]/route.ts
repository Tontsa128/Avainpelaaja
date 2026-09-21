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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organization = await requireOrganization(request);
    const { id } = await params;

    const existing = await prisma.crmOpportunity.findFirst({
      where: { id, organizationId: organization.id },
    });

    if (!existing) return NextResponse.json({ error: "CRM_OPPORTUNITY_NOT_FOUND" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.city !== undefined) data.city = body.city ? String(body.city).trim() : null;
    if (body.stage !== undefined) {
      const stage = String(body.stage);
      if (!STAGES.has(stage)) return NextResponse.json({ error: "INVALID_STAGE" }, { status: 400 });
      data.stage = stage;
    }
    if (body.nextAction !== undefined) {
      const nextAction = String(body.nextAction).trim();
      if (!nextAction) return NextResponse.json({ error: "NEXT_ACTION_REQUIRED" }, { status: 400 });
      data.nextAction = nextAction;
    }
    if (body.nextActionAt !== undefined) data.nextActionAt = parseDate(body.nextActionAt);
    if (body.footfall !== undefined) data.footfall = body.footfall === "" || body.footfall === null ? null : Number(body.footfall);
    if (body.dailyRate !== undefined) data.dailyRate = body.dailyRate === "" || body.dailyRate === null ? null : Number(body.dailyRate);
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

    for (const [field, errorCode] of [
      ["locationId", "LOCATION_NOT_FOUND"],
      ["contactId", "CONTACT_NOT_FOUND"],
      ["responsibleUserId", "RESPONSIBLE_USER_NOT_FOUND"],
    ] as const) {
      if (body[field] === undefined) continue;
      const value = body[field] ? String(body[field]) : null;
      if (value) {
        const where =
          field === "locationId"
            ? { id: value, organizationId: organization.id }
            : field === "contactId"
              ? { id: value, organizationId: organization.id }
              : { id: value, organizationId: organization.id, active: true };
        const exists = field === "locationId"
          ? await prisma.location.findFirst({ where })
          : field === "contactId"
            ? await prisma.contact.findFirst({ where })
            : await prisma.user.findFirst({ where });
        if (!exists) return NextResponse.json({ error: errorCode }, { status: 400 });
      }
      data[field] = value;
    }

    const updated = await prisma.crmOpportunity.update({
      where: { id: existing.id },
      data: data as never,
      include: {
        location: true,
        contact: true,
        responsibleUser: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "UPDATE",
      entityType: "CrmOpportunity",
      entityId: updated.id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
