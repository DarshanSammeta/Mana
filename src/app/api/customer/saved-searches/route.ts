import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SavedSearchService } from "@/services/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const searches = await SavedSearchService.getSavedSearches(session.user.id);
    return NextResponse.json(searches);
  } catch {
    return NextResponse.json({ error: "Failed to fetch saved searches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const search = await SavedSearchService.saveSearch(session.user.id, data);
    return NextResponse.json(search);
  } catch {
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }
}
