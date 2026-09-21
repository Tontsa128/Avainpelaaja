const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function stableId(prefix, value) {
  return prefix + "-" + value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "avainpelaaja-demo" },
    update: { name: "Avainpelaaja Oy" },
    create: { id: "avainpelaaja-demo", name: "Avainpelaaja Oy" },
  });

  const sellers = [
    ["Matti Meikäläinen", "Jyväskylä"],
    ["Laura Virtanen", "Tampere"],
    ["Jussi Korhonen", "Helsinki"],
    ["Anna Laine", "Turku"],
    ["Ville Niemi", "Oulu"],
    ["Sanna Hämäläinen", "Lahti"],
  ];

  for (const [name, area] of sellers) {
    await prisma.seller.upsert({
      where: { id: stableId("demo", name) },
      update: { name, area, active: true },
      create: {
        id: stableId("demo", name),
        organizationId: organization.id,
        name,
        area,
        targetPerShift: 8,
      },
    });
  }

  const locations = [
    ["Kauppakeskus Seppä", "Jyväskylä", 250],
    ["Kauppakeskus Ratina", "Tampere", 320],
    ["Kauppakeskus Sello", "Espoo", 350],
    ["Kauppakeskus Skanssi", "Turku", 280],
    ["Ideapark", "Lempäälä", 300],
    ["Valkea", "Oulu", 220],
  ];

  for (const [name, city, price] of locations) {
    await prisma.location.upsert({
      where: { id: stableId("demo", name) },
      update: { name, city, pricePerDay: price },
      create: {
        id: stableId("demo", name),
        organizationId: organization.id,
        name,
        city,
        pricePerDay: price,
      },
    });
  }

  console.log("Seeded " + organization.name + " (" + organization.id + ")");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
