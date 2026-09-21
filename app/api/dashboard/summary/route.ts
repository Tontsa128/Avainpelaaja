import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const organization = await requireOrganization(request);
    const [sellers, activeSellers, locations, bookings, confirmedBookings, sales, openCrm, timeEntries] =
      await Promise.all([
        prisma.seller.count({ where: { organizationId: organization.id } }),
        prisma.seller.count({ where: { organizationId: organization.id, active: true } }),
        prisma.location.count({ where: { organizationId: organization.id } }),
        prisma.booking.count({ where: { organizationId: organization.id, status: { not: "CANCELLED" } } }),
        prisma.booking.count({ where: { organizationId: organization.id, status: "CONFIRMED" } }),
        prisma.sale.aggregate({ where: { organizationId: organization.id }, _sum: { quantity: true } }),
        prisma.crmOpportunity.count({ where: { organizationId: organization.id, stage: { notIn: ["AGREED", "NOT_NOW"] } } }),
        prisma.timeEntry.findMany({ where: { seller: { organizationId: organization.id } }, select: { startedAt: true, endedAt: true, breakMin: true } }),
      ]);
    const hours = timeEntries.reduce((sum, x) => {
      if (!x.endedAt) return sum;
      return sum + Math.max(0, (x.endedAt.getTime() - x.startedAt.getTime()) / 3600000 - x.breakMin / 60);
    }, 0);
    return Response.json({
      ok: true,
      data: { sellers, activeSellers, locations, bookings, confirmedBookings, sales: sales._sum.quantity ?? 0, openCrm, hours: Math.round(hours * 100) / 100 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
