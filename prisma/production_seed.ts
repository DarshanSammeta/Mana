import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const DATA = {
  eventTypes: [
    { name: "Wedding", description: "Grand wedding celebrations", icon: "wedding-icon" },
    { name: "House Ceremony", description: "House warming and ceremonies", icon: "house-icon" },
    { name: "Baby Shower", description: "Baby shower celebrations", icon: "baby-icon" },
    { name: "Birthday Party", description: "Fun birthday parties", icon: "birthday-icon" },
    { name: "Engagement", description: "Engagement ceremonies", icon: "engagement-icon" },
    { name: "Anniversary", description: "Anniversary celebrations", icon: "anniversary-icon" },
    { name: "Corporate Events", description: "Professional business events", icon: "corporate-icon" },
    { name: "Festival Events", description: "Religious and seasonal festivals", icon: "festival-icon" },
    { name: "Other Events", description: "Various other event types", icon: "other-icon" },
  ],
  categories: [
    {
      name: "Decoration",
      subcategories: [
        {
          name: "Wedding Decoration",
          serviceTypes: ["Stage Decoration", "Flower Decoration", "Mandap Decoration", "Theme Decoration", "Balloon Decoration", "Lighting"]
        },
        {
          name: "House Ceremony Decoration",
          serviceTypes: ["Traditional Pooja Decoration", "Floral Setup", "Entrance Decor"]
        },
        {
          name: "Birthday Decoration",
          serviceTypes: ["Theme Decoration", "Balloon Decoration", "Kids Theme", "Adult Theme"]
        },
        {
            name: "Corporate Decoration",
            serviceTypes: ["Conference Setup", "Stage & Lighting", "Branding & Printing"]
        }
      ]
    },
    {
      name: "Photography & Videography",
      subcategories: [
        {
          name: "Wedding Photography",
          serviceTypes: ["Traditional", "Candid", "Drone", "Pre Wedding", "Cinematography", "Album"]
        },
        {
          name: "Event Photography",
          serviceTypes: ["Birthday Photography", "Corporate Photography", "General Event Photography"]
        }
      ]
    },
    {
      name: "Catering",
      subcategories: [
        {
          name: "Event Catering",
          serviceTypes: ["Veg", "Non Veg", "South Indian", "North Indian", "Chinese", "Buffet", "Live Counter"]
        }
      ]
    },
    {
      name: "DJ / Sound System",
      subcategories: [
        {
          name: "Audio Services",
          serviceTypes: ["Basic DJ", "Premium DJ", "Celebrity DJ", "Live Band", "Sound Setup"]
        }
      ]
    },
    {
      name: "Makeup",
      subcategories: [
        {
          name: "Beauty Services",
          serviceTypes: ["Bridal Makeup", "Party Makeup", "Groom Styling", "Hairstyling"]
        }
      ]
    },
    {
      name: "Venue Booking",
      subcategories: [
        {
          name: "Venues",
          serviceTypes: ["Banquet Hall", "Lawn", "Resort", "Convention Center"]
        }
      ]
    },
    {
      name: "Invitation Cards",
      subcategories: [
        {
          name: "Invitations",
          serviceTypes: ["Physical Cards", "Digital Invites", "Video Invites"]
        }
      ]
    },
    {
      name: "Return Gifts",
      subcategories: [
        {
          name: "Gifting",
          serviceTypes: ["Customized Gifts", "Traditional Gifts", "Luxury Hampers"]
        }
      ]
    },
    {
      name: "Transportation",
      subcategories: [
        {
          name: "Travel Services",
          serviceTypes: ["Luxury Cars", "Guest Buses", "Vintage Cars"]
        }
      ]
    },
    {
      name: "Pooja & Rituals",
      subcategories: [
        {
          name: "Religious Services",
          serviceTypes: ["Priest Booking", "Havan Essentials", "Pooja Material"]
        }
      ]
    },
    {
      name: "Cake",
      subcategories: [
        {
          name: "Bakery",
          serviceTypes: ["1 Tier", "2 Tier", "3 Tier", "Custom Theme Cake"]
        }
      ]
    },
    {
      name: "Game Activities",
      subcategories: [
        {
          name: "Entertainment",
          serviceTypes: ["Magic Show", "Puppet Show", "Face Painting", "Game Host"]
        }
      ]
    },
    {
      name: "LED Screens",
      subcategories: [
        {
          name: "Visual Services",
          serviceTypes: ["Indoor LED", "Outdoor LED", "Projector Setup"]
        }
      ]
    },
    {
      name: "Festival Services",
      subcategories: [
        {
          name: "Ganesh Festival",
          serviceTypes: ["Pandal Decoration", "Idol Booking", "Immersion Service"]
        },
        {
          name: "Diwali",
          serviceTypes: ["Lighting Decoration", "Firecrackers", "Gift Boxes"]
        }
      ]
    }
  ]
};

async function main() {
  console.log("Starting production category hierarchy seed...");

  // 1. Seed Event Types
  const eventTypeMap: Record<string, string> = {};
  for (const et of DATA.eventTypes) {
    let existing = await prisma.eventtype.findUnique({ where: { name: et.name } });
    if (!existing) {
      existing = await prisma.eventtype.create({
        data: {
          id: randomUUID(),
          name: et.name,
          description: et.description,
          icon: et.icon,
          isActive: true
        }
      });
      console.log(`Created Event Type: ${et.name}`);
    } else {
      console.log(`Event Type exists: ${et.name}`);
    }
    eventTypeMap[et.name] = existing.id;
  }

  // 2. Seed Categories, Subcategories, and Service Types
  for (const cat of DATA.categories) {
    for (const sub of cat.subcategories) {
      // Determine which event types this subcategory belongs to
      let targetEventTypeNames: string[] = [];

      // Heuristic: match subcategory name to event types
      for (const etName of Object.keys(eventTypeMap)) {
        // Match first word of event type name (e.g., "Wedding", "Corporate", "Birthday")
        const matchWord = etName.split(' ')[0].toLowerCase();
        if (sub.name.toLowerCase().includes(matchWord)) {
          targetEventTypeNames.push(etName);
        }
      }

      // Default to all if no specific match found (for generic categories)
      if (targetEventTypeNames.length === 0) {
        targetEventTypeNames = Object.keys(eventTypeMap);
      }

      for (const etName of targetEventTypeNames) {
        const etId = eventTypeMap[etName];

        // Find or create Category for this specific Event Type
        // We use findFirst because we want to check if the combination exists
        let category = await prisma.category.findFirst({
          where: { name: cat.name, eventTypeId: etId }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              id: randomUUID(),
              name: cat.name,
              description: `All ${cat.name} related services for ${etName}`,
              eventTypeId: etId
            }
          });
          console.log(`Created Category: ${cat.name} for ${etName}`);
        }

        // Find or create subcategory
        let subcategory = await prisma.subcategory.findFirst({
          where: { name: sub.name, categoryId: category.id }
        });

        if (!subcategory) {
          subcategory = await prisma.subcategory.create({
            data: {
              id: randomUUID(),
              name: sub.name,
              categoryId: category.id
            }
          });
          console.log(`  Created Subcategory: ${sub.name} in ${cat.name} (${etName})`);
        }

        // Seed Service Types
        for (const stName of sub.serviceTypes) {
          const existingSt = await prisma.servicetype.findFirst({
            where: { name: stName, subcategoryId: subcategory.id }
          });
          if (!existingSt) {
            await prisma.servicetype.create({
              data: {
                id: randomUUID(),
                name: stName,
                subcategoryId: subcategory.id,
                description: `${stName} services`
              }
            });
            console.log(`    Created Service Type: ${stName}`);
          }
        }
      }
    }
  }

  console.log("Hierarchy seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
