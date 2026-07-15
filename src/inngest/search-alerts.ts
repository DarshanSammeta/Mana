import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notifications";

export const checkSavedSearches = inngest.createFunction(
  { id: "check-saved-searches", triggers: [{ event: "vendor/approved" }] }, // Trigger when a new vendor is approved
  async ({ event, step }) => {
    const { vendorId } = event.data;

    const vendor = (await step.run("fetch-vendor", async () => {
      return prisma.vendorprofile.findUnique({
        where: { id: vendorId },
        include: {
          service: {
            include: {
              servicetype: {
                include: { subcategory: { include: { category: true } } }
              }
            }
          }
        }
      });
    })) as any;

    if (!vendor) return;

    // Fetch all saved searches
    const savedSearches = (await step.run("fetch-saved-searches", async () => {
      return prisma.saved_search.findMany({
        include: { user: true }
      });
    })) as any[];

    for (const search of savedSearches) {
      await step.run(`check-match-${search.id}`, async () => {
        const filters = search.filters as any;

        // Simple matching logic
        const matchesCity = !filters.city || vendor.city === filters.city;
        const matchesCategory = !filters.category || vendor.service.some((s: any) =>
          s.servicetype.subcategory.category.name === filters.category
        );

        if (matchesCity && matchesCategory) {
          await NotificationService.send({
            userId: search.userId,
            title: "New Vendor Match!",
            message: `A new vendor "${vendor.businessName}" matching your saved search "${search.name}" is now available.`,
            category: "MARKETING",
            link: `/marketplace/vendor/${vendor.id}`
          });
        }
      });
    }
  }
);
