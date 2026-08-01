import { APP_CONFIG } from "@/config/app";
import { Metadata } from "next";
import { getServiceById, getRelatedServices } from "@/lib/marketplace";
import ServiceDetailsClient from "@/components/marketplace/ServiceDetails/ServiceDetailsClient";
import { notFound } from "next/navigation";
import { z } from "zod";

// Route parameter validation
const routeSchema = z.object({
  id: z.string().min(1)
});

async function getServiceData(id: string) {
  try {
    // Pure ID lookup - format agnostic
    return await getServiceById(id);
  } catch (error) {
    console.error("Error fetching service data:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;

  // Basic validation
  const validation = routeSchema.safeParse(resolvedParams);
  if (!validation.success) {
    return { title: "Invalid Service | Mana Events" };
  }

  const service = await getServiceData(validation.data.id);

  if (!service) {
    return {
      title: "Service Not Found | Mana Events",
    };
  }

  const title = `${service.title} by ${service.vendorprofile.businessName} | Mana Events`;
  const description = service.description || `Book ${service.title} by ${service.vendorprofile.businessName} for your next event. Best prices on Mana Events.`;
  const baseUrl = APP_CONFIG.url;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/marketplace/service/${validation.data.id}`,
    },
    openGraph: {
      title,
      description,
      images: [service.portfolio?.[0]?.mediaUrl || service.vendorprofile.coverImage || "/og-image.jpg"],
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  // Basic validation
  const validation = routeSchema.safeParse(resolvedParams);
  if (!validation.success) {
    notFound();
  }

  const service = await getServiceData(validation.data.id);

  if (!service) {
    notFound();
  }

  const relatedServices = await getRelatedServices(service.id);

  return (
    <ServiceDetailsClient
      service={service}
      relatedServices={relatedServices}
      vendorServices={[]} // Future optimization: Fetch more services from same vendor
    />
  );
}
