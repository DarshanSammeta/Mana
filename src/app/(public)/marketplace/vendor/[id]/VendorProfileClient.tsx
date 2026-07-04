import dynamic from "next/dynamic";
import { Suspense } from "react";
import { VendorProfileSkeleton } from "@/components/common/Skeletons";

const VendorProfileClient = dynamic(() => import("./VendorProfileClientContent"), {
  ssr: true,
  loading: () => <VendorProfileSkeleton />
});

export default function VendorProfileClientWrapper(props: any) {
  return (
    <Suspense fallback={<VendorProfileSkeleton />}>
      <VendorProfileClient {...props} />
    </Suspense>
  );
}
