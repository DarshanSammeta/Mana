const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const HIERARCHY = {
  eventTypes: [
    { name: "Wedding" },
    { name: "House Ceremony" },
    { name: "Baby Shower" },
    { name: "Birthday Party" },
    { name: "Engagement" },
    { name: "Anniversary" },
    { name: "Corporate Events" },
    { name: "Festival Events" },
    { name: "Other Events" }
  ],
  categories: [
    "Decoration", "Photography & Videography", "Catering", "DJ / Sound System", "Makeup",
    "Venue Booking", "Invitation Cards", "Return Gifts", "Transportation", "Other Services",
    "Pooja & Rituals", "Photography", "Priest Booking", "Cake", "Game Activities",
    "DJ / Music", "Magic Show", "Conference Setup", "Stage & Lighting", "Sound System",
    "LED Screens", "Branding & Printing", "Ganesh Festival", "Diwali", "Christmas",
    "New Year", "Navratri", "Pongal", "Other Festivals", "Exhibition", "School / College",
    "Product Launch", "Award Function", "Other Events"
  ],
  mapping: {
    "Wedding": ["Decoration", "Photography & Videography", "Catering", "DJ / Sound System", "Makeup", "Venue Booking", "Invitation Cards", "Return Gifts", "Transportation", "Other Services"],
    "House Ceremony": ["Pooja & Rituals", "Decoration", "Catering", "Photography", "Priest Booking", "Return Gifts", "Other Services"],
    "Baby Shower": ["Decoration", "Photography", "Catering", "Cake", "Return Gifts", "Game Activities", "Other Services"],
    "Birthday Party": ["Decoration", "Photography", "Catering", "Cake", "DJ / Music", "Magic Show", "Return Gifts", "Other Services"],
    "Engagement": ["Decoration", "Photography", "Catering", "Makeup", "DJ / Music", "Invitation Cards", "Other Services"],
    "Anniversary": ["Decoration", "Photography", "Catering", "Cake", "DJ / Music", "Other Services"],
    "Corporate Events": ["Conference Setup", "Stage & Lighting", "Catering", "Sound System", "LED Screens", "Photography", "Branding & Printing", "Other Services"],
    "Festival Events": ["Ganesh Festival", "Diwali", "Christmas", "New Year", "Navratri", "Pongal", "Other Festivals"],
    "Other Events": ["Exhibition", "School / College", "Product Launch", "Award Function", "Other Events"]
  },
  subOptions: {
    "Decoration": ["Stage Decoration", "Flower Decoration", "Mandap Decoration", "Theme Decoration", "Balloon Decoration", "Lighting"],
    "Photography & Videography": ["Traditional", "Candid", "Drone", "Pre Wedding", "Cinematography", "Album"],
    "Photography": ["Traditional", "Candid", "Drone", "Pre Wedding", "Cinematography", "Album"],
    "Catering": ["Veg", "Non Veg", "South Indian", "North Indian", "Chinese", "Buffet", "Live Counter"],
    "DJ / Sound System": ["Basic", "Premium", "Celebrity", "Live Band", "Sound Setup"],
    "DJ / Music": ["Basic", "Premium", "Celebrity", "Live Band", "Sound Setup"],
    "Cake": ["1 Tier", "2 Tier", "3 Tier", "Custom"],
    "Pooja & Rituals": ["Traditional Pooja", "Griha Pravesh", "Vastu Pooja", "Satyanarayan Pooja"]
  }
};

async function sync() {
  console.log('--- STARTING EXHAUSTIVE HIERARCHY SYNC ---');

  const eventTypeMap = {};
  for (const et of HIERARCHY.eventTypes) {
    const created = await prisma.eventtype.upsert({
      where: { name: et.name },
      update: { isActive: true },
      create: { id: crypto.randomUUID(), name: et.name, isActive: true }
    });
    eventTypeMap[et.name] = created.id;
  }
  console.log('✓ Event Types synced');

  const categoryMap = {};
  for (const catName of HIERARCHY.categories) {
    const created = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { id: crypto.randomUUID(), name: catName }
    });
    categoryMap[catName] = created.id;
  }
  console.log('✓ Categories synced');

  for (const [etName, catNames] of Object.entries(HIERARCHY.mapping)) {
    const etId = eventTypeMap[etName];
    for (const catName of catNames) {
      const catId = categoryMap[catName];
      if (etId && catId) {
        try {
          await prisma.eventtype.update({
            where: { id: etId },
            data: { categories: { connect: { id: catId } } }
          });
        } catch (e) {}
      }
    }
  }
  console.log('✓ Event-Category relationships synced');

  // For Level 2, we treat the categories mapped to event types as Level 2.
  // Level 3 are Service Types under Subcategories.
  // In our schema, Category -> Subcategory -> ServiceType.
  // To match the prompt's hierarchy where Level 1=Event, Level 2=Sub (our Category), Level 3=Options (our Subcategory/ServiceType):

  for (const [catName, subNames] of Object.entries(HIERARCHY.subOptions)) {
    const catId = categoryMap[catName];
    if (!catId) continue;
    for (const subName of subNames) {
      let sub = await prisma.subcategory.findFirst({
        where: { name: subName, categoryId: catId }
      });
      if (!sub) {
        sub = await prisma.subcategory.create({
          data: { id: crypto.randomUUID(), name: subName, categoryId: catId }
        });
      }
      // Ensure ServiceType
      const st = await prisma.servicetype.findFirst({
        where: { name: subName, subcategoryId: sub.id }
      });
      if (!st) {
        await prisma.servicetype.create({
          data: { id: crypto.randomUUID(), name: subName, subcategoryId: sub.id }
        });
      }
    }
  }
  console.log('✓ Level 3 Service Options synced');

  console.log('--- SYNC COMPLETE ---');
}

sync().catch(console.error).finally(() => prisma.$disconnect());
