import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, role, properties, challenge, score, source } = body;

    if (!name && !phone) {
      return NextResponse.json({ error: "Missing contact info" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Store in contact_leads table (service-level, no profile_id required)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from("contact_leads").insert({
      name: name ?? null,
      phone: phone ?? null,
      role: role ?? null,
      properties_count: properties ?? null,
      main_challenge: challenge ?? null,
      score: score ?? "medio",
      source: source ?? "landing_chatbot",
    });

    // If table doesn't exist yet, fall back silently — operator can add it via migration
    if (error && error.code !== "42P01") {
      console.error("contact lead insert error:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("contact route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
