import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";

const TYPES = new Set(["CALL", "EMAIL", "NOTE", "MEETING", "OFFER", "STATUS_CHANGE"]);
const STAGES = new Set(["NEW", "CALL", "NEGOTIATION", "OFFER_SENT", "AGREED", "WAITING", "FOLLOW_UP", "NOT_NOW"]);

export async function GET(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get("opportunityId");
    const contactId = searchParams.get("contactId");

    const activities = await prisma.crmActivity.findMany({
      where: {
        organizationId: organization.id,
        ...(opportunityId ? { opportunityId } : {}),
        ...(contactId ? { contactId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(activities);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const body = await request.json();

    const type = String(body.type ?? "NOTE");
    const stage = String(body.stage ?? "NEW");
    const subject = String(body.subject ?? "").trim();

    if (!TYPES.has(type)) return NextResponse.json({ error: "INVALID_ACTIVITY_TYPE" }, { status: 400 });
    if (!STAGES.has(stage)) return NextResponse.json({ error: "INVALID_STAGE" }, { status: 400 });
    if (!subject) return NextResponse.json({ error: "SUBJECT_REQUIRED" }, { status: 400 });

    const contactId = body.contactId ? String(body.contactId) : null;
    const opportunityId = body.opportunityId ? String(body.opportunityId) : null;

    if (contactId) {
      const contact = await prisma.contact.findFirst({ where: { id: contactId, organizationId: organization.id } });
      if (!contact) return NextResponse.json({ error: "CONTACT_NOT_FOUND" }, { status: 400 });
    }

    if (opportunityId) {
      const opportunity = await prisma.crmOpportunity.findFirst({ where: { id: opportunityId, organizationId: organization.id } });
      if (!opportunity) return NextResponse.json({ error: "CRM_OPPORTUNITY_NOT_FOUND" }, { status: 400 });
    }

    const activity = await prisma.crmActivity.create({
      data: {
        organizationId: organization.id,
        contactId,
        opportunityId,
        type: type as never,
        stage: stage as never,
        subject,
        notes: body.notes ? String(body.notes) : null,
        nextActionAt: body.nextActionAt ? new Date(String(body.nextActionAt)) : null,
      },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "CREATE",
      entityType: "CrmActivity",
      entityId: activity.id,
      newValue: activity,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
