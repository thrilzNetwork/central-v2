import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeProperty, isValidUrl } from "@/lib/scraper/universal";

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "URL inválida. Debe comenzar con http:// o https://" }, { status: 400 });
    }

    const property = await scrapeProperty(url);
    return NextResponse.json(property);
  } catch (err) {
    console.error("scrape-property error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al extraer la propiedad" },
      { status: 500 }
    );
  }
}
