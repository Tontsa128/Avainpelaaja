import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError, jsonError } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";

function parseDate(value: unknown) {
  if (value === undefined || value === null || value === "") return new Date();
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE");
  return date;
}

export async function GET(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");
    const campaign = searchParams.get("campaign");

    const sales = await prisma.sale.findMany({
      where: {
        organizationId: organization.id,
        ...(sellerId ? { sellerId } : {}),
        ...(campaign ? { campaign } : {}),
      },
      include: { seller: { select: { id: true, name: true } } },
      orderBy: { soldAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ ok: true, data: sales });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const body = await request.json();
    const sellerId = String(body.sellerId ?? "");
    const quantity = Number(body.quantity ?? 1);

    if (!sellerId) return jsonError("sellerId is required.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return jsonError("quantity must be an integer between 1 and 100.");
    }

    const seller = await prisma.seller.findFirst({
      where: { id: sellerId, organizationId: organization.id, active: true },
    });
    if (!seller) return jsonError("Seller not found.", 404);

    const sale = await prisma.sale.create({
      data: {
        organizationId: organization.id,
        sellerId,
        quantity,
        locationName: body.locationName ? String(body.locationName).trim() : null,
        campaign: body.campaign ? String(body.campaign).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        soldAt: parseDate(body.soldAt),
      },
      include: { seller: { select: { id: true, name: true } } },
    });

    await writeAudit({
      organizationId: organization.id,
      action: "CREATE",
      entityType: "SALE",
      entityId: sale.id,
      newValue: sale,
    });

    return NextResponse.json({ ok: true, data: sale }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
