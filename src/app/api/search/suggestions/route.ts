import { NextResponse } from "next/server";
import { meiliClient, VENDORS_INDEX } from "@/lib/meilisearch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const index = meiliClient.index(VENDORS_INDEX);
    const search = await index.search(query, {
      limit: 5,
      attributesToRetrieve: ['businessName', 'categories'],
    });

    const suggestions = search.hits.map((hit: any) => ({
      text: hit.businessName,
      type: 'vendor',
      category: hit.categories?.[0]
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json([]);
  }
}
