import { prisma } from "./prisma";

export const ORGANIZATION_HEADER = "x-organization-id";

export async function requireOrganization(request: Request) {
  const id = request.headers.get(ORGANIZATION_HEADER) ?? process.env.DEFAULT_ORGANIZATION_ID;
  if (!id) throw new Error("ORGANIZATION_REQUIRED");

  const organization = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
  return organization;
}
