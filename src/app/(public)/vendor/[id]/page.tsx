import { APP_CONFIG } from "@/config/app";
import { Metadata } from "next";
import VendorProfileClient from "../../marketplace/vendor/[id]/VendorProfileClient";
import { getVendorById } from "@/lib/marketplace";

async function getVendorData(id: string) {
  try {
    return await getVendorById(id);
  } catch (error) {
    console.error("Error fetching vendor data:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getVendorData(resolvedParams.id);
  const vendor = data?.vendor;

  if (!vendor) {
    return {
      title: "Vendor Not Found | Mana Events",
    };
  }

  const title = `${vendor.businessName} | ${vendor.city} Event Professional`;
  const description = vendor.description || `Book ${vendor.businessName} for your next event in ${vendor.city}. Verified professionals on Mana Events.`;
  const baseUrl = APP_CONFIG.url;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/marketplace/vendor/${resolvedParams.id}`,
    },
    openGraph: {
      title,
      description,
      images: [vendor.coverImage || "/og-image.jpg"],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [vendor.coverImage || "/og-image.jpg"],
    },
  };
}

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getVendorData(resolvedParams.id);

  if (!data?.vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Vendor Not Found</h1>
          <p className="text-muted-foreground mt-2">The profile you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return <VendorProfileClient vendor={data.vendor} similarVendors={data.similarVendors || []} />;
}
